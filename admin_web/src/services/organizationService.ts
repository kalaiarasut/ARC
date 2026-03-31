import { supabase } from '../config/supabase';
import { isSupabaseConfigured } from '../core/supabase_config';
import type {
  Organization,
  OrganizationListQuery,
  OrganizationStatus,
  OrganizationStatusUpdateInput,
  PaginatedResponse,
} from '../types/adminManagement';

const DEFAULT_PAGE_SIZE = 10;

const domainFrom = (contactEmail?: string, website?: string, fallback = 'coastsafe.in') => {
  const email = (contactEmail ?? '').trim().toLowerCase();
  if (email.includes('@')) {
    const part = email.split('@')[1]?.trim();
    if (part) return part;
  }

  const web = (website ?? '').trim().toLowerCase();
  if (web) {
    const withoutProtocol = web.replace(/^https?:\/\//, '').replace(/^www\./, '');
    const host = withoutProtocol.split('/')[0]?.trim();
    if (host) return host;
  }

  return fallback;
};

const getPagination = (page = 0, pageSize = DEFAULT_PAGE_SIZE) => {
  const safePage = Math.max(0, page);
  const safePageSize = Math.max(1, Math.min(100, pageSize));
  const from = safePage * safePageSize;
  const to = from + safePageSize - 1;
  return { from, to, safePageSize };
};

export interface OrganizationStats {
  total: number;
  approved: number;
  pendingApproval: number;
  activeNgo: number;
}

export const organizationService = {
  async getOrganizations(query: OrganizationListQuery = {}): Promise<PaginatedResponse<Organization>> {
    if (!isSupabaseConfigured()) {
      return { data: [], total: 0 };
    }

    const { from, to } = getPagination(query.page, query.pageSize);

    let dbQuery = supabase
      .from('organizations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (query.status && query.status !== 'all') {
      dbQuery = dbQuery.eq('status', query.status);
    }

    if (query.orgType && query.orgType !== 'all') {
      dbQuery = dbQuery.eq('org_type', query.orgType);
    }

    if (query.state && query.state.trim()) {
      dbQuery = dbQuery.ilike('state', `%${query.state.trim()}%`);
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      dbQuery = dbQuery.or(
        `name.ilike.%${term}%,short_name.ilike.%${term}%,registration_code.ilike.%${term}%,state.ilike.%${term}%,district.ilike.%${term}%,contact_name.ilike.%${term}%`
      );
    }

    const { data, count, error } = await dbQuery.range(from, to);

    if (error) {
      throw error;
    }

    return {
      data: data ?? [],
      total: count ?? 0,
    };
  },

  async getOrganizationById(id: string): Promise<Organization | null> {
    if (!isSupabaseConfigured() || !id) {
      return null;
    }

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  },

  async upsertOrganization(payload: Partial<Organization> & Pick<Organization, 'name' | 'short_name' | 'org_type' | 'state' | 'contact_name' | 'contact_email' | 'contact_phone' | 'registration_code'>): Promise<Organization> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const now = new Date().toISOString();
    const fallbackDomain = `${payload.registration_code}`.toLowerCase().replace(/[^a-z0-9]+/g, '') + '.org';
    const record = {
      ...payload,
      domain: (payload.domain && payload.domain.trim()) || domainFrom(payload.contact_email, payload.website ?? undefined, fallbackDomain),
      updated_at: now,
    };

    if (payload.id) {
      const { data, error } = await supabase
        .from('organizations')
        .update(record)
        .eq('id', payload.id)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      return data;
    }

    const { data, error } = await supabase
      .from('organizations')
      .insert([{ ...record, status: payload.status ?? 'pending_approval', created_at: now }])
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async setOrganizationStatus(input: OrganizationStatusUpdateInput): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.rpc('admin_set_organization_status', {
      p_organization_id: input.organizationId,
      p_new_status: input.status,
      p_reason: input.reason,
    });

    if (error) {
      throw error;
    }

    return data === true;
  },

  async getStats(): Promise<OrganizationStats> {
    if (!isSupabaseConfigured()) {
      return { total: 0, approved: 0, pendingApproval: 0, activeNgo: 0 };
    }

    const countByStatus = async (status: OrganizationStatus) => {
      const { count, error } = await supabase
        .from('organizations')
        .select('id', { count: 'exact', head: true })
        .eq('status', status);

      if (error) throw error;
      return count ?? 0;
    };

    const [{ count: totalCount, error: totalErr }, approved, pending, activeNgo] = await Promise.all([
      supabase.from('organizations').select('id', { count: 'exact', head: true }),
      countByStatus('approved'),
      countByStatus('pending_approval'),
      (async () => {
        const { count, error } = await supabase
          .from('organizations')
          .select('id', { count: 'exact', head: true })
          .eq('org_type', 'ngo')
          .eq('status', 'approved');
        if (error) throw error;
        return count ?? 0;
      })(),
    ]);

    if (totalErr) {
      throw totalErr;
    }

    return {
      total: totalCount ?? 0,
      approved,
      pendingApproval: pending,
      activeNgo,
    };
  },
};
