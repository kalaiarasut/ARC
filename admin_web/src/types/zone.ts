export type ZoneShape = 'rectangle' | 'polygon';
export type ZoneStatus = 'active' | 'inactive' | 'paused';

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Zone {
  id: string;
  name: string;
  description?: string;
  shape: ZoneShape;
  coordinates: Coordinate[]; // For polygon: all vertices, For rectangle: [topLeft, bottomRight]
  status: ZoneStatus;
  color: string;
  createdAt: string;
  updatedAt: string;
  reportsCount?: number;
}

export interface ZoneAlert {
  zoneId: string;
  zoneName: string;
  reportCount: number;
  lastReportTime: string;
}

export interface ZoneBoundary {
  zone: Zone;
  isActive: boolean;
  reportsInside: number;
}
