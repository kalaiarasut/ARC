-- Civil Alert System - Map Functions and Risk Zones
-- This migration adds map-specific RPC functions and cached risk zones infrastructure

-- ============================================
-- 1. CACHED RISK ZONES TABLE
-- ============================================

-- Pre-aggregated risk zones refreshed periodically (5-10 min intervals)
CREATE TABLE IF NOT EXISTS risk_zones_cached (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_lat DOUBLE PRECISION NOT NULL,
  center_lon DOUBLE PRECISION NOT NULL,
  radius_meters DOUBLE PRECISION NOT NULL,
  intensity TEXT CHECK (intensity IN ('low', 'medium', 'high')),
  report_count INTEGER NOT NULL,
  intensity_score DOUBLE PRECISION NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for fast location queries
CREATE INDEX IF NOT EXISTS idx_risk_zones_location 
  ON risk_zones_cached USING GIST (
    ST_MakePoint(center_lon, center_lat)::geography
  );

-- Time index for freshness queries
CREATE INDEX IF NOT EXISTS idx_risk_zones_calculated_at 
  ON risk_zones_cached (calculated_at DESC);

-- ============================================
-- 2. GET VERIFIED REPORTS IN VIEWPORT BOUNDS
-- ============================================

-- Fetch verified reports within map viewport with privacy & security
CREATE OR REPLACE FUNCTION get_verified_reports_in_bounds(
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
  latitude DOUBLE PRECISION,  -- Will be reduced precision
  longitude DOUBLE PRECISION, -- Will be reduced precision
  is_high_risk BOOLEAN,
  event_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.hazard_type,
    COALESCE(r.urgency_level, 'Low') as urgency_level,
    -- Reduce precision to ~100m (3 decimal places) for privacy
    ROUND(r.latitude::numeric, 3)::double precision as latitude,
    ROUND(r.longitude::numeric, 3)::double precision as longitude,
    r.is_high_risk,
    r.event_time,
    r.created_at
  FROM hazard_reports r
  WHERE 
    -- Only verified reports shown on map
    r.status = 'verified'
    -- Bounding box query (efficient with spatial index)
    AND r.latitude BETWEEN min_lat AND max_lat
    AND r.longitude BETWEEN min_lon AND max_lon
  ORDER BY r.created_at DESC
  -- Hard limit: never trust client, enforce server-side max
  LIMIT LEAST(requested_limit, 200);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- 3. ON-DEMAND RISK ZONE CALCULATION
-- ============================================

-- Calculate risk zones dynamically based on zoom level
-- Uses DBSCAN clustering for density-based grouping
CREATE OR REPLACE FUNCTION calculate_risk_zones_on_demand(
  center_lat DOUBLE PRECISION,
  center_lon DOUBLE PRECISION,
  zoom_level INTEGER
)
RETURNS TABLE (
  center_lat DOUBLE PRECISION,
  center_lon DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION,
  intensity TEXT,
  report_count INTEGER,
  intensity_score DOUBLE PRECISION
) AS $$
DECLARE
  search_radius_km DOUBLE PRECISION;
  cluster_distance_meters DOUBLE PRECISION;
BEGIN
  -- Map zoom level to search radius
  search_radius_km := CASE
    WHEN zoom_level BETWEEN 10 AND 12 THEN 10.0
    WHEN zoom_level BETWEEN 13 AND 15 THEN 5.0
    WHEN zoom_level BETWEEN 16 AND 18 THEN 2.0
    ELSE 5.0 -- Default
  END;

  -- Cluster distance is 1/4 of search radius
  cluster_distance_meters := (search_radius_km * 1000.0) / 4.0;

  RETURN QUERY
  WITH nearby_reports AS (
    -- Get verified reports within radius
    SELECT 
      r.latitude,
      r.longitude,
      r.urgency_level,
      r.location
    FROM hazard_reports r
    WHERE 
      r.status = 'verified'
      AND ST_DWithin(
        r.location,
        ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326)::geography,
        search_radius_km * 1000 -- Convert km to meters
      )
  ),
  clustered AS (
    -- Apply DBSCAN clustering
    SELECT 
      latitude,
      longitude,
      urgency_level,
      ST_ClusterDBSCAN(location::geometry, eps := cluster_distance_meters, minpoints := 3) OVER () as cluster_id
    FROM nearby_reports
  ),
  zone_stats AS (
    -- Calculate stats per cluster
    SELECT 
      cluster_id,
      AVG(latitude) as avg_lat,
      AVG(longitude) as avg_lon,
      COUNT(*) as report_count,
      -- Count by urgency
      COUNT(*) FILTER (WHERE urgency_level = 'High') as high_count,
      COUNT(*) FILTER (WHERE urgency_level = 'Medium') as medium_count,
      COUNT(*) FILTER (WHERE urgency_level = 'Low') as low_count,
      -- Calculate cluster radius (max distance from centroid)
      MAX(
        ST_Distance(
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(AVG(longitude), AVG(latitude)), 4326)::geography
        )
      ) as max_distance_m
    FROM clustered
    WHERE cluster_id IS NOT NULL -- Exclude noise points
    GROUP BY cluster_id
    HAVING COUNT(*) >= 3 -- Minimum reports per zone
  )
  SELECT 
    z.avg_lat::double precision,
    z.avg_lon::double precision,
    GREATEST(z.max_distance_m, 100.0)::double precision as radius_meters, -- Minimum 100m
    -- Calculate intensity using formula: (high*3 + med*2 + low*1) * density_factor
    -- density_factor = report_count / area_km²
    CASE
      WHEN (
        (z.high_count * 3 + z.medium_count * 2 + z.low_count * 1) * 
        (z.report_count::float / (3.14159 * POWER(GREATEST(z.max_distance_m, 100.0) / 1000.0, 2)))
      ) >= 25.0 THEN 'high'
      WHEN (
        (z.high_count * 3 + z.medium_count * 2 + z.low_count * 1) * 
        (z.report_count::float / (3.14159 * POWER(GREATEST(z.max_distance_m, 100.0) / 1000.0, 2)))
      ) >= 10.0 THEN 'medium'
      ELSE 'low'
    END as intensity,
    z.report_count::integer,
    (
      (z.high_count * 3 + z.medium_count * 2 + z.low_count * 1) * 
      (z.report_count::float / (3.14159 * POWER(GREATEST(z.max_distance_m, 100.0) / 1000.0, 2)))
    )::double precision as intensity_score
  FROM zone_stats z
  ORDER BY intensity_score DESC
  LIMIT 50; -- Max zones to return
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- 4. GET USER'S OWN REPORTS FOR MAP
-- ============================================

-- Fetch authenticated user's own reports with optional time filter
CREATE OR REPLACE FUNCTION get_user_reports_on_map(
  user_uuid UUID,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  hazard_type TEXT,
  urgency_level TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_high_risk BOOLEAN,
  status TEXT,
  event_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Verify user is requesting their own data (RLS will also enforce)
  IF auth.uid() != user_uuid THEN
    RAISE EXCEPTION 'Unauthorized: Can only view own reports';
  END IF;

  RETURN QUERY
  SELECT 
    r.id,
    r.hazard_type,
    COALESCE(r.urgency_level, 'Low') as urgency_level,
    r.latitude,
    r.longitude,
    r.is_high_risk,
    r.status,
    r.event_time,
    r.created_at
  FROM hazard_reports r
  WHERE 
    r.user_id = user_uuid
    AND r.created_at >= NOW() - (days_back || ' days')::INTERVAL
  ORDER BY r.created_at DESC
  LIMIT 200; -- Reasonable limit for user's own reports
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- 5. REFRESH CACHED RISK ZONES (MAINTENANCE)
-- ============================================

-- Recalculate and cache risk zones for active regions
-- Should be called periodically (every 5-10 minutes) via scheduler
CREATE OR REPLACE FUNCTION refresh_cached_risk_zones()
RETURNS INTEGER AS $$
DECLARE
  zones_created INTEGER := 0;
  region_lat DOUBLE PRECISION;
  region_lon DOUBLE PRECISION;
BEGIN
  -- Clear old cached zones (older than 15 minutes)
  DELETE FROM risk_zones_cached 
  WHERE calculated_at < NOW() - INTERVAL '15 minutes';

  -- For MVP, recalculate zones for regions with recent reports
  -- In production, this would cover predefined regions of interest
  FOR region_lat, region_lon IN 
    SELECT 
      ROUND(latitude::numeric, 1)::double precision,
      ROUND(longitude::numeric, 1)::double precision
    FROM hazard_reports
    WHERE 
      status = 'verified'
      AND created_at >= NOW() - INTERVAL '24 hours'
    GROUP BY 
      ROUND(latitude::numeric, 1),
      ROUND(longitude::numeric, 1)
    HAVING COUNT(*) >= 3
  LOOP
    -- Calculate zones for this region (zoom level 14 = balanced)
    INSERT INTO risk_zones_cached (
      center_lat, center_lon, radius_meters, intensity, report_count, intensity_score, calculated_at
    )
    SELECT * FROM calculate_risk_zones_on_demand(region_lat, region_lon, 14);
    
    zones_created := zones_created + 1;
  END LOOP;

  RETURN zones_created;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- ============================================
-- 6. GET CACHED RISK ZONES
-- ============================================

-- Fetch pre-aggregated risk zones within viewport (fast!)
CREATE OR REPLACE FUNCTION get_cached_risk_zones(
  min_lat DOUBLE PRECISION,
  max_lat DOUBLE PRECISION,
  min_lon DOUBLE PRECISION,
  max_lon DOUBLE PRECISION
)
RETURNS TABLE (
  center_lat DOUBLE PRECISION,
  center_lon DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION,
  intensity TEXT,
  report_count INTEGER,
  intensity_score DOUBLE PRECISION,
  calculated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rz.center_lat,
    rz.center_lon,
    rz.radius_meters,
    rz.intensity,
    rz.report_count,
    rz.intensity_score,
    rz.calculated_at
  FROM risk_zones_cached rz
  WHERE 
    rz.center_lat BETWEEN min_lat AND max_lat
    AND rz.center_lon BETWEEN min_lon AND max_lon
    -- Only return fresh zones (within last 15 minutes)
    AND rz.calculated_at >= NOW() - INTERVAL '15 minutes'
  ORDER BY rz.intensity_score DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- PERMISSIONS
-- ============================================

-- Allow authenticated users to call these functions
GRANT EXECUTE ON FUNCTION get_verified_reports_in_bounds TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_risk_zones_on_demand TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_reports_on_map TO authenticated;
GRANT EXECUTE ON FUNCTION get_cached_risk_zones TO authenticated;

-- Only service role can refresh cached zones (scheduler)
GRANT EXECUTE ON FUNCTION refresh_cached_risk_zones TO service_role;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE risk_zones_cached IS 'Pre-aggregated risk zones refreshed every 5-10 minutes to avoid expensive DBSCAN on every map pan/zoom';
COMMENT ON FUNCTION get_verified_reports_in_bounds IS 'Fetch verified reports in viewport with reduced location precision (~100m) for privacy';
COMMENT ON FUNCTION calculate_risk_zones_on_demand IS 'Calculate risk zones in real-time using DBSCAN clustering. Should be rate-limited on client side.';
COMMENT ON FUNCTION get_user_reports_on_map IS 'Fetch authenticated user''s own reports with optional time filter';
COMMENT ON FUNCTION refresh_cached_risk_zones IS 'Maintenance function to refresh cached risk zones. Call via scheduler every 5-10 minutes.';
COMMENT ON FUNCTION get_cached_risk_zones IS 'Fetch pre-aggregated risk zones (fast). Default data source for map.';
