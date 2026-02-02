-- Fetch a single verified report with privacy-safe fields for public map details.
-- RLS prevents direct SELECT for other users; public access should go through SECURITY DEFINER RPCs.

CREATE OR REPLACE FUNCTION get_verified_report_details(
  report_uuid UUID
)
RETURNS TABLE (
  id UUID,
  hazard_type TEXT,
  urgency_level TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_high_risk BOOLEAN,
  status TEXT,
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
    r.status,
    r.description,
    r.media_urls,
    r.event_time,
    r.created_at
  FROM hazard_reports r
  WHERE r.id = report_uuid
    AND r.status = 'verified'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_verified_report_details(UUID) TO authenticated;

COMMENT ON FUNCTION get_verified_report_details IS 'Fetch verified report detail for public viewing with reduced location precision (~100m)';
