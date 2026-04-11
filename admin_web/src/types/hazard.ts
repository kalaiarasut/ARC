export type HazardType = 'High Waves' | 'Tsunami' | 'Storm' | 'Flood' | 'Other';
export type UrgencyLevel = 'Low' | 'Medium' | 'High';
export type ReportStatus = 'pending' | 'verified' | 'rejected' | 'resolved';
export type ReportTranslationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
export type ImmediateDangerStatus = 'yes' | 'no' | 'not_sure';
export type AffectedPeopleBand = 'unknown' | '1_5' | '6_20' | '21_50' | '50_plus';
export type ReportAiAnalysisStatus = 'pending' | 'processing' | 'completed' | 'partial' | 'failed';
export type ReportAiScoreBucket = 'critical' | 'high' | 'medium' | 'low';
export type ReportIntegritySeverity = 'none' | 'low' | 'medium' | 'high' | 'critical';
export type ReportSubmissionEventType = 'accepted' | 'blocked' | 'duplicate_linked';

export interface ReportAiAnalysis {
  report_id: string;
  analysis_status: ReportAiAnalysisStatus;
  operational_score: number;
  score_bucket: ReportAiScoreBucket;
  text_score: number;
  image_score: number;
  audio_score: number;
  video_score: number;
  metadata_score: number;
  confidence_score: number;
  recommended_action: string | null;
  recommended_status: ReportStatus | null;
  summary: string | null;
  extracted_signals_json?: Record<string, unknown> | null;
  scoring_reasons_json?: string[] | null;
  media_evidence_json?: Record<string, unknown> | null;
  processed_modalities_json?: Record<string, boolean> | null;
  provider_primary?: string | null;
  model_primary?: string | null;
  provider_fallback?: string | null;
  model_fallback?: string | null;
  analysis_attempts?: number | null;
  last_error?: string | null;
  last_attempt_at?: string | null;
  next_retry_at?: string | null;
  needs_recompute?: boolean | null;
  analyzed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ReportIntegritySnapshot {
  report_id: string;
  integrity_severity: ReportIntegritySeverity;
  integrity_score: number;
  active_signal_count: number;
  active_signal_types: string[];
  duplicate_cluster_id?: string | null;
  duplicate_cluster_size: number;
  latest_submission_event_type?: ReportSubmissionEventType | null;
  latest_submission_result_code?: string | null;
  latest_submission_at?: string | null;
}

export interface ReportIntegritySignal {
  id: string;
  report_id: string;
  signal_type: string;
  severity: Exclude<ReportIntegritySeverity, 'none'>;
  score: number;
  source: 'system' | 'admin';
  status: 'active' | 'dismissed' | 'resolved';
  details_json?: Record<string, unknown> | null;
  detected_at: string;
  resolved_at?: string | null;
  resolved_by?: string | null;
  resolution_note?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ReportSubmissionEvent {
  id: string;
  report_id: string | null;
  user_id: string | null;
  device_id?: string | null;
  client_id?: string | null;
  event_type: ReportSubmissionEventType;
  result_code: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface DuplicateClusterMember {
  cluster_id: string;
  report_id: string;
  user_id: string | null;
  user_name: string | null;
  hazard_type: HazardType;
  status: ReportStatus;
  created_at: string;
  description: string;
  translated_english?: string | null;
}

export interface HazardReport {
  id: string;
  client_id: string;
  user_id: string;
  user_phone: string;
  user_name: string | null;
  hazard_type: HazardType;
  description: string;
  detected_language?: string | null;
  translated_english?: string | null;
  translation_status?: ReportTranslationStatus | null;
  translation_attempts?: number | null;
  translation_last_error?: string | null;
  translation_last_attempt_at?: string | null;
  translation_next_retry_at?: string | null;
  translation_provider?: string | null;
  translation_model?: string | null;
  translated_at?: string | null;
  latitude: number;
  longitude: number;
  is_high_risk: boolean;
  people_at_risk: number | null;
  urgency_level: UrgencyLevel | null;
  immediate_danger_status?: ImmediateDangerStatus | null;
  affected_people_band?: AffectedPeopleBand | null;
  media_urls: string[] | null;
  upload_complete: boolean;
  status: ReportStatus;
  event_time: string;
  created_at: string;
  ai_analysis?: ReportAiAnalysis | null;
  integrity_snapshot?: ReportIntegritySnapshot | null;
}

export interface FilterOptions {
  hazardTypes: HazardType[];
  statuses: ReportStatus[];
  urgencyLevels: UrgencyLevel[];
  isHighRisk: boolean | null;
  hasMedia: boolean | null;
  dateFrom: string | null;
  dateTo: string | null;
  searchQuery: string;
  landmarkId: string | null;
  landmarkRadius: number;
  suspiciousOnly: boolean | null;
  duplicateOnly: boolean | null;
  sharedDeviceOnly: boolean | null;
  sortBy: 'newest' | 'score_desc' | 'score_asc' | 'integrity_desc' | 'integrity_asc';
  scoreBuckets: ReportAiScoreBucket[];
  integritySeverities: ReportIntegritySeverity[];
}

export interface DashboardStats {
  totalReports: number;
  pendingReports: number;
  highRiskReports: number;
  reportsToday: number;
  reportsThisWeek: number;
  weeklyTrendPercent: number;
  hotspotClusters: number;
  falsePositiveRate: number;
  avgVerificationHours: number;
  byHazardType: Record<HazardType, number>;
  byUrgency: Record<UrgencyLevel, number>;
  byStatus: Record<ReportStatus, number>;
}

export interface ReportAuditLog {
  id: string;
  report_id: string;
  admin_id: string;
  admin_email: string;
  old_status: ReportStatus;
  new_status: ReportStatus;
  changed_at: string;
}
