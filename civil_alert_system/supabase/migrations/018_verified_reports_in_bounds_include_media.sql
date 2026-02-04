-- Include media URLs in privacy-safe verified reports viewport RPC.
--
-- Needed so the Home/Reports feeds can show photo/video thumbnails.
-- Video should not autoplay in feeds; clients will show a play overlay.

DROP FUNCTION IF EXISTS public.get_verified_reports_in_bounds(
  double precision,
  double precision,
  double precision,
  double precision,
  integer
);

CREATE OR REPLACE FUNCTION public.get_verified_reports_in_bounds(
  min_lat DOUBLE PRECISION,
  max_lat DOUBLE PRECISION,
  min_lon DOUBLE PRECISION,
  max_lon DOUBLE PRECISION,
  requested_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  hazard_type TEXT,
  urgency_level TEXT,
  latitude DOUBLE PRECISION,  -- reduced precision
  longitude DOUBLE PRECISION, -- reduced precision
  is_high_risk BOOLEAN,
  media_urls TEXT[],
  event_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.hazard_type,
    COALESCE(r.urgency_level, 'Low') as urgency_level,
    ROUND(r.latitude::numeric, 3)::double precision as latitude,
    ROUND(r.longitude::numeric, 3)::double precision as longitude,
    r.is_high_risk,
    CASE
      WHEN COALESCE(r.upload_complete, false) THEN COALESCE(r.media_urls, ARRAY[]::text[])
      ELSE ARRAY[]::text[]
    END as media_urls,
    r.event_time,
    r.created_at
  FROM public.hazard_reports r
  WHERE 
    r.status = 'verified'
    AND r.latitude BETWEEN min_lat AND max_lat
    AND r.longitude BETWEEN min_lon AND max_lon
  ORDER BY r.created_at DESC
  LIMIT LEAST(requested_limit, 200);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_verified_reports_in_bounds(
  double precision,
  double precision,
  double precision,
  double precision,
  integer
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_verified_reports_in_bounds(
  double precision,
  double precision,
  double precision,
  double precision,
  integer
) TO anon;

COMMENT ON FUNCTION public.get_verified_reports_in_bounds IS 'Fetch verified reports in viewport with reduced location precision (~100m) for privacy, including media URLs for feeds.';
