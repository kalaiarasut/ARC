import { supabase, safeDelete, safeInsert, safeUpdate } from '../core/supabase_config';
import { isSupabaseConfigured } from '../core/supabase_config';
import type {
  MonitoringZone,
  MonitoringZoneCoordinate,
  MonitoringZoneShape,
} from '../types/monitoringZone';

const parsePolygonPoints = (value: unknown): MonitoringZoneCoordinate[] | null => {
  if (!Array.isArray(value)) return null;

  const points = value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const point = item as Record<string, unknown>;
      const lat = Number(point.lat);
      const lng = Number(point.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng };
    })
    .filter((point): point is MonitoringZoneCoordinate => point !== null);

  return points.length >= 3 ? points : null;
};

const normalizeMonitoringZone = (row: any): MonitoringZone => ({
  ...row,
  name: typeof row?.name === 'string' && row.name.trim().length > 0
    ? row.name
    : row?.shape === 'polygon'
      ? 'Polygon Zone'
      : 'Monitoring Zone',
  shape: row?.shape === 'polygon' ? 'polygon' : 'circle',
  polygon_points: parsePolygonPoints(row?.polygon_points),
  people_count: Number.isFinite(Number(row?.people_count)) ? Number(row.people_count) : 0,
});

export const monitoringZoneService = {
  async list(): Promise<MonitoringZone[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('monitoring_zones')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return ((data as any[]) ?? []).map(normalizeMonitoringZone);
  },

  async create(params: {
    name: string;
    shape: MonitoringZoneShape;
    center_lat: number;
    center_lng: number;
    radius_meters: number;
    polygon_points?: MonitoringZoneCoordinate[] | null;
  }): Promise<MonitoringZone> {
    const result = await safeInsert('monitoring_zones', {
      name: params.name,
      shape: params.shape,
      center_lat: params.center_lat,
      center_lng: params.center_lng,
      radius_meters: Math.round(params.radius_meters),
      polygon_points: params.shape === 'polygon' ? params.polygon_points ?? null : null,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to create monitoring zone');
    }

    const row = Array.isArray(result.data) ? result.data[0] : result.data;
    if (!row) throw new Error('Failed to create monitoring zone (no row returned)');
    return normalizeMonitoringZone(row);
  },

  async update(zoneId: string, patch: {
    shape?: MonitoringZoneShape;
    name?: string;
    center_lat?: number;
    center_lng?: number;
    radius_meters?: number;
    polygon_points?: MonitoringZoneCoordinate[] | null;
    people_count?: number;
  }): Promise<void> {
    const payload: Record<string, any> = { ...patch };
    if (typeof payload.radius_meters === 'number') payload.radius_meters = Math.round(payload.radius_meters);
    if (payload.shape && payload.shape !== 'polygon') {
      payload.polygon_points = null;
    }

    const result = await safeUpdate('monitoring_zones', zoneId, payload);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update monitoring zone');
    }
  },

  async delete(zoneId: string): Promise<void> {
    const result = await safeDelete('monitoring_zones', zoneId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete monitoring zone');
    }
  },
};
