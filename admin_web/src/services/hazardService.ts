import { supabase } from '../config/supabase';
import { isSupabaseConfigured } from '../core/supabase_config';
import type {
  HazardReport,
  FilterOptions,
  DashboardStats,
  ReportStatus,
  ReportAiAnalysis,
  ReportIntegritySnapshot,
  ReportIntegritySignal,
  ReportSubmissionEvent,
  DuplicateClusterMember,
} from '../types/hazard';

export interface PagedResult<T> {
  data: T[];
  total: number;
}

export interface CuratedSeedResult {
  seed_version: string;
  total_reports: number;
  reports_with_media: number;
  languages: string[];
  duplicate_record_key: string;
  replace_existing: boolean;
}

export interface ClearedCuratedSeedResult {
  deleted_reports: number;
  deleted_media_objects: number;
  deleted_users: number;
}

export interface TranslationQueueStats {
  pending: number;
  processing: number;
  failed: number;
  completed: number;
  skipped: number;
  active: number;
  total_known: number;
  fetched_at: string;
}

export interface AiScoringQueueStats {
  pending: number;
  processing: number;
  partial: number;
  failed: number;
  completed: number;
  active: number;
  total_known: number;
  fetched_at: string;
}

export interface AiWorkerRunResult {
  claimed: number;
  processed: number;
  completed: number;
  partial: number;
  failed: number;
  batch_size: number;
  concurrency: number;
}

export interface VideoAiWorkflowTriggerResult {
  ok: boolean;
  workflow_id: string;
  ref: string;
  report_ai_video_worker_limit: number;
  report_ai_video_frame_count: number;
}

export interface FailedTranslationQueueItem {
  id: string;
  hazard_type: HazardReport['hazard_type'];
  user_name: string | null;
  description: string;
  translation_attempts: number | null;
  translation_last_error: string | null;
  translation_last_attempt_at: string | null;
  translation_next_retry_at: string | null;
}

export interface AiAttentionQueueItem {
  id: string;
  hazard_type: HazardReport['hazard_type'];
  description: string;
  translated_english?: string | null;
  ai_analysis: Pick<ReportAiAnalysis, 'analysis_status' | 'last_error' | 'operational_score' | 'score_bucket'> | null;
}

const REPORT_SELECT = '*, ai_analysis:report_ai_analysis(*)';

const normalizeReportRow = (row: any): HazardReport => {
  const nested = Array.isArray(row?.ai_analysis)
    ? (row.ai_analysis[0] ?? null)
    : (row?.ai_analysis ?? null);

  return {
    ...row,
    ai_analysis: nested as ReportAiAnalysis | null,
  } as HazardReport;
};

const normalizeIntegritySnapshotRow = (row: any): ReportIntegritySnapshot => ({
  report_id: String(row.report_id),
  integrity_severity: row.integrity_severity ?? 'none',
  integrity_score: Number(row.integrity_score ?? 0),
  active_signal_count: Number(row.active_signal_count ?? 0),
  active_signal_types: Array.isArray(row.active_signal_types) ? row.active_signal_types.map(String) : [],
  duplicate_cluster_id: row.duplicate_cluster_id ?? null,
  duplicate_cluster_size: Number(row.duplicate_cluster_size ?? 0),
  latest_submission_event_type: row.latest_submission_event_type ?? null,
  latest_submission_result_code: row.latest_submission_result_code ?? null,
  latest_submission_at: row.latest_submission_at ?? null,
});

const compareAiScoreDesc = (left: HazardReport, right: HazardReport) => {
  const leftScore = left.ai_analysis?.operational_score ?? -1;
  const rightScore = right.ai_analysis?.operational_score ?? -1;
  if (rightScore !== leftScore) return rightScore - leftScore;
  return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
};

const compareAiScoreAsc = (left: HazardReport, right: HazardReport) => {
  const leftScore = left.ai_analysis?.operational_score ?? Number.MAX_SAFE_INTEGER;
  const rightScore = right.ai_analysis?.operational_score ?? Number.MAX_SAFE_INTEGER;
  if (leftScore !== rightScore) return leftScore - rightScore;
  return new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
};

const compareIntegrityScoreDesc = (left: HazardReport, right: HazardReport) => {
  const leftScore = left.integrity_snapshot?.integrity_score ?? -1;
  const rightScore = right.integrity_snapshot?.integrity_score ?? -1;
  if (rightScore !== leftScore) return rightScore - leftScore;
  return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
};

const compareIntegrityScoreAsc = (left: HazardReport, right: HazardReport) => {
  const leftScore = left.integrity_snapshot?.integrity_score ?? Number.MAX_SAFE_INTEGER;
  const rightScore = right.integrity_snapshot?.integrity_score ?? Number.MAX_SAFE_INTEGER;
  if (leftScore !== rightScore) return leftScore - rightScore;
  return new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
};

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

const getIntegritySnapshots = async (reportIds: string[]): Promise<Map<string, ReportIntegritySnapshot>> => {
  if (!reportIds.length) {
    return new Map();
  }

  const { data, error } = await supabase.rpc('admin_get_report_integrity_snapshots', {
    p_report_ids: reportIds,
  });

  if (error) {
    console.error('Error fetching report integrity snapshots:', error);
    throw error;
  }

  const snapshotMap = new Map<string, ReportIntegritySnapshot>();
  for (const row of (data || []) as any[]) {
    const snapshot = normalizeIntegritySnapshotRow(row);
    snapshotMap.set(snapshot.report_id, snapshot);
  }

  return snapshotMap;
};

const enrichReportsWithIntegrity = async (rows: HazardReport[]): Promise<HazardReport[]> => {
  if (!rows.length) {
    return rows;
  }

  const snapshots = await getIntegritySnapshots(rows.map((report) => report.id));
  return rows.map((report) => ({
    ...report,
    integrity_snapshot: snapshots.get(report.id) ?? null,
  }));
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

    const scoreSortActive = filters?.sortBy === 'score_desc' || filters?.sortBy === 'score_asc';
    const scoreBucketFilterActive = Boolean(filters?.scoreBuckets && filters.scoreBuckets.length > 0);
    const integritySortActive = filters?.sortBy === 'integrity_desc' || filters?.sortBy === 'integrity_asc';
    const integritySeverityFilterActive = Boolean(filters?.integritySeverities && filters.integritySeverities.length > 0);
    const integrityFlagFilterActive = Boolean(filters?.suspiciousOnly || filters?.duplicateOnly || filters?.sharedDeviceOnly);
    const manualIntegrityProcessingActive = integritySortActive || integritySeverityFilterActive || integrityFlagFilterActive;
    const fetchAll = (options?.fetchAll ?? false) || scoreSortActive || scoreBucketFilterActive || manualIntegrityProcessingActive;
    const maxRows = options?.maxRows ?? 5000;

    let query = supabase
      .from('hazard_reports')
      .select(REPORT_SELECT, { count: 'exact' })
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

    let rows = await enrichReportsWithIntegrity((data || []).map(normalizeReportRow));

    if (scoreBucketFilterActive) {
      const selectedBuckets = new Set(filters?.scoreBuckets ?? []);
      rows = rows.filter((report) => {
        const bucket = report.ai_analysis?.score_bucket;
        return Boolean(bucket && selectedBuckets.has(bucket));
      });
    }

    if (filters?.suspiciousOnly) {
      rows = rows.filter((report) => (report.integrity_snapshot?.active_signal_count ?? 0) > 0);
    }

    if (filters?.duplicateOnly) {
      rows = rows.filter((report) => (report.integrity_snapshot?.duplicate_cluster_size ?? 0) > 1);
    }

    if (filters?.sharedDeviceOnly) {
      rows = rows.filter((report) =>
        (report.integrity_snapshot?.active_signal_types ?? []).includes('multi_account_same_device')
      );
    }

    if (integritySeverityFilterActive) {
      const selectedSeverities = new Set(filters?.integritySeverities ?? []);
      rows = rows.filter((report) => {
        const severity = report.integrity_snapshot?.integrity_severity ?? 'none';
        return selectedSeverities.has(severity);
      });
    }

    if (filters?.sortBy === 'score_desc') {
      rows = [...rows].sort(compareAiScoreDesc);
    } else if (filters?.sortBy === 'score_asc') {
      rows = [...rows].sort(compareAiScoreAsc);
    } else if (filters?.sortBy === 'integrity_desc') {
      rows = [...rows].sort(compareIntegrityScoreDesc);
    } else if (filters?.sortBy === 'integrity_asc') {
      rows = [...rows].sort(compareIntegrityScoreAsc);
    }

    const manualFilterActive = scoreBucketFilterActive || integritySeverityFilterActive || integrityFlagFilterActive;
    const total = manualFilterActive ? rows.length : (count || 0);

    if (fetchAll && !options?.fetchAll) {
      const start = page * limit;
      rows = rows.slice(start, start + limit);
    }

    return {
      data: rows,
      total,
    };
  },

  async getReports(filters?: Partial<FilterOptions>, page = 0, limit = 50): Promise<HazardReport[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    let query = supabase
      .from('hazard_reports')
      .select(REPORT_SELECT)
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

    return enrichReportsWithIntegrity((data || []).map(normalizeReportRow));
  },

  async getReportById(id: string): Promise<HazardReport | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data, error } = await supabase
      .from('hazard_reports')
      .select(REPORT_SELECT)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching report:', error);
      return null;
    }

    const [report] = await enrichReportsWithIntegrity([normalizeReportRow(data)]);
    return report ?? null;
  },

  async getReportIntegritySignals(reportId: string): Promise<ReportIntegritySignal[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await supabase
      .from('report_integrity_signals')
      .select('*')
      .eq('report_id', reportId)
      .order('detected_at', { ascending: false });

    if (error) {
      console.error('Error fetching report integrity signals:', error);
      throw error;
    }

    return (data || []) as ReportIntegritySignal[];
  },

  async getReportSubmissionEvents(reportId: string, limit = 25): Promise<ReportSubmissionEvent[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await supabase.rpc('admin_get_report_submission_events', {
      p_report_id: reportId,
      p_limit: limit,
    });

    if (error) {
      console.error('Error fetching report submission events:', error);
      throw error;
    }

    return (data || []) as ReportSubmissionEvent[];
  },

  async getDuplicateClusterMembers(reportId: string): Promise<DuplicateClusterMember[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await supabase.rpc('admin_get_report_duplicate_cluster_members', {
      p_report_id: reportId,
    });

    if (error) {
      console.error('Error fetching duplicate cluster members:', error);
      throw error;
    }

    return (data || []) as DuplicateClusterMember[];
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

  async analyzeReportAi(reportId: string, options?: { force?: boolean }): Promise<{
    report_id: string;
    ai_analysis: ReportAiAnalysis;
  }> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    return invokeEdgeFunction('analyze_report_ai', {
      report_id: reportId,
      force: options?.force ?? false,
    });
  },

  async getTranslationQueueStats(): Promise<TranslationQueueStats> {
    if (!isSupabaseConfigured()) {
      return {
        pending: 0,
        processing: 0,
        failed: 0,
        completed: 0,
        skipped: 0,
        active: 0,
        total_known: 0,
        fetched_at: new Date().toISOString(),
      };
    }

    const countByStatus = async (status: 'pending' | 'processing' | 'failed' | 'completed' | 'skipped') => {
      const { count, error } = await supabase
        .from('hazard_reports')
        .select('id', { count: 'exact', head: true })
        .eq('translation_status', status);

      if (error) {
        throw error;
      }

      return count ?? 0;
    };

    const [pending, processing, failed, completed, skipped] = await Promise.all([
      countByStatus('pending'),
      countByStatus('processing'),
      countByStatus('failed'),
      countByStatus('completed'),
      countByStatus('skipped'),
    ]);

    return {
      pending,
      processing,
      failed,
      completed,
      skipped,
      active: pending + processing + failed,
      total_known: pending + processing + failed + completed + skipped,
      fetched_at: new Date().toISOString(),
    };
  },

  async getFailedTranslationReports(limit = 40): Promise<FailedTranslationQueueItem[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await supabase
      .from('hazard_reports')
      .select(`
        id,
        hazard_type,
        user_name,
        description,
        translation_attempts,
        translation_last_error,
        translation_last_attempt_at,
        translation_next_retry_at
      `)
      .eq('translation_status', 'failed')
      .order('translation_last_attempt_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching failed translation reports:', error);
      throw error;
    }

    return ((data || []) as any[]).map((row) => ({
      id: String(row.id),
      hazard_type: row.hazard_type,
      user_name: row.user_name ?? null,
      description: row.description ?? '',
      translation_attempts: row.translation_attempts ?? null,
      translation_last_error: row.translation_last_error ?? null,
      translation_last_attempt_at: row.translation_last_attempt_at ?? null,
      translation_next_retry_at: row.translation_next_retry_at ?? null,
    }));
  },

  async getAiQueueStats(): Promise<AiScoringQueueStats> {
    if (!isSupabaseConfigured()) {
      return {
        pending: 0,
        processing: 0,
        partial: 0,
        failed: 0,
        completed: 0,
        active: 0,
        total_known: 0,
        fetched_at: new Date().toISOString(),
      };
    }

    const countByStatus = async (status: 'pending' | 'processing' | 'partial' | 'failed' | 'completed') => {
      const { count, error } = await supabase
        .from('report_ai_analysis')
        .select('report_id', { count: 'exact', head: true })
        .eq('analysis_status', status);

      if (error) {
        throw error;
      }

      return count ?? 0;
    };

    const [pending, processing, partial, failed, completed] = await Promise.all([
      countByStatus('pending'),
      countByStatus('processing'),
      countByStatus('partial'),
      countByStatus('failed'),
      countByStatus('completed'),
    ]);

    return {
      pending,
      processing,
      partial,
      failed,
      completed,
      active: pending + processing + partial + failed,
      total_known: pending + processing + partial + failed + completed,
      fetched_at: new Date().toISOString(),
    };
  },

  async getAiAttentionReports(limit = 40): Promise<AiAttentionQueueItem[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data: aiRows, error: aiError } = await supabase
      .from('report_ai_analysis')
      .select('report_id, analysis_status, updated_at')
      .in('analysis_status', ['failed', 'partial'])
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (aiError) {
      console.error('Error fetching AI attention report ids:', aiError);
      throw aiError;
    }

    const reportIds = (aiRows || []).map((row: any) => String(row.report_id ?? '')).filter(Boolean);
    if (!reportIds.length) {
      return [];
    }

    const { data, error } = await supabase
      .from('hazard_reports')
      .select(`
        id,
        hazard_type,
        description,
        translated_english,
        ai_analysis:report_ai_analysis(
          analysis_status,
          last_error,
          operational_score,
          score_bucket
        )
      `)
      .in('id', reportIds);

    if (error) {
      console.error('Error fetching AI attention reports:', error);
      throw error;
    }

    const normalized = ((data || []) as any[]).map((row) => {
      const nested = Array.isArray(row?.ai_analysis)
        ? (row.ai_analysis[0] ?? null)
        : (row?.ai_analysis ?? null);

      return {
        id: String(row.id),
        hazard_type: row.hazard_type,
        description: row.description ?? '',
        translated_english: row.translated_english ?? null,
        ai_analysis: nested
          ? {
              analysis_status: nested.analysis_status ?? null,
              last_error: nested.last_error ?? null,
              operational_score: Number(nested.operational_score ?? 0),
              score_bucket: nested.score_bucket ?? 'low',
            }
          : null,
      } as AiAttentionQueueItem;
    });
    const order = new Map(reportIds.map((id, index) => [id, index]));
    return normalized.sort((left, right) => (order.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(right.id) ?? Number.MAX_SAFE_INTEGER));
  },

  async runAiWorker(options?: { limit?: number; concurrency?: number }): Promise<AiWorkerRunResult> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    return invokeEdgeFunction<AiWorkerRunResult>('admin_run_report_ai_worker', {
      limit: options?.limit ?? 5,
      concurrency: options?.concurrency ?? 2,
    });
  },

  async triggerVideoAiWorkflow(options?: { limit?: number; frameCount?: number; ref?: string }): Promise<VideoAiWorkflowTriggerResult> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    return invokeEdgeFunction<VideoAiWorkflowTriggerResult>('admin_trigger_video_ai_workflow', {
      report_ai_video_worker_limit: options?.limit ?? 5,
      report_ai_video_frame_count: options?.frameCount ?? 3,
      ref: options?.ref,
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

  async seedCuratedReports(options?: {
    replaceExisting?: boolean;
  }): Promise<CuratedSeedResult> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    return invokeEdgeFunction<CuratedSeedResult>('admin_seed_curated_reports', {
      replace_existing: options?.replaceExisting ?? true,
    });
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

  async clearCuratedSeedReports(): Promise<ClearedCuratedSeedResult> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    return invokeEdgeFunction<ClearedCuratedSeedResult>('admin_clear_curated_seed', {});
  },
};
