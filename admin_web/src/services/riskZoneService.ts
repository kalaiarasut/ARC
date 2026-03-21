import { supabase } from '../config/supabase';
import { isSupabaseConfigured } from '../core/supabase_config';
import type { GeneratedRiskZone, RiskZoneStatus } from '../types/riskZone';

export interface ZoneBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

interface ListInBoundsOptions {
  zoomLevel?: number;
  useCache?: boolean;
}

type ZoneCacheEntry = {
  fetchedAt: number;
  zones: GeneratedRiskZone[];
};

const zoneBoundsCache = new Map<string, ZoneCacheEntry>();
const ZONE_CACHE_TTL_MS = 2 * 60 * 1000;
const ZONE_CACHE_MAX_KEYS = 180;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeLongitude = (longitude: number) => {
  const normalized = ((longitude + 180) % 360 + 360) % 360 - 180;
  return normalized === -180 ? 180 : normalized;
};

const tileXForLongitude = (longitude: number, zoomLevel: number) => {
  const normalized = normalizeLongitude(longitude);
  const tiles = 2 ** zoomLevel;
  return clamp(Math.floor(((normalized + 180) / 360) * tiles), 0, tiles - 1);
};

const tileYForLatitude = (latitude: number, zoomLevel: number) => {
  const safeLat = clamp(latitude, -85.05112878, 85.05112878);
  const radians = (safeLat * Math.PI) / 180;
  const mercator = Math.log(Math.tan(Math.PI / 4 + radians / 2));
  const tiles = 2 ** zoomLevel;
  return clamp(Math.floor(((1 - mercator / Math.PI) / 2) * tiles), 0, tiles - 1);
};

const cacheZoomLevel = (zoomLevel: number) => clamp(Math.round(zoomLevel), 6, 10);

const tileKeysForBounds = (bounds: ZoneBounds, includeInactive: boolean, zoomLevel: number) => {
  const zoom = cacheZoomLevel(zoomLevel);
  const minX = Math.min(tileXForLongitude(bounds.minLon, zoom), tileXForLongitude(bounds.maxLon, zoom));
  const maxX = Math.max(tileXForLongitude(bounds.minLon, zoom), tileXForLongitude(bounds.maxLon, zoom));
  const minY = Math.min(tileYForLatitude(bounds.maxLat, zoom), tileYForLatitude(bounds.minLat, zoom));
  const maxY = Math.max(tileYForLatitude(bounds.maxLat, zoom), tileYForLatitude(bounds.minLat, zoom));

  const keys: string[] = [];
  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      keys.push(`${zoom}:${x}:${y}:${includeInactive ? 'all' : 'active'}`);
    }
  }
  return keys;
};

const zoneIntersectsBounds = (zone: GeneratedRiskZone, bounds: ZoneBounds) => {
  const latPad = (Number(zone.radius_meters) || 0) / 111320;
  const cosLat = Math.cos((zone.center_lat * Math.PI) / 180);
  const lonPad = (Number(zone.radius_meters) || 0) / (111320 * Math.max(Math.abs(cosLat), 0.2));

  return (
    zone.center_lat + latPad >= bounds.minLat &&
    zone.center_lat - latPad <= bounds.maxLat &&
    zone.center_lon + lonPad >= bounds.minLon &&
    zone.center_lon - lonPad <= bounds.maxLon
  );
};

const dedupeZones = (zones: GeneratedRiskZone[]) => {
  const byId = new Map<string, GeneratedRiskZone>();
  zones.forEach((zone) => {
    byId.set(zone.id, zone);
  });
  return Array.from(byId.values());
};

const filterZonesForBounds = (zones: GeneratedRiskZone[], bounds: ZoneBounds) =>
  dedupeZones(zones).filter((zone) => zoneIntersectsBounds(zone, bounds));

const pruneZoneBoundsCache = (now = Date.now()) => {
  for (const [key, entry] of zoneBoundsCache.entries()) {
    if (now - entry.fetchedAt > ZONE_CACHE_TTL_MS) {
      zoneBoundsCache.delete(key);
    }
  }

  if (zoneBoundsCache.size <= ZONE_CACHE_MAX_KEYS) return;

  const oldestEntries = Array.from(zoneBoundsCache.entries())
    .sort((a, b) => a[1].fetchedAt - b[1].fetchedAt);

  while (zoneBoundsCache.size > ZONE_CACHE_MAX_KEYS && oldestEntries.length > 0) {
    const oldest = oldestEntries.shift();
    if (!oldest) break;
    zoneBoundsCache.delete(oldest[0]);
  }
};

const fetchZonesInBounds = async (bounds: ZoneBounds, includeInactive: boolean): Promise<GeneratedRiskZone[]> => {
  const { data, error } = await supabase.rpc('admin_get_risk_zones_in_bounds', {
    min_lat: bounds.minLat,
    max_lat: bounds.maxLat,
    min_lon: bounds.minLon,
    max_lon: bounds.maxLon,
    include_inactive: includeInactive,
  });

  if (error) throw error;
  return (data as GeneratedRiskZone[]) ?? [];
};

export const riskZoneService = {
  clearBoundsCache(): void {
    zoneBoundsCache.clear();
  },

  async isAdmin(): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { data, error } = await supabase.rpc('is_admin');
    if (error) throw error;
    return Boolean(data);
  },

  async listInBounds(
    bounds: ZoneBounds,
    includeInactive = true,
    options?: ListInBoundsOptions,
  ): Promise<GeneratedRiskZone[]> {
    if (!isSupabaseConfigured()) return [];

    const useCache = options?.useCache ?? true;
    const zoomLevel = options?.zoomLevel;

    if (!useCache || zoomLevel == null) {
      return fetchZonesInBounds(bounds, includeInactive);
    }

    const now = Date.now();
    pruneZoneBoundsCache(now);

    const tileKeys = tileKeysForBounds(bounds, includeInactive, zoomLevel);
    const cachedEntries: ZoneCacheEntry[] = [];
    for (const key of tileKeys) {
      const cached = zoneBoundsCache.get(key);
      if (!cached) continue;
      if (now - cached.fetchedAt > ZONE_CACHE_TTL_MS) continue;
      cachedEntries.push(cached);
    }

    if (cachedEntries.length === tileKeys.length && cachedEntries.length > 0) {
      return filterZonesForBounds(
        cachedEntries.flatMap((entry) => entry.zones),
        bounds,
      );
    }

    const zones = await fetchZonesInBounds(bounds, includeInactive);
    const entry: ZoneCacheEntry = {
      fetchedAt: now,
      zones,
    };

    tileKeys.forEach((key) => {
      zoneBoundsCache.set(key, entry);
    });
    pruneZoneBoundsCache(now);

    return filterZonesForBounds(zones, bounds);
  },

  async recompute(): Promise<number> {
    if (!isSupabaseConfigured()) return 0;

    const { data, error } = await supabase.rpc('admin_refresh_system_risk_zones');
    if (error) throw error;
    zoneBoundsCache.clear();
    return (data as number) ?? 0;
  },

  async updateStatus(params: {
    zoneId: string;
    status: RiskZoneStatus;
    notes?: string | null;
    lockUntil?: string | null;
  }): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase.rpc('admin_update_risk_zone_status', {
      zone_id: params.zoneId,
      new_status: params.status,
      new_notes: params.notes ?? null,
      lock_until: params.lockUntil ?? null,
    });

    if (error) throw error;
    zoneBoundsCache.clear();
  },

  subscribeToRiskZones(handlers: {
    onInsert?: (zone: GeneratedRiskZone) => void;
    onUpdate?: (zone: GeneratedRiskZone) => void;
    onDelete?: (zoneId: string) => void;
  }) {
    if (!isSupabaseConfigured()) {
      return {
        // minimal channel-like shape used by callers
        unsubscribe: () => {},
      } as any;
    }

    const channel = supabase.channel('risk_zones_changes');

    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'risk_zones' },
      (payload) => {
        zoneBoundsCache.clear();
        handlers.onInsert?.(payload.new as GeneratedRiskZone);
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'risk_zones' },
      (payload) => {
        zoneBoundsCache.clear();
        handlers.onUpdate?.(payload.new as GeneratedRiskZone);
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'risk_zones' },
      (payload) => {
        zoneBoundsCache.clear();
        const oldRow = payload.old as Partial<GeneratedRiskZone> | null;
        const id = (oldRow?.id as string | undefined) ?? '';
        if (id) handlers.onDelete?.(id);
      }
    );

    return channel.subscribe();
  },
};
