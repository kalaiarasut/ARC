import { supabase } from '../config/supabase';
import { isSupabaseConfigured } from '../core/supabase_config';
import type { GeneratedRiskZone, RiskZoneStatus } from '../types/riskZone';

export interface ZoneBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export const riskZoneService = {
  async isAdmin(): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { data, error } = await supabase.rpc('is_admin');
    if (error) throw error;
    return Boolean(data);
  },

  async listInBounds(bounds: ZoneBounds, includeInactive = true): Promise<GeneratedRiskZone[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase.rpc('admin_get_risk_zones_in_bounds', {
      min_lat: bounds.minLat,
      max_lat: bounds.maxLat,
      min_lon: bounds.minLon,
      max_lon: bounds.maxLon,
      include_inactive: includeInactive,
    });

    if (error) throw error;
    return (data as GeneratedRiskZone[]) ?? [];
  },

  async recompute(): Promise<number> {
    if (!isSupabaseConfigured()) return 0;

    const { data, error } = await supabase.rpc('admin_refresh_system_risk_zones');
    if (error) throw error;
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
        handlers.onInsert?.(payload.new as GeneratedRiskZone);
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'risk_zones' },
      (payload) => {
        handlers.onUpdate?.(payload.new as GeneratedRiskZone);
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'risk_zones' },
      (payload) => {
        const oldRow = payload.old as Partial<GeneratedRiskZone> | null;
        const id = (oldRow?.id as string | undefined) ?? '';
        if (id) handlers.onDelete?.(id);
      }
    );

    return channel.subscribe();
  },
};
