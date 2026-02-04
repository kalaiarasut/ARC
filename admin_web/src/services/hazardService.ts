import { supabase } from '../config/supabase';
import { isSupabaseConfigured } from '../core/supabase_config';
import type { HazardReport, FilterOptions, DashboardStats, ReportStatus } from '../types/hazard';

export interface PagedResult<T> {
  data: T[];
  total: number;
}

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
        `description.ilike.%${q}%,user_name.ilike.%${q}%,hazard_type.ilike.%${q}%`
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
      query = query.or(`description.ilike.%${filters.searchQuery}%,user_name.ilike.%${filters.searchQuery}%`);
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

    const stats: DashboardStats = {
      totalReports: allReports.length,
      pendingReports: allReports.filter(r => r.status === 'pending').length,
      highRiskReports: allReports.filter(r => r.is_high_risk).length,
      reportsToday: allReports.filter(r => new Date(r.created_at) >= todayStart).length,
      reportsThisWeek: allReports.filter(r => new Date(r.created_at) >= weekStart).length,
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

    return stats;
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
