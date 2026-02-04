export type HazardType = 'High Waves' | 'Tsunami' | 'Storm' | 'Flood' | 'Other';
export type UrgencyLevel = 'Low' | 'Medium' | 'High';
export type ReportStatus = 'pending' | 'verified' | 'rejected' | 'resolved';

export interface HazardReport {
  id: string;
  client_id: string;
  user_id: string;
  user_phone: string;
  user_name: string | null;
  hazard_type: HazardType;
  description: string;
  latitude: number;
  longitude: number;
  is_high_risk: boolean;
  people_at_risk: number | null;
  urgency_level: UrgencyLevel | null;
  media_urls: string[] | null;
  upload_complete: boolean;
  status: ReportStatus;
  event_time: string;
  created_at: string;
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
}

export interface DashboardStats {
  totalReports: number;
  pendingReports: number;
  highRiskReports: number;
  reportsToday: number;
  reportsThisWeek: number;
  byHazardType: Record<HazardType, number>;
  byUrgency: Record<UrgencyLevel, number>;
  byStatus: Record<ReportStatus, number>;
}
