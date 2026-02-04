export type AdvisorySeverity = 'info' | 'watch' | 'warning';

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

  // Optional location
  latitude: number | null;
  longitude: number | null;
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

export interface AdvisoryCreateInput {
  title: string;
  body: string;
  region?: string | null;
  severity?: AdvisorySeverity;
  category: AdvisoryCategory;
  latitude?: number | null;
  longitude?: number | null;
  starts_at?: string | null;
  expires_at?: string | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  contact_hotline?: string | null;
}
