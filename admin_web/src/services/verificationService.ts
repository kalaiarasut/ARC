import { supabase } from '../config/supabase';
import { isSupabaseConfigured } from '../core/supabase_config';
import type {
  PaginatedResponse,
  VerificationCase,
  VerificationDocument,
  VerificationListQuery,
  VerificationStatusUpdateInput,
} from '../types/adminManagement';

const DEFAULT_PAGE_SIZE = 10;

const getPagination = (page = 0, pageSize = DEFAULT_PAGE_SIZE) => {
  const safePage = Math.max(0, page);
  const safePageSize = Math.max(1, Math.min(100, pageSize));
  const from = safePage * safePageSize;
  const to = from + safePageSize - 1;
  return { from, to };
};

export interface VerificationStats {
  total: number;
  newSubmission: number;
  awaitingRework: number;
  escalated: number;
  approved: number;
}

export const verificationService = {
  async getVerificationCases(query: VerificationListQuery = {}): Promise<PaginatedResponse<VerificationCase>> {
    if (!isSupabaseConfigured()) {
      return { data: [], total: 0 };
    }

    const { from, to } = getPagination(query.page, query.pageSize);

    let dbQuery = supabase
      .from('verification_cases')
      .select(
        `
          *,
          user:admin_user_profiles!verification_cases_user_id_fkey(
            user_id,
            full_name,
            email,
            avatar_url,
            status,
            verification_tier
          ),
          assigned_admin:admin_user_profiles!verification_cases_assigned_admin_id_fkey(
            user_id,
            full_name,
            email
          )
        `,
        { count: 'exact' }
      )
      .order('submitted_at', { ascending: false });

    if (query.status && query.status !== 'all') {
      dbQuery = dbQuery.eq('status', query.status);
    }

    if (query.checkType && query.checkType !== 'all') {
      dbQuery = dbQuery.eq('check_type', query.checkType);
    }

    if (query.assignedAdminId && query.assignedAdminId !== 'all') {
      dbQuery = dbQuery.eq('assigned_admin_id', query.assignedAdminId);
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      dbQuery = dbQuery.or(`notes.ilike.%${term}%,check_type.ilike.%${term}%`);
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

  async setVerificationStatus(input: VerificationStatusUpdateInput): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.rpc('admin_set_verification_status', {
      p_case_id: input.caseId,
      p_new_status: input.status,
      p_reason: input.reason,
      p_notes: input.notes ?? null,
    });

    if (error) {
      throw error;
    }

    return data === true;
  },

  async getVerificationDocuments(caseId: string): Promise<VerificationDocument[]> {
    if (!isSupabaseConfigured() || !caseId) {
      return [];
    }

    const { data, error } = await supabase
      .from('verification_documents')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data ?? [];
  },

  async getStats(): Promise<VerificationStats> {
    if (!isSupabaseConfigured()) {
      return { total: 0, newSubmission: 0, awaitingRework: 0, escalated: 0, approved: 0 };
    }

    const countByStatus = async (status: string) => {
      const { count, error } = await supabase
        .from('verification_cases')
        .select('id', { count: 'exact', head: true })
        .eq('status', status);
      if (error) throw error;
      return count ?? 0;
    };

    const [{ count: totalCount, error: totalErr }, newSubmission, awaitingRework, escalated, approved] = await Promise.all([
      supabase.from('verification_cases').select('id', { count: 'exact', head: true }),
      countByStatus('new_submission'),
      countByStatus('awaiting_rework'),
      countByStatus('escalated'),
      countByStatus('approved'),
    ]);

    if (totalErr) {
      throw totalErr;
    }

    return {
      total: totalCount ?? 0,
      newSubmission,
      awaitingRework,
      escalated,
      approved,
    };
  },
};
