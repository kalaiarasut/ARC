import { supabase } from '../config/supabase';
import { isSupabaseConfigured } from '../core/supabase_config';
import type {
  AdvisoryCreateInput,
  AdvisoryLanguageCode,
  AdvisoryTranslationPreviewResponse,
  AdvisoryTranslationDraft,
  OfficialAdvisory,
} from '../types/advisory';

export interface PagedResult<T> {
  data: T[];
  total: number;
}

const SUPABASE_URL = (
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_PUBLIC_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  ''
).trim();

const SUPABASE_ANON_KEY = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_KEY ||
  ''
).trim();

const toNullableString = (value: string | null | undefined) => {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
};

const getFunctionAuthHeaders = async () => {
  let { data, error } = await supabase.auth.getSession();
  let session = data.session;

  const expiresAtMs = session?.expires_at ? session.expires_at * 1000 : 0;
  const needsRefresh = !session || (expiresAtMs > 0 && expiresAtMs - Date.now() < 60_000);

  if (needsRefresh) {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error) {
      throw new Error('Session expired. Please log in again.');
    }
    session = refreshed.data.session;
    error = null;
  }

  const accessToken = session?.access_token;

  if (error || !accessToken) {
    throw new Error('Missing admin session. Please log in again.');
  }

  return {
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    apikey: SUPABASE_ANON_KEY,
    'x-supabase-auth': `Bearer ${accessToken}`,
  };
};

const invokeEdgeFunction = async <TResponse>(functionName: string, body: Record<string, unknown>): Promise<TResponse> => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables are missing.');
  }

  const headers = await getFunctionAuthHeaders();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload?.error ||
      payload?.message ||
      `Edge Function ${functionName} failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as TResponse;
};

export const advisoryService = {
  async generateTranslationPreview(input: {
    title: string;
    body: string;
    region?: string | null;
    target_languages?: Exclude<AdvisoryLanguageCode, 'en'>[];
  }): Promise<AdvisoryTranslationPreviewResponse> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      return await invokeEdgeFunction<AdvisoryTranslationPreviewResponse>('translate_advisory_preview', {
        title: input.title.trim(),
        body: input.body.trim(),
        region: toNullableString(input.region),
        target_languages: input.target_languages,
      });
    } catch (error) {
      console.error('Error generating advisory translation preview:', error);
      throw error;
    }
  },

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

  async getAdvisoryTranslations(advisoryId: string): Promise<AdvisoryTranslationDraft[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const id = advisoryId.trim();
    if (!id) {
      throw new Error('Missing advisory id');
    }

    const { data, error } = await supabase
      .from('official_advisory_translations')
      .select('language_code, title, body, region, translation_status, provider, model')
      .eq('advisory_id', id)
      .order('language_code', { ascending: true });

    if (error) {
      console.error('Error fetching advisory translations:', error);
      throw error;
    }

    return ((data as AdvisoryTranslationDraft[] | null) ?? []).map((item) => ({
      ...item,
      error: undefined,
    }));
  },

  async publishAdvisory(input: AdvisoryCreateInput): Promise<OfficialAdvisory> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      const data = await invokeEdgeFunction<{ advisory: OfficialAdvisory }>('publish_advisory_with_translations', {
        advisory_id: input.advisory_id ?? null,
        title: input.title.trim(),
        body: input.body.trim(),
        region: toNullableString(input.region),
        severity: input.severity ?? 'info',
        category: input.category,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        radius_km: input.radius_km ?? null,
        starts_at: input.starts_at ?? null,
        expires_at: input.expires_at ?? null,
        contact_phone: toNullableString(input.contact_phone),
        contact_whatsapp: toNullableString(input.contact_whatsapp),
        contact_hotline: toNullableString(input.contact_hotline),
        source_language: input.source_language ?? 'en',
        translations: input.translations,
        replace_translations: input.replace_translations ?? true,
      });
      return data.advisory;
    } catch (error) {
      console.error('Error publishing advisory:', error);
      throw error;
    }
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
