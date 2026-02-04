import { supabase } from '../config/supabase';
import { isSupabaseConfigured } from '../core/supabase_config';
import type { AdvisoryCreateInput, OfficialAdvisory } from '../types/advisory';

export interface PagedResult<T> {
  data: T[];
  total: number;
}

const toNullableString = (value: string | null | undefined) => {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const advisoryService = {
  async getAdvisoriesWithCount(page = 0, limit = 25): Promise<PagedResult<OfficialAdvisory>> {
    if (!isSupabaseConfigured()) {
      return { data: [], total: 0 };
    }

    const query = supabase
      .from('official_advisories')
      .select('*', { count: 'exact' })
      .order('published_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching advisories:', error);
      throw error;
    }

    return { data: (data as OfficialAdvisory[]) ?? [], total: count ?? 0 };
  },

  async getAdvisoriesWithLocation(limit = 200): Promise<OfficialAdvisory[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const safeLimit = Math.max(1, Math.min(limit, 1000));

    const { data, error } = await supabase
      .from('official_advisories')
      .select('*')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('published_at', { ascending: false })
      .limit(safeLimit);

    if (error) {
      console.error('Error fetching advisories with location:', error);
      throw error;
    }

    return (data as OfficialAdvisory[]) ?? [];
  },

  async publishAdvisory(input: AdvisoryCreateInput): Promise<OfficialAdvisory> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const latitude = input.latitude ?? null;
    const longitude = input.longitude ?? null;

    const location =
      latitude !== null && longitude !== null
        ? `SRID=4326;POINT(${longitude} ${latitude})`
        : null;

    const payload = {
      title: input.title.trim(),
      body: input.body.trim(),
      region: toNullableString(input.region),
      severity: input.severity ?? 'info',
      category: input.category,
      latitude,
      longitude,
      location,
      starts_at: input.starts_at ?? null,
      expires_at: input.expires_at ?? null,
      contact_phone: toNullableString(input.contact_phone),
      contact_whatsapp: toNullableString(input.contact_whatsapp),
      contact_hotline: toNullableString(input.contact_hotline),
      published_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('official_advisories')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      console.error('Error publishing advisory:', error);
      throw error;
    }

    return data as OfficialAdvisory;
  },

  async deleteAdvisory(advisoryId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const id = (advisoryId ?? '').trim();
    if (!id) {
      throw new Error('Missing advisory id');
    }

    const { error } = await supabase.from('official_advisories').delete().eq('id', id);
    if (error) {
      console.error('Error deleting advisory:', error);
      throw error;
    }
  },

  subscribeToAdvisories(handlers: {
    onInsert?: (advisory: OfficialAdvisory) => void;
    onUpdate?: (advisory: OfficialAdvisory) => void;
    onDelete?: (advisoryId: string) => void;
  }) {
    if (!isSupabaseConfigured()) {
      return {
        // minimal channel-like shape used by callers
        unsubscribe: () => {},
      } as any;
    }

    const channel = supabase.channel('official_advisories_changes');

    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'official_advisories' },
      (payload) => {
        handlers.onInsert?.(payload.new as OfficialAdvisory);
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'official_advisories' },
      (payload) => {
        handlers.onUpdate?.(payload.new as OfficialAdvisory);
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'official_advisories' },
      (payload) => {
        const oldRow = payload.old as Partial<OfficialAdvisory> | null;
        const id = (oldRow?.id as string | undefined) ?? '';
        if (id) handlers.onDelete?.(id);
      }
    );

    return channel.subscribe();
  },
};
