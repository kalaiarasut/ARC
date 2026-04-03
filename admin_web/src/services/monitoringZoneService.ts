import { supabase, safeDelete, safeInsert, safeUpdate } from '../core/supabase_config';
import { isSupabaseConfigured } from '../core/supabase_config';
import type {
  LiveExactPin,
  LiveLocationSession,
  LivePresenceCell,
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

const shouldUseMonitoringZoneFallback = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const rpcError = error as { code?: string; message?: string; details?: string };
  const message = (rpcError.message ?? '').toLowerCase();
  const details = (rpcError.details ?? '').toLowerCase();

  return (
    rpcError.code === '25006' ||
    rpcError.code === '42703' ||
    message.includes('read-only transaction') ||
    details.includes('read-only transaction') ||
    message.includes('updated_at') ||
    details.includes('updated_at')
  );
};

const listMonitoringZonesFallback = async (): Promise<MonitoringZone[]> => {
  const { data, error } = await supabase
    .from('monitoring_zones')
    .select('id,name,description,shape,center_lat,center_lng,radius_meters,polygon_points,people_count,created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data as any[]) ?? []).map(normalizeMonitoringZone);
};

const listZoneTransitionEventsFallback = async (params?: {
  limit?: number;
  zoneId?: string | null;
  eventType?: 'entered' | 'exited' | null;
}): Promise<ZoneTransitionEvent[]> => {
  let eventsQuery = supabase
    .from('zone_transition_events')
    .select('id,zone_id,user_id,device_id,event_type,occurred_at,latitude,longitude,source,delivery_status,notification_outbox_id')
    .order('occurred_at', { ascending: false })
    .limit(Math.max(1, Math.min(params?.limit ?? 50, 200)));

  if (params?.zoneId) {
    eventsQuery = eventsQuery.eq('zone_id', params.zoneId);
  }
  if (params?.eventType) {
    eventsQuery = eventsQuery.eq('event_type', params.eventType);
  }

  const [{ data: eventRows, error: eventError }, { data: zoneRows, error: zoneError }] = await Promise.all([
    eventsQuery,
    supabase.from('monitoring_zones').select('id,name'),
  ]);

  if (eventError) throw eventError;
  if (zoneError) throw zoneError;

  const zoneNames = new Map<string, string>();
  ((zoneRows as any[]) ?? []).forEach((row) => {
    if (typeof row?.id !== 'string') return;
    if (typeof row?.name === 'string' && row.name.trim().length > 0) {
      zoneNames.set(row.id, row.name.trim());
      return;
    }
    zoneNames.set(row.id, 'Monitoring Zone');
  });

  return ((eventRows as any[]) ?? []).map((row) => ({
    ...row,
    zone_name: zoneNames.get(row.zone_id) ?? 'Monitoring Zone',
    notification_outbox_id: row.notification_outbox_id ?? null,
  }));
};

export const monitoringZoneService = {
  async hasExactLocationPermission(): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { data, error } = await supabase.rpc('has_admin_permission', {
      p_permission_code: 'live_location_exact_view',
    });

    if (error) throw error;
    return Boolean(data);
  },

  async getActiveLiveLocationSession(): Promise<LiveLocationSession | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase.rpc('admin_get_active_live_location_session');
    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : null;
    return (row as LiveLocationSession | null) ?? null;
  },

  async startLiveLocationSession(params: {
    incidentId: string;
    reason: string;
  }): Promise<LiveLocationSession> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await supabase.rpc('admin_start_live_location_session', {
      p_incident_id: params.incidentId.trim(),
      p_reason: params.reason.trim(),
    });

    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : null;
    if (!row) {
      throw new Error('Failed to start live location session');
    }
    return row as LiveLocationSession;
  },

  async stopLiveLocationSession(sessionId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { data, error } = await supabase.rpc('admin_stop_live_location_session', {
      p_session_id: sessionId,
    });

    if (error) throw error;
    return Boolean(data);
  },

  async getLivePresenceAnonymized(params: {
    bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number };
    zoom: number;
    minutes?: number;
  }): Promise<LivePresenceCell[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase.rpc('admin_get_live_presence_anonymized', {
      p_min_lat: params.bounds.minLat,
      p_max_lat: params.bounds.maxLat,
      p_min_lon: params.bounds.minLon,
      p_max_lon: params.bounds.maxLon,
      p_zoom: Math.round(params.zoom),
      p_minutes: Math.max(1, Math.min(params.minutes ?? 15, 60)),
    });

    if (error) throw error;
    return (data as LivePresenceCell[]) ?? [];
  },

  async getLiveExactPins(params: {
    sessionId: string;
    bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number };
    minutes?: number;
  }): Promise<LiveExactPin[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase.rpc('admin_get_live_exact_pins', {
      p_session_id: params.sessionId,
      p_min_lat: params.bounds.minLat,
      p_max_lat: params.bounds.maxLat,
      p_min_lon: params.bounds.minLon,
      p_max_lon: params.bounds.maxLon,
      p_minutes: Math.max(1, Math.min(params.minutes ?? 15, 15)),
    });

    if (error) throw error;
    return (data as LiveExactPin[]) ?? [];
  },

  async list(): Promise<MonitoringZone[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase.rpc('admin_get_monitoring_zones');

    if (error) {
      if (!shouldUseMonitoringZoneFallback(error)) throw error;
      return listMonitoringZonesFallback();
    }
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

    if (error) {
      if (!shouldUseMonitoringZoneFallback(error)) throw error;
      return listZoneTransitionEventsFallback(params);
    }
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
