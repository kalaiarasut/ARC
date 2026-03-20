-- Adds polygon support to manual monitoring zones while preserving existing circles.

ALTER TABLE IF EXISTS public.monitoring_zones
  ADD COLUMN IF NOT EXISTS shape TEXT NOT NULL DEFAULT 'circle';

ALTER TABLE IF EXISTS public.monitoring_zones
  ADD COLUMN IF NOT EXISTS polygon_points JSONB;

UPDATE public.monitoring_zones
SET shape = 'circle'
WHERE shape IS NULL OR shape = '';

ALTER TABLE IF EXISTS public.monitoring_zones
  DROP CONSTRAINT IF EXISTS monitoring_zones_shape_check;

ALTER TABLE IF EXISTS public.monitoring_zones
  ADD CONSTRAINT monitoring_zones_shape_check
  CHECK (shape IN ('circle', 'polygon'));

ALTER TABLE IF EXISTS public.monitoring_zones
  DROP CONSTRAINT IF EXISTS monitoring_zones_polygon_points_check;

ALTER TABLE IF EXISTS public.monitoring_zones
  ADD CONSTRAINT monitoring_zones_polygon_points_check
  CHECK (
    (shape = 'circle' AND (polygon_points IS NULL OR jsonb_typeof(polygon_points) = 'array'))
    OR
    (shape = 'polygon' AND polygon_points IS NOT NULL AND jsonb_typeof(polygon_points) = 'array' AND jsonb_array_length(polygon_points) >= 3)
  );

COMMENT ON COLUMN public.monitoring_zones.shape IS 'Manual monitoring zone shape: circle or polygon.';
COMMENT ON COLUMN public.monitoring_zones.polygon_points IS 'Polygon vertices for manual monitoring zones, stored as [{lat, lng}, ...]. Null for circles.';
