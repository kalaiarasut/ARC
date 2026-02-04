-- Civil Alert System - Extend Official Advisories
-- Adds: category, optional location (point + region text), validity window, and contact info.

-- Ensure PostGIS exists (used by location geography)
CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE public.official_advisories
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS location GEOGRAPHY(Point, 4326),
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS contact_hotline TEXT;

-- Backfill + enforce category values
UPDATE public.official_advisories
SET category = COALESCE(category, 'warning')
WHERE category IS NULL;

ALTER TABLE public.official_advisories
  ALTER COLUMN category SET DEFAULT 'warning',
  ALTER COLUMN category SET NOT NULL;

ALTER TABLE public.official_advisories
  DROP CONSTRAINT IF EXISTS official_advisories_category_check;

ALTER TABLE public.official_advisories
  ADD CONSTRAINT official_advisories_category_check
  CHECK (category IN ('food', 'shelter', 'medical', 'rescue', 'roadblock', 'warning', 'evacuation'));

-- Validity window constraint
ALTER TABLE public.official_advisories
  DROP CONSTRAINT IF EXISTS official_advisories_validity_window_check;

ALTER TABLE public.official_advisories
  ADD CONSTRAINT official_advisories_validity_window_check
  CHECK (
    expires_at IS NULL
    OR starts_at IS NULL
    OR expires_at > starts_at
  );

-- Optional location consistency (lat/lng should appear together)
ALTER TABLE public.official_advisories
  DROP CONSTRAINT IF EXISTS official_advisories_lat_lng_pair_check;

ALTER TABLE public.official_advisories
  ADD CONSTRAINT official_advisories_lat_lng_pair_check
  CHECK (
    (latitude IS NULL AND longitude IS NULL)
    OR (latitude IS NOT NULL AND longitude IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_official_advisories_category_published_at
  ON public.official_advisories (category, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_official_advisories_validity
  ON public.official_advisories (starts_at, expires_at);

CREATE INDEX IF NOT EXISTS idx_official_advisories_location
  ON public.official_advisories USING GIST (location);

-- RLS: allow authenticated users to publish advisories from the dashboard
-- (mobile clients are already authenticated for SELECT per 003_create_official_advisories.sql)
ALTER TABLE public.official_advisories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can publish advisories" ON public.official_advisories;

CREATE POLICY "Authenticated can publish advisories"
  ON public.official_advisories
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
