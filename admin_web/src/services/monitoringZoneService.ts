import { supabase, safeDelete, safeInsert, safeUpdate } from '../core/supabase_config';
import { isSupabaseConfigured } from '../core/supabase_config';
import type {
  MonitoringZone,
  MonitoringZoneCoordinate,
  MonitoringZoneShape,
  ZoneTransitionEvent,
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
  description: typeof row?.description === 'string' ? row.description.trim() : '',
  shape: row?.shape === 'polygon' ? 'polygon' : 'circle',
  polygon_points: parsePolygonPoints(row?.polygon_points),
  people_count: Number.isFinite(Number(row?.people_count)) ? Number(row.people_count) : 0,
});

export const monitoringZoneService = {
  async list(): Promise<MonitoringZone[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase.rpc('admin_get_monitoring_zones');

    if (error) throw error;
    return ((data as any[]) ?? []).map(normalizeMonitoringZone);
  },

  async listRecentActivity(params?: {
    limit?: number;
    zoneId?: string | null;
    eventType?: 'entered' | 'exited' | null;
  }): Promise<ZoneTransitionEvent[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase.rpc('admin_get_zone_transition_events', {
      p_limit: Math.max(1, Math.min(params?.limit ?? 50, 200)),
      p_zone_id: params?.zoneId ?? null,
      p_event_type: params?.eventType ?? null,
    });

    if (error) throw error;
    return ((data as ZoneTransitionEvent[]) ?? []).map((row) => ({
      ...row,
      notification_outbox_id: row.notification_outbox_id ?? null,
    }));
  },

  subscribeToMonitoringActivity(handlers: {
    onEvent?: () => void;
    onZoneChange?: () => void;
  }) {
    if (!isSupabaseConfigured()) {
      return {
        unsubscribe: () => {},
      } as any;
    }

    const channel = supabase.channel('monitoring_zone_activity_changes');

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'zone_transition_events' },
      () => handlers.onEvent?.(),
    );

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'monitoring_zones' },
      () => handlers.onZoneChange?.(),
    );

    return channel.subscribe();
  },

  async create(params: {
    name: string;
    description?: string;
    shape: MonitoringZoneShape;
    center_lat: number;
    center_lng: number;
    radius_meters: number;
    polygon_points?: MonitoringZoneCoordinate[] | null;
  }): Promise<MonitoringZone> {
    const result = await safeInsert('monitoring_zones', {
      name: params.name,
      description: params.description?.trim() ?? '',
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
    description?: string;
    center_lat?: number;
    center_lng?: number;
    radius_meters?: number;
    polygon_points?: MonitoringZoneCoordinate[] | null;
    people_count?: number;
  }): Promise<void> {
    const payload: Record<string, any> = { ...patch };
    if (typeof payload.description === 'string') payload.description = payload.description.trim();
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
