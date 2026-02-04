export type RiskZoneLevel = 'informational' | 'caution' | 'high_risk';
export type RiskZoneStatus = 'candidate' | 'verified' | 'suppressed' | 'locked';

export interface GeneratedRiskZone {
  id: string;
  zone_key: string;
  center_lat: number;
  center_lon: number;
  radius_meters: number;
  level: RiskZoneLevel;
  status: RiskZoneStatus;
  score: number;
  report_count: number;
  verified_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  media_count: number;
  high_risk_count: number;
  first_seen_at: string;
  last_seen_at: string;
  active_until: string;
  calculated_at: string;
  notes: string | null;
  locked_until: string | null;
}
