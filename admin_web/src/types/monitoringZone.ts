export type MonitoringZoneShape = 'circle' | 'polygon';

export interface MonitoringZoneCoordinate {
  lat: number;
  lng: number;
}

export interface MonitoringZone {
  id: string;
  name: string;
  shape: MonitoringZoneShape;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  polygon_points: MonitoringZoneCoordinate[] | null;
  people_count: number;
  created_at: string;
}
