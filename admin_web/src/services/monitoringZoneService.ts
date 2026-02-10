import { supabase, safeDelete, safeInsert, safeUpdate } from '../core/supabase_config';
import { isSupabaseConfigured } from '../core/supabase_config';
import type { MonitoringZone } from '../types/monitoringZone';

export const monitoringZoneService = {
  async list(): Promise<MonitoringZone[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('monitoring_zones')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as MonitoringZone[]) ?? [];
  },

  async create(params: {
    name: string;
    center_lat: number;
    center_lng: number;
    radius_meters: number;
  }): Promise<MonitoringZone> {
    const result = await safeInsert('monitoring_zones', {
      name: params.name,
      center_lat: params.center_lat,
      center_lng: params.center_lng,
      radius_meters: Math.round(params.radius_meters),
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to create monitoring zone');
    }

    const row = (Array.isArray(result.data) ? result.data[0] : result.data) as MonitoringZone | undefined;
    if (!row) throw new Error('Failed to create monitoring zone (no row returned)');
    return row;
  },

  async update(zoneId: string, patch: {
    name?: string;
    center_lat?: number;
    center_lng?: number;
    radius_meters?: number;
    people_count?: number;
  }): Promise<void> {
    const payload: Record<string, any> = { ...patch };
    if (typeof payload.radius_meters === 'number') payload.radius_meters = Math.round(payload.radius_meters);

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
