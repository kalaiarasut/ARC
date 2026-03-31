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
