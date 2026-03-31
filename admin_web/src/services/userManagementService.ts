import { supabase } from '../config/supabase';
import { isSupabaseConfigured } from '../core/supabase_config';
import type {
  AdminUserProfile,
  AuditEvent,
  PaginatedResponse,
  UpsertUserInput,
  UserListQuery,
  UserStatusUpdateInput,
  VerificationCase,
} from '../types/adminManagement';

const DEFAULT_PAGE_SIZE = 10;

const getPagination = (page = 0, pageSize = DEFAULT_PAGE_SIZE) => {
  const safePage = Math.max(0, page);
  const safePageSize = Math.max(1, Math.min(100, pageSize));
  const from = safePage * safePageSize;
  const to = from + safePageSize - 1;
  return { from, to };
};

const normalizeMaybeString = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const userManagementService = {
  async getUsers(query: UserListQuery = {}): Promise<PaginatedResponse<AdminUserProfile>> {
    if (!isSupabaseConfigured()) {
      return { data: [], total: 0 };
    }

    const { from, to } = getPagination(query.page, query.pageSize);

    let dbQuery = supabase
      .from('admin_user_profiles')
      .select(
        `
          *,
          organization:organizations(
            id,
            name,
            short_name,
            org_type,
            status
          )
        `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    if (query.status && query.status !== 'all') {
      dbQuery = dbQuery.eq('status', query.status);
    }

    if (query.userType && query.userType !== 'all') {
      dbQuery = dbQuery.eq('user_type', query.userType);
    }

    if (query.verificationTier && query.verificationTier !== 'all') {
      dbQuery = dbQuery.eq('verification_tier', query.verificationTier);
    }

    if (query.organizationId && query.organizationId !== 'all') {
      dbQuery = dbQuery.eq('organization_id', query.organizationId);
    }

    if (query.state && query.state.trim()) {
      dbQuery = dbQuery.ilike('state', `%${query.state.trim()}%`);
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      dbQuery = dbQuery.or(
        `full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,state.ilike.%${term}%,district.ilike.%${term}%,designation.ilike.%${term}%`
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

  async getUserById(userId: string): Promise<AdminUserProfile | null> {
    if (!isSupabaseConfigured() || !userId) {
      return null;
    }

    const { data, error } = await supabase
      .from('admin_user_profiles')
      .select(
        `
          *,
          organization:organizations(
            id,
            name,
            short_name,
            org_type,
            status,
            registration_code,
            state,
            district,
            contact_name,
            contact_email,
            contact_phone,
            website,
            created_at,
            updated_at
          )
        `
      )
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  },

  async upsertUser(input: UpsertUserInput): Promise<AdminUserProfile> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.rpc('admin_upsert_user_profile', {
      p_user_id: input.user_id ?? null,
      p_full_name: input.full_name.trim(),
      p_email: input.email.trim().toLowerCase(),
      p_phone: normalizeMaybeString(input.phone),
      p_user_type: input.user_type,
      p_status: input.status,
      p_verification_tier: input.verification_tier,
      p_organization_id: input.organization_id ?? null,
      p_state: input.state.trim(),
      p_district: normalizeMaybeString(input.district),
      p_designation: normalizeMaybeString(input.designation),
      p_avatar_url: normalizeMaybeString(input.avatar_url),
      p_temp_password: normalizeMaybeString(input.temp_password) ?? 'Welcome@123',
      p_reason: normalizeMaybeString(input.reason) ?? 'manual_upsert',
    });

    if (error) {
      throw error;
    }

    const userId = data as string;
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User saved but could not be loaded.');
    }

    return user;
  },

  async setUserStatus(input: UserStatusUpdateInput): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.rpc('admin_set_user_status', {
      p_user_id: input.userId,
      p_new_status: input.status,
      p_reason: input.reason,
    });

    if (error) {
      throw error;
    }

    return data === true;
  },

  async getUserStatusAudit(userId: string): Promise<AuditEvent[]> {
    if (!isSupabaseConfigured() || !userId) {
      return [];
    }

    const { data, error } = await supabase
      .from('user_status_audit')
      .select('*')
      .eq('user_id', userId)
      .order('changed_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return data ?? [];
  },

  async getUserVerificationCases(userId: string): Promise<VerificationCase[]> {
    if (!isSupabaseConfigured() || !userId) {
      return [];
    }

    const { data, error } = await supabase
      .from('verification_cases')
      .select(
        `
          *,
          assigned_admin:admin_user_profiles!verification_cases_assigned_admin_id_fkey(
            user_id,
            full_name,
            email
          )
        `
      )
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data ?? [];
  },
};
