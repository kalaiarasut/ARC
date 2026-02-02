import { supabase } from '../config/supabase';
import type { HazardReport, FilterOptions, DashboardStats } from '../types/hazard';

export const hazardService = {
  async getReports(filters?: Partial<FilterOptions>, page = 0, limit = 50): Promise<HazardReport[]> {
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
    const { data: allReports, error } = await supabase
      .from('hazard_reports')
      .select('*');

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
        'resolved': 0,
      },
    };

    allReports.forEach(report => {
      stats.byHazardType[report.hazard_type]++;
      if (report.urgency_level) {
        stats.byUrgency[report.urgency_level]++;
      }
      stats.byStatus[report.status]++;
    });

    return stats;
  },

  subscribeToReports(callback: (report: HazardReport) => void) {
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
};
