import { supabase } from '../config/supabase';
import { isSupabaseConfigured } from '../core/supabase_config';
import type { HazardReport, FilterOptions, DashboardStats, ReportStatus } from '../types/hazard';

export interface PagedResult<T> {
  data: T[];
  total: number;
}

const SUPABASE_URL = (
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_PUBLIC_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  ''
).trim();

const SUPABASE_ANON_KEY = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_KEY ||
  ''
).trim();

const getFunctionAuthHeaders = async () => {
  let { data, error } = await supabase.auth.getSession();
  let session = data.session;

  const expiresAtMs = session?.expires_at ? session.expires_at * 1000 : 0;
  const needsRefresh = !session || (expiresAtMs > 0 && expiresAtMs - Date.now() < 60_000);

  if (needsRefresh) {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error) {
      throw new Error('Session expired. Please log in again.');
    }
    session = refreshed.data.session;
    error = null;
  }

  const accessToken = session?.access_token;

  if (error || !accessToken) {
    throw new Error('Missing admin session. Please log in again.');
  }

  return {
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    apikey: SUPABASE_ANON_KEY,
    'x-supabase-auth': `Bearer ${accessToken}`,
  };
};

const invokeEdgeFunction = async <TResponse>(functionName: string, body: Record<string, unknown>): Promise<TResponse> => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables are missing.');
  }

  const headers = await getFunctionAuthHeaders();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload?.error ||
      payload?.message ||
      `Edge Function ${functionName} failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as TResponse;
};

export const hazardService = {
  async getReportsWithCount(
    filters?: Partial<FilterOptions>,
    page = 0,
    limit = 50,
    options?: { fetchAll?: boolean; maxRows?: number }
  ): Promise<PagedResult<HazardReport>> {
    if (!isSupabaseConfigured()) {
      return { data: [], total: 0 };
    }

    const fetchAll = options?.fetchAll ?? false;
    const maxRows = options?.maxRows ?? 5000;

    let query = supabase
      .from('hazard_reports')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.hazardTypes && filters.hazardTypes.length > 0) {
      query = query.in('hazard_type', filters.hazardTypes);
    }

    if (filters?.statuses && filters.statuses.length > 0) {
      query = query.in('status', filters.statuses);
    }

    if (filters?.urgencyLevels && filters.urgencyLevels.length > 0) {
      query = query.in('urgency_level', filters.urgencyLevels);
    }

    if (filters?.isHighRisk !== null && filters?.isHighRisk !== undefined) {
      query = query.eq('is_high_risk', filters.isHighRisk);
    }

    // Media filtering: handle true/false explicitly.
    // Note: empty arrays in Postgres are not NULL, so `hasMedia=false` should include NULL or empty.
    if (filters?.hasMedia !== null && filters?.hasMedia !== undefined) {
      if (filters.hasMedia) {
        query = query.not('media_urls', 'is', null);
      } else {
        // "media_urls.eq.{}" matches empty arrays; combined with NULL
        query = query.or('media_urls.is.null,media_urls.eq.{}');
      }
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    if (filters?.searchQuery) {
      const q = filters.searchQuery;
      query = query.or(
        `description.ilike.%${q}%,translated_english.ilike.%${q}%,user_name.ilike.%${q}%,hazard_type.ilike.%${q}%`
      );
    }

    if (fetchAll) {
      query = query.range(0, Math.max(0, maxRows - 1));
    } else {
      query = query.range(page * limit, (page + 1) * limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }

    return {
      data: data || [],
      total: count || 0,
    };
  },

  async getReports(filters?: Partial<FilterOptions>, page = 0, limit = 50): Promise<HazardReport[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    let query = supabase
      .from('hazard_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (filters?.hazardTypes && filters.hazardTypes.length > 0) {
      query = query.in('hazard_type', filters.hazardTypes);
    }

    if (filters?.statuses && filters.statuses.length > 0) {
      query = query.in('status', filters.statuses);
    }

    if (filters?.urgencyLevels && filters.urgencyLevels.length > 0) {
      query = query.in('urgency_level', filters.urgencyLevels);
    }

    if (filters?.isHighRisk !== null && filters?.isHighRisk !== undefined) {
      query = query.eq('is_high_risk', filters.isHighRisk);
    }

    if (filters?.hasMedia) {
      query = query.not('media_urls', 'is', null);
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    if (filters?.searchQuery) {
      query = query.or(`description.ilike.%${filters.searchQuery}%,translated_english.ilike.%${filters.searchQuery}%,user_name.ilike.%${filters.searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }

    return data || [];
  },

  async getReportById(id: string): Promise<HazardReport | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data, error } = await supabase
      .from('hazard_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching report:', error);
      return null;
    }

    return data;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data: allReports, error } = await supabase
      .from('hazard_reports')
      .select('*')
      .returns<HazardReport[]>();

    if (error || !allReports) {
      throw error || new Error('No data');
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previousWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const stats: DashboardStats = {
      totalReports: allReports.length,
      pendingReports: allReports.filter(r => r.status === 'pending').length,
      highRiskReports: allReports.filter(r => r.is_high_risk).length,
      reportsToday: allReports.filter(r => new Date(r.created_at) >= todayStart).length,
      reportsThisWeek: allReports.filter(r => new Date(r.created_at) >= weekStart).length,
      weeklyTrendPercent: 0,
      hotspotClusters: 0,
      falsePositiveRate: 0,
      avgVerificationHours: 0,
      byHazardType: {
        'High Waves': 0,
        'Tsunami': 0,
        'Storm': 0,
        'Flood': 0,
        'Other': 0,
      },
      byUrgency: {
        'Low': 0,
        'Medium': 0,
        'High': 0,
      },
      byStatus: {
        'pending': 0,
        'verified': 0,
        'rejected': 0,
        'resolved': 0,
      },
    };

    allReports.forEach(report => {
      stats.byHazardType[report.hazard_type]++;
      if (report.urgency_level) {
        stats.byUrgency[report.urgency_level]++;
      }
      // Keep stats resilient if older rows contain unexpected values.
      if (report.status in stats.byStatus) {
        stats.byStatus[report.status as ReportStatus]++;
      }
    });

    const thisWeekReports = allReports.filter(r => new Date(r.created_at) >= weekStart);
    const previousWeekReports = allReports.filter(r => {
      const created = new Date(r.created_at);
      return created >= previousWeekStart && created < weekStart;
    });

    const previousCount = previousWeekReports.length;
    stats.weeklyTrendPercent = previousCount === 0
      ? (thisWeekReports.length > 0 ? 100 : 0)
      : ((thisWeekReports.length - previousCount) / previousCount) * 100;

    // Simple hotspot clustering by grid cell in weekly reports.
    const grid = new Map<string, number>();
    for (const r of thisWeekReports) {
      const latBucket = Math.round(r.latitude * 20) / 20; // ~0.05 deg
      const lonBucket = Math.round(r.longitude * 20) / 20;
      const key = `${latBucket.toFixed(2)},${lonBucket.toFixed(2)}`;
      grid.set(key, (grid.get(key) ?? 0) + 1);
    }
    stats.hotspotClusters = Array.from(grid.values()).filter((count) => count >= 3).length;

    stats.falsePositiveRate = stats.totalReports === 0
      ? 0
      : (stats.byStatus.rejected / stats.totalReports) * 100;

    const verifiedOrResolved = allReports.filter(r => r.status === 'verified' || r.status === 'resolved');
    if (verifiedOrResolved.length > 0) {
      const totalAgeHours = verifiedOrResolved.reduce((sum, r) => {
        const ageMs = now.getTime() - new Date(r.created_at).getTime();
        return sum + Math.max(0, ageMs / (1000 * 60 * 60));
      }, 0);
      stats.avgVerificationHours = totalAgeHours / verifiedOrResolved.length;
    }

    return stats;
  },

  async getAuditStats(): Promise<{
    total: number;
    toVerified: number;
    toRejected: number;
    toResolved: number;
    toPending: number;
  }> {
    if (!isSupabaseConfigured()) {
      return { total: 0, toVerified: 0, toRejected: 0, toResolved: 0, toPending: 0 };
    }
    
    const { data, error } = await supabase
      .from('report_status_audit')
      .select('new_status');
      
    if (error || !data) {
       console.error('Error fetching audit stats:', error);
       return { total: 0, toVerified: 0, toRejected: 0, toResolved: 0, toPending: 0 };
    }
    
    const stats = { total: data.length, toVerified: 0, toRejected: 0, toResolved: 0, toPending: 0 };
    data.forEach(log => {
      if (log.new_status === 'verified') stats.toVerified++;
      else if (log.new_status === 'rejected') stats.toRejected++;
      else if (log.new_status === 'resolved') stats.toResolved++;
      else if (log.new_status === 'pending') stats.toPending++;
    });
    
    return stats;
  },

  async getAuditLogs(
    page = 0,
    limit = 50,
    filters?: { email?: string; reportId?: string }
  ): Promise<PagedResult<import('../types/hazard').ReportAuditLog>> {
    if (!isSupabaseConfigured()) {
      return { data: [], total: 0 };
    }

    let query = supabase
      .from('report_status_audit')
      .select('*', { count: 'exact' })
      .order('changed_at', { ascending: false });

    if (filters?.email) {
      query = query.ilike('admin_email', `%${filters.email}%`);
    }
    
    if (filters?.reportId) {
      query = query.eq('report_id', filters.reportId);
    }
    
    query = query.range(page * limit, (page + 1) * limit - 1);
    
    const { data, error, count } = await query;
    if (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
    return { data: data || [], total: count || 0 };
  },

  async getReportAuditLogs(reportId: string): Promise<import('../types/hazard').ReportAuditLog[]> {
    const { data } = await this.getAuditLogs(0, 50, { reportId });
    return data;
  },

  async setReportStatus(reportId: string, status: ReportStatus): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('hazard_reports')
      .update({ status })
      .eq('id', reportId);

    if (error) {
      console.error('Error updating report status:', error);
      throw error;
    }
  },

  async verifyReport(reportId: string): Promise<void> {
    return this.setReportStatus(reportId, 'verified');
  },

  async rejectReport(reportId: string): Promise<void> {
    return this.setReportStatus(reportId, 'rejected');
  },

  async translateReportToEnglish(reportId: string, options?: { force?: boolean }): Promise<{
    report_id: string;
    original_description: string;
    detected_language: string | null;
    translated_english: string | null;
    translation_status: 'completed' | 'failed' | 'skipped';
    translation_attempts: number;
    translation_provider: string | null;
    translation_model: string | null;
    translated_at: string | null;
  }> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    return invokeEdgeFunction('translate_report_for_admin', {
      report_id: reportId,
      force: options?.force ?? false,
    });
  },

  subscribeToReports(callback: (report: HazardReport) => void) {
    if (!isSupabaseConfigured()) {
      return {
        // minimal channel-like shape used by callers
        unsubscribe: () => {},
      } as any;
    }

    return supabase
      .channel('hazard_reports_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'hazard_reports',
        },
        (payload) => {
          callback(payload.new as HazardReport);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'hazard_reports',
        },
        (payload) => {
          callback(payload.new as HazardReport);
        }
      )
      .subscribe();
  },

  async seedMockReports(params?: {
    clusters?: number;
    reportsPerCluster?: number;
    centerLat?: number;
    centerLon?: number;
    clusterSpreadMeters?: number;
    ageMinutes?: number;
  }): Promise<number> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.rpc('admin_seed_mock_hazard_reports', {
      p_clusters: params?.clusters ?? 3,
      p_reports_per_cluster: params?.reportsPerCluster ?? 25,
      p_center_lat: params?.centerLat ?? 13.08,
      p_center_lon: params?.centerLon ?? 80.27,
      p_cluster_spread_meters: params?.clusterSpreadMeters ?? 350,
      p_age_minutes: params?.ageMinutes ?? 45,
    });

    if (error) {
      console.error('Seed mock reports error:', error);
      throw error;
    }

    return Number(data ?? 0);
  },

  async clearMockReports(): Promise<number> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.rpc('admin_clear_mock_hazard_reports');
    if (error) {
      console.error('Clear mock reports error:', error);
      throw error;
    }
    return Number(data ?? 0);
  },
};
