export type AdvisorySeverity = 'info' | 'watch' | 'warning';
export type AdvisoryLanguageCode = 'en' | 'ta' | 'hi' | 'te' | 'ml';
export type AdvisoryTranslationStatus = 'generated' | 'reviewed' | 'failed';

export type AdvisoryCategory =
  | 'food'
  | 'shelter'
  | 'medical'
  | 'rescue'
  | 'roadblock'
  | 'warning'
  | 'evacuation';

export interface OfficialAdvisory {
  id: string;
  title: string;
  body: string;
  region: string | null;
  severity: AdvisorySeverity;
  category: AdvisoryCategory;
  source_language: AdvisoryLanguageCode;

  // Optional location
  latitude: number | null;
  longitude: number | null;
  radius_km: number | null; // target radius in km
  // PostGIS geography column; returned shape may vary by PostgREST settings.
  location?: unknown;

  // Validity window
  starts_at: string | null;
  expires_at: string | null;

  // Contact info
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_hotline: string | null;

  published_at: string;
  created_at: string;
}

export interface AdvisoryTranslationDraft {
  language_code: Exclude<AdvisoryLanguageCode, 'en'>;
  title: string;
  body: string;
  region: string | null;
  translation_status: AdvisoryTranslationStatus;
  provider: string | null;
  model: string | null;
  error?: string;
}

export interface AdvisoryCreateInput {
  title: string;
  body: string;
  region?: string | null;
  severity?: AdvisorySeverity;
  category: AdvisoryCategory;
  latitude?: number | null;
  longitude?: number | null;
  radius_km?: number | null;
  starts_at?: string | null;
  expires_at?: string | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  contact_hotline?: string | null;
  source_language?: AdvisoryLanguageCode;
  translations: AdvisoryTranslationDraft[];
}

export interface AdvisoryTranslationPreviewResponse {
  source_language: AdvisoryLanguageCode;
  translations: AdvisoryTranslationDraft[];
}
