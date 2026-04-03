DROP FUNCTION IF EXISTS public.get_verified_reports_in_bounds(
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  INTEGER
);

CREATE FUNCTION public.get_verified_reports_in_bounds(
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
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_high_risk BOOLEAN,
  description TEXT,
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
    r.description,
    CASE
      WHEN COALESCE(r.upload_complete, false)
        THEN COALESCE(r.media_urls, ARRAY[]::text[])
      ELSE ARRAY[]::text[]
    END as media_urls,
    r.event_time,
    r.created_at
  FROM public.hazard_reports r
  WHERE r.status = 'verified'
    AND r.latitude BETWEEN min_lat AND max_lat
    AND r.longitude BETWEEN min_lon AND max_lon
  ORDER BY r.created_at DESC
  LIMIT LEAST(requested_limit, 200);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_verified_reports_in_bounds(
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  INTEGER
) TO authenticated, anon;
