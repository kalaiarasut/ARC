-- Civil Alert System - Official Advisories
-- Read-only for authenticated users (write via service role / dashboard)

CREATE TABLE IF NOT EXISTS official_advisories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  region TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'watch', 'warning')) DEFAULT 'info',
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_official_advisories_published_at
  ON official_advisories (published_at DESC);

ALTER TABLE official_advisories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read advisories" ON official_advisories;

CREATE POLICY "Anyone authenticated can read advisories"
  ON official_advisories
  FOR SELECT
  USING (auth.role() = 'authenticated');
