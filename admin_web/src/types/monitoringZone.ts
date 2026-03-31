export type MonitoringZoneShape = 'circle' | 'polygon';

export interface MonitoringZoneCoordinate {
  lat: number;
  lng: number;
}

export interface MonitoringZone {
  id: string;
  name: string;
  description: string;
  shape: MonitoringZoneShape;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  polygon_points: MonitoringZoneCoordinate[] | null;
  people_count: number;
  created_at: string;
}

export type ZoneTransitionEventType = 'entered' | 'exited';
export type ZoneTransitionSource = 'foreground' | 'background';
export type ZoneTransitionDeliveryStatus = 'queued' | 'sent' | 'failed' | 'skipped';

export interface ZoneTransitionEvent {
  id: string;
  zone_id: string;
  zone_name: string;
  user_id: string;
  device_id: string;
  event_type: ZoneTransitionEventType;
  occurred_at: string;
  latitude: number;
  longitude: number;
  source: ZoneTransitionSource;
  delivery_status: ZoneTransitionDeliveryStatus;
  notification_outbox_id: string | null;
}

export interface LivePresenceCell {
  cell_key: string;
  center_lat: number;
  center_lng: number;
  people_count: number;
  latest_observed_at: string;
}

export interface LiveLocationSession {
  id: string;
  started_by: string;
  incident_id: string;
  reason: string;
  status: 'active' | 'ended' | 'expired';
  started_at: string;
  expires_at: string;
  ended_at: string | null;
}

export interface LiveExactPin {
  device_id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  observed_at: string;
  source: ZoneTransitionSource;
  accuracy_meters: number | null;
}

export interface LiveLocationAuditEntry {
  id: string;
  actor_user_id: string;
  action: string;
  session_id: string | null;
  incident_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}
