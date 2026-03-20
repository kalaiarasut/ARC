-- Adds missing metadata columns required by the admin monitoring-zone workflow.

ALTER TABLE IF EXISTS public.monitoring_zones
  ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Monitoring Zone';

ALTER TABLE IF EXISTS public.monitoring_zones
  ADD COLUMN IF NOT EXISTS people_count INTEGER NOT NULL DEFAULT 0;

UPDATE public.monitoring_zones
SET
  name = COALESCE(NULLIF(TRIM(name), ''), CASE WHEN shape = 'polygon' THEN 'Polygon Zone' ELSE 'Monitoring Zone' END),
  people_count = COALESCE(people_count, 0)
WHERE
  name IS NULL
  OR TRIM(name) = ''
  OR people_count IS NULL;

COMMENT ON COLUMN public.monitoring_zones.name IS 'Human-readable monitoring zone name shown in the admin map UI.';
COMMENT ON COLUMN public.monitoring_zones.people_count IS 'Derived or manually maintained number of people currently associated with the monitoring zone.';
