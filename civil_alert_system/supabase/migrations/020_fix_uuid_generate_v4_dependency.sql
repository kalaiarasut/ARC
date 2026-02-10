-- Fix: remove dependency on uuid-ossp's uuid_generate_v4()
--
-- Some Supabase projects do not have uuid-ossp enabled, causing inserts to fail
-- when table defaults call uuid_generate_v4(). We already use pgcrypto's
-- gen_random_uuid() in our RPCs; this migration aligns table defaults.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- hazard_reports inserts (including admin_seed_mock_hazard_reports) rely on id default.
ALTER TABLE IF EXISTS public.hazard_reports
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Keep other tables consistent (safe: only changes default for new rows).
ALTER TABLE IF EXISTS public.official_advisories
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE IF EXISTS public.risk_zones_cached
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE IF EXISTS public.risk_zones
  ALTER COLUMN id SET DEFAULT gen_random_uuid();
