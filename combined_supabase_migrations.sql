-- Combined Supabase migrations for Civil Alert System
-- Auto-generated from civil_alert_system/supabase/migrations
-- Generated: 2026-02-16 15:30:39 +05:30

-- ============================================================================
-- BEGIN MIGRATION: 001_create_hazard_reports.sql
-- ============================================================================

-- Civil Alert System - Hazard Reports Schema
-- Run this migration in your Supabase SQL Editor:
-- https://app.supabase.com/project/zaimfwpaloadjrljgdzd/sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create hazard_reports table
CREATE TABLE IF NOT EXISTS hazard_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_phone TEXT NOT NULL,
  user_name TEXT,
  hazard_type TEXT NOT NULL CHECK (hazard_type IN ('High Waves', 'Tsunami', 'Storm', 'Flood', 'Other')),
  description TEXT NOT NULL,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_high_risk BOOLEAN DEFAULT FALSE,
  people_at_risk INTEGER,
  urgency_level TEXT CHECK (urgency_level IN ('Low', 'Medium', 'High')),
  media_urls TEXT[],
  upload_complete BOOLEAN DEFAULT FALSE,
  status TEXT CHECK (status IN ('pending', 'verified', 'resolved')) DEFAULT 'pending',
  event_time TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_hazard_location ON hazard_reports USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_hazard_created_at ON hazard_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hazard_user_id ON hazard_reports (user_id);
CREATE INDEX IF NOT EXISTS idx_hazard_client_id ON hazard_reports (client_id);

-- Enable RLS
ALTER TABLE hazard_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (for idempotency)
DROP POLICY IF EXISTS "Users can insert own reports" ON hazard_reports;
DROP POLICY IF EXISTS "Anyone authenticated can view reports" ON hazard_reports;
DROP POLICY IF EXISTS "Users can update own reports" ON hazard_reports;

-- Create RLS policies
CREATE POLICY "Users can insert own reports" 
  ON hazard_reports 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone authenticated can view reports" 
  ON hazard_reports 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own reports" 
  ON hazard_reports 
  FOR UPDATE 
  USING (auth.uid() = user_id);


-- END MIGRATION: 001_create_hazard_reports.sql

-- ============================================================================
-- BEGIN MIGRATION: 002_create_map_functions.sql
-- ============================================================================

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
    CAST(ST_MakePoint(center_lon, center_lat) AS geography)
  );

-- Time index for freshness queries
CREATE INDEX IF NOT EXISTS idx_risk_zones_calculated_at 
  ON risk_zones_cached (calculated_at DESC);

-- ============================================
-- 2. GET VERIFIED REPORTS IN VIEWPORT BOUNDS
-- ============================================

-- Fetch verified reports within map viewport with privacy & security
DROP FUNCTION IF EXISTS public.get_verified_reports_in_bounds(
  double precision,
  double precision,
  double precision,
  double precision,
  integer
);

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
DROP FUNCTION IF EXISTS public.calculate_risk_zones_on_demand(
  double precision,
  double precision,
  integer
);

CREATE OR REPLACE FUNCTION calculate_risk_zones_on_demand(
  p_center_lat DOUBLE PRECISION,
  p_center_lon DOUBLE PRECISION,
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
        ST_SetSRID(ST_MakePoint(p_center_lon, p_center_lat), 4326)::geography,
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
    -- density_factor = report_count / area_kmÂ²
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
DROP FUNCTION IF EXISTS public.get_user_reports_on_map(
  uuid,
  integer
);

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
DROP FUNCTION IF EXISTS public.get_cached_risk_zones(
  double precision,
  double precision,
  double precision,
  double precision
);

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


-- END MIGRATION: 002_create_map_functions.sql

-- ============================================================================
-- BEGIN MIGRATION: 003_create_official_advisories.sql
-- ============================================================================

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


-- END MIGRATION: 003_create_official_advisories.sql

-- ============================================================================
-- BEGIN MIGRATION: 004_hazard_reports_privacy_rls.sql
-- ============================================================================

-- Civil Alert System - Privacy hardening for hazard_reports
-- Goal: citizens can read ONLY their own full reports; public map uses safe RPCs.

ALTER TABLE hazard_reports ENABLE ROW LEVEL SECURITY;

-- Replace overly-broad SELECT policy
DROP POLICY IF EXISTS "Anyone authenticated can view reports" ON hazard_reports;
DROP POLICY IF EXISTS "Users can view own reports" ON hazard_reports;

CREATE POLICY "Users can view own reports"
  ON hazard_reports
  FOR SELECT
  USING (auth.uid() = user_id);

-- Note: public viewing should happen via RPCs like get_verified_reports_in_bounds
-- which already returns reduced precision + safe columns.


-- END MIGRATION: 004_hazard_reports_privacy_rls.sql

-- ============================================================================
-- BEGIN MIGRATION: 005_storage_hazard_media.sql
-- ============================================================================

-- Civil Alert System - Supabase Storage bucket + RLS for hazard media
-- Creates the `hazard-media` bucket and allows authenticated users to upload/read/update/delete
-- only within their own folder prefix: `<auth.uid()>/<reportId>/...`

-- IMPORTANT (hosted Supabase):
-- You may see either of these when running in the SQL editor:
--   - ERROR: 42501: must be owner of table object
--   - ERROR: 42501: permission denied to set role "supabase_storage_admin"
-- This is expected on hosted Supabase because Storage tables are owned by an internal role.
--
-- Fix (recommended): create the bucket + policies in the Supabase Dashboard:
--   Storage â†’ Buckets â†’ New bucket â†’ name: hazard-media â†’ Public: ON
--   Storage â†’ Policies â†’ New policy (table: storage.objects)
-- Use these policy expressions (copy/paste):
--   INSERT (authenticated): bucket_id = 'hazard-media' AND (storage.foldername(name))[1] = auth.uid()::text
--   UPDATE (authenticated): bucket_id = 'hazard-media' AND (storage.foldername(name))[1] = auth.uid()::text
--   DELETE (authenticated): bucket_id = 'hazard-media' AND (storage.foldername(name))[1] = auth.uid()::text
-- Optional:
--   SELECT (authenticated): bucket_id = 'hazard-media' AND (storage.foldername(name))[1] = auth.uid()::text
--
-- The SQL below is kept as reference for environments where you CAN run it as the storage owner.
DO $$
BEGIN
  -- 1) Create bucket (id == name convention)
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('hazard-media', 'hazard-media', true)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  -- 2) Enable RLS on storage.objects (usually already enabled)
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

  -- 3) Policies for hazard-media
  -- Clean up for idempotency
  DROP POLICY IF EXISTS "hazard media: insert own" ON storage.objects;
  DROP POLICY IF EXISTS "hazard media: update own" ON storage.objects;
  DROP POLICY IF EXISTS "hazard media: select own" ON storage.objects;
  DROP POLICY IF EXISTS "hazard media: delete own" ON storage.objects;

  -- Helper condition: object key starts with the user's uid folder
  -- Note: `name` is the object path/key.
  CREATE POLICY "hazard media: insert own"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'hazard-media'
      AND name LIKE (auth.uid()::text || '/%')
    );

  CREATE POLICY "hazard media: update own"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'hazard-media'
      AND name LIKE (auth.uid()::text || '/%')
    )
    WITH CHECK (
      bucket_id = 'hazard-media'
      AND name LIKE (auth.uid()::text || '/%')
    );

  CREATE POLICY "hazard media: select own"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'hazard-media'
      AND name LIKE (auth.uid()::text || '/%')
    );

  CREATE POLICY "hazard media: delete own"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'hazard-media'
      AND name LIKE (auth.uid()::text || '/%')
    );
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping storage SQL (insufficient_privilege). Configure hazard-media bucket + policies in Supabase Dashboard.';
  WHEN undefined_table THEN
    RAISE NOTICE 'Skipping storage SQL (storage schema/tables unavailable in this environment).';
END
$$;



-- END MIGRATION: 005_storage_hazard_media.sql

-- ============================================================================
-- BEGIN MIGRATION: 006_get_verified_report_details.sql
-- ============================================================================

-- Fetch a single verified report with privacy-safe fields for public map details.
-- RLS prevents direct SELECT for other users; public access should go through SECURITY DEFINER RPCs.

DROP FUNCTION IF EXISTS public.get_verified_report_details(UUID);

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


-- END MIGRATION: 006_get_verified_report_details.sql

-- ============================================================================
-- BEGIN MIGRATION: 007_rate_limit_dedupe.sql
-- ============================================================================

-- Rate limiting + basic dedupe for hazard report creation
-- Android-only client still uses same backend.

ALTER TABLE hazard_reports
  ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Basic index for investigations/abuse controls
CREATE INDEX IF NOT EXISTS idx_hazard_device_id ON hazard_reports (device_id);

-- Create RPC that enforces:
-- - minimum interval between reports (30s)
-- - max reports per hour (20)
-- - basic dedupe: same hazard_type within 50m and 10 minutes returns existing id

CREATE OR REPLACE FUNCTION public.create_hazard_report(
  p_client_id uuid,
  p_user_phone text,
  p_user_name text,
  p_hazard_type text,
  p_description text,
  p_latitude double precision,
  p_longitude double precision,
  p_is_high_risk boolean DEFAULT false,
  p_people_at_risk integer DEFAULT null,
  p_urgency_level text DEFAULT null,
  p_event_time timestamptz DEFAULT now(),
  p_device_id text DEFAULT null
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_existing_id uuid;
  v_recent_count integer;
  v_last_created timestamptz;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;

  -- Dedupe: same hazard_type near same location in last 10 minutes
  SELECT id
    INTO v_existing_id
    FROM hazard_reports
    WHERE user_id = v_user_id
      AND hazard_type = p_hazard_type
      AND created_at > now() - interval '10 minutes'
      AND ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
        50
      )
    ORDER BY created_at DESC
    LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN v_existing_id;
  END IF;

  -- Rate limit: min interval 30s
  SELECT created_at
    INTO v_last_created
    FROM hazard_reports
    WHERE user_id = v_user_id
    ORDER BY created_at DESC
    LIMIT 1;

  IF v_last_created IS NOT NULL AND v_last_created > now() - interval '30 seconds' THEN
    RAISE EXCEPTION 'rate_limited_min_interval' USING ERRCODE = 'P0001';
  END IF;

  -- Rate limit: max 20/hour
  SELECT count(*)::int
    INTO v_recent_count
    FROM hazard_reports
    WHERE user_id = v_user_id
      AND created_at > now() - interval '1 hour';

  IF v_recent_count >= 20 THEN
    RAISE EXCEPTION 'rate_limited_hourly' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO hazard_reports(
    client_id,
    user_id,
    user_phone,
    user_name,
    hazard_type,
    description,
    location,
    latitude,
    longitude,
    is_high_risk,
    people_at_risk,
    urgency_level,
    status,
    event_time,
    device_id
  )
  VALUES (
    p_client_id,
    v_user_id,
    p_user_phone,
    NULLIF(p_user_name, ''),
    p_hazard_type,
    p_description,
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
    p_latitude,
    p_longitude,
    COALESCE(p_is_high_risk, false),
    p_people_at_risk,
    p_urgency_level,
    'pending',
    COALESCE(p_event_time, now()),
    p_device_id
  )
  RETURNING id INTO v_existing_id;

  RETURN v_existing_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_hazard_report(
  uuid,
  text,
  text,
  text,
  text,
  double precision,
  double precision,
  boolean,
  integer,
  text,
  timestamptz,
  text
) TO authenticated;


-- END MIGRATION: 007_rate_limit_dedupe.sql

-- ============================================================================
-- BEGIN MIGRATION: 008_push_notifications.sql
-- ============================================================================

-- Push notifications infrastructure (FCM)
-- This migration creates:
-- - push_tokens: stores per-user device tokens
-- - notification_outbox: queue of notifications to send
-- - triggers: enqueue notifications on advisories insert and hazard_reports status change

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  platform text NOT NULL DEFAULT 'android',
  token text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_enabled ON public.push_tokens (user_id, enabled);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own push tokens" ON public.push_tokens;
CREATE POLICY "Users manage own push tokens"
  ON public.push_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Outbox table: inserted by triggers; consumed by Edge Function with service role.
CREATE TABLE IF NOT EXISTS public.notification_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_pending ON public.notification_outbox (status, created_at);

ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

-- Nobody (including authenticated users) should read/insert outbox directly.
DROP POLICY IF EXISTS "No direct access" ON public.notification_outbox;
CREATE POLICY "No direct access"
  ON public.notification_outbox
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Enqueue for advisory insert: broadcast to all users with enabled tokens.
CREATE OR REPLACE FUNCTION public.enqueue_advisory_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_title text;
  v_body text;
BEGIN
  v_title := 'Advisory: ' || upper(coalesce(NEW.severity, 'info'));
  v_body := NEW.title || case when NEW.region is null or NEW.region = '' then '' else ' (' || NEW.region || ')' end;

  FOR r IN
    SELECT DISTINCT user_id
    FROM public.push_tokens
    WHERE enabled = true
  LOOP
    INSERT INTO public.notification_outbox(user_id, type, title, body, data)
      VALUES (
        r.user_id,
        'advisory',
        v_title,
        v_body,
        jsonb_build_object('advisory_id', NEW.id)
      );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Enqueue for report status updates: notify report owner.
CREATE OR REPLACE FUNCTION public.enqueue_report_status_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_status text;
  v_old_status text;
  v_title text;
  v_body text;
BEGIN
  v_new_status := coalesce(NEW.status, '');
  v_old_status := coalesce(OLD.status, '');

  IF v_new_status = v_old_status THEN
    RETURN NEW;
  END IF;

  v_title := 'Report update';
  v_body := coalesce(NEW.hazard_type, 'Report') || ' is now ' || upper(v_new_status);

  INSERT INTO public.notification_outbox(user_id, type, title, body, data)
    VALUES (
      NEW.user_id,
      'report_status',
      v_title,
      v_body,
      jsonb_build_object('report_id', NEW.id, 'status', v_new_status)
    );

  RETURN NEW;
END;
$$;

-- Triggers
DROP TRIGGER IF EXISTS trg_official_advisories_push ON public.official_advisories;
CREATE TRIGGER trg_official_advisories_push
AFTER INSERT ON public.official_advisories
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_advisory_push();

DROP TRIGGER IF EXISTS trg_hazard_reports_status_push ON public.hazard_reports;
CREATE TRIGGER trg_hazard_reports_status_push
AFTER UPDATE OF status ON public.hazard_reports
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_report_status_push();


-- END MIGRATION: 008_push_notifications.sql

-- ============================================================================
-- BEGIN MIGRATION: 009_extend_official_advisories.sql
-- ============================================================================

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


-- END MIGRATION: 009_extend_official_advisories.sql

-- ============================================================================
-- BEGIN MIGRATION: 010_zone_system_generated_risk_zones.sql
-- ============================================================================

-- Civil Alert System - Generated Risk Zones (System Zones + Admin Validation)
-- Adds:
-- - app_roles + is_admin() helper
-- - zone_settings (weights, thresholds)
-- - risk_zones (persisted system-generated zones with status)
-- - refresh_system_risk_zones() (scheduled recompute + upsert)
-- - admin_update_risk_zone_status() (human validation)
-- - Updates get_cached_risk_zones() to return ONLY verified/stable zones (citizen-safe)

-- ============================================
-- 0. ADMIN ROLE HELPERS
-- ============================================

CREATE TABLE IF NOT EXISTS app_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE app_roles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own role row.
DROP POLICY IF EXISTS "Users can read own role" ON app_roles;
CREATE POLICY "Users can read own role"
  ON app_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only service_role should manage roles.
DROP POLICY IF EXISTS "Service role manages roles" ON app_roles;
CREATE POLICY "Service role manages roles"
  ON app_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- SECURITY DEFINER helper. Used by admin-only APIs.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM app_roles r
    WHERE r.user_id = auth.uid()
      AND r.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

COMMENT ON TABLE app_roles IS 'Application-level roles (kept minimal). Insert admin user IDs here to unlock admin-only actions.';
COMMENT ON FUNCTION is_admin() IS 'Returns true if auth.uid() is marked as admin in app_roles.';

-- ============================================
-- 1. ZONE SETTINGS (WEIGHTS + THRESHOLDS)
-- ============================================

CREATE TABLE IF NOT EXISTS zone_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),

  -- Scoring weights
  report_weight DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  urgency_high_weight DOUBLE PRECISION NOT NULL DEFAULT 2.0,
  urgency_medium_weight DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  urgency_low_weight DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  verified_bonus DOUBLE PRECISION NOT NULL DEFAULT 2.0,
  media_bonus DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  high_risk_bonus DOUBLE PRECISION NOT NULL DEFAULT 1.0,

  -- Time / clustering
  window_minutes INTEGER NOT NULL DEFAULT 1440,         -- reports considered (last N minutes)
  active_minutes INTEGER NOT NULL DEFAULT 360,          -- zone remains active for N minutes since last seen
  decay_half_life_minutes INTEGER NOT NULL DEFAULT 360, -- score halves every N minutes
  eps_meters DOUBLE PRECISION NOT NULL DEFAULT 600.0,   -- DBSCAN eps
  min_points INTEGER NOT NULL DEFAULT 3,
  search_radius_km DOUBLE PRECISION NOT NULL DEFAULT 10.0,

  -- Thresholds (post-score)
  info_threshold DOUBLE PRECISION NOT NULL DEFAULT 10.0,
  caution_threshold DOUBLE PRECISION NOT NULL DEFAULT 25.0,
  high_threshold DOUBLE PRECISION NOT NULL DEFAULT 50.0,

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO zone_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE zone_settings ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read settings (no secrets).
DROP POLICY IF EXISTS "Authenticated can read zone settings" ON zone_settings;
CREATE POLICY "Authenticated can read zone settings"
  ON zone_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify settings.
DROP POLICY IF EXISTS "Admins can update zone settings" ON zone_settings;
CREATE POLICY "Admins can update zone settings"
  ON zone_settings
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

COMMENT ON TABLE zone_settings IS 'Tunable weights/thresholds for generated risk zones. Keep as singleton row (id=1).';

-- ============================================
-- 2. RISK ZONES TABLE (PERSISTED + VALIDATED)
-- ============================================

CREATE TABLE IF NOT EXISTS risk_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_key TEXT NOT NULL UNIQUE,

  center_lat DOUBLE PRECISION NOT NULL,
  center_lon DOUBLE PRECISION NOT NULL,
  radius_meters DOUBLE PRECISION NOT NULL,

  level TEXT NOT NULL CHECK (level IN ('informational', 'caution', 'high_risk')),
  status TEXT NOT NULL CHECK (status IN ('candidate', 'verified', 'suppressed', 'locked')) DEFAULT 'candidate',

  score DOUBLE PRECISION NOT NULL,

  report_count INTEGER NOT NULL,
  verified_count INTEGER NOT NULL,
  high_count INTEGER NOT NULL,
  medium_count INTEGER NOT NULL,
  low_count INTEGER NOT NULL,
  media_count INTEGER NOT NULL,
  high_risk_count INTEGER NOT NULL,

  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active_until TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  notes TEXT,
  locked_until TIMESTAMPTZ,

  -- Admin-only debug. Do NOT expose to citizens.
  contributing_report_ids UUID[],

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_zones_location
  ON risk_zones USING GIST (
    CAST(ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326) AS geography)
  );

CREATE INDEX IF NOT EXISTS idx_risk_zones_status_active
  ON risk_zones (status, active_until DESC);

CREATE INDEX IF NOT EXISTS idx_risk_zones_level_score
  ON risk_zones (level, score DESC);

ALTER TABLE risk_zones ENABLE ROW LEVEL SECURITY;

-- Citizens (and all authenticated users) can ONLY read verified and currently active zones.
DROP POLICY IF EXISTS "Authenticated read verified active zones" ON risk_zones;
CREATE POLICY "Authenticated read verified active zones"
  ON risk_zones
  FOR SELECT
  TO authenticated
  USING (status = 'verified' AND active_until >= NOW());

-- Admins can read all zones (including candidates) for decision support.
DROP POLICY IF EXISTS "Admins read all zones" ON risk_zones;
CREATE POLICY "Admins read all zones"
  ON risk_zones
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can update zones (confirm/suppress/lock/notes).
DROP POLICY IF EXISTS "Admins update zones" ON risk_zones;
CREATE POLICY "Admins update zones"
  ON risk_zones
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

COMMENT ON TABLE risk_zones IS 'System-generated risk zones. Admins validate candidate zones; citizens only see verified active zones.';

-- updated_at helper
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_risk_zones_updated_at ON risk_zones;
CREATE TRIGGER trg_risk_zones_updated_at
BEFORE UPDATE ON risk_zones
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_zone_settings_updated_at ON zone_settings;
CREATE TRIGGER trg_zone_settings_updated_at
BEFORE UPDATE ON zone_settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================
-- 3. ZONE GENERATION (DBSCAN + SCORE + UPSERT)
-- ============================================

CREATE OR REPLACE FUNCTION refresh_system_risk_zones()
RETURNS INTEGER
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
DECLARE
  s zone_settings%ROWTYPE;
  regions_processed INTEGER := 0;
  zone_rows INTEGER := 0;
  region_lat DOUBLE PRECISION;
  region_lon DOUBLE PRECISION;
  half_life_seconds DOUBLE PRECISION;
BEGIN
  SELECT * INTO s FROM zone_settings WHERE id = 1;

  IF s.id IS NULL THEN
    RAISE EXCEPTION 'zone_settings missing (id=1)';
  END IF;

  half_life_seconds := GREATEST(s.decay_half_life_minutes, 1) * 60.0;

  -- Cleanup: remove stale candidate zones that are no longer active.
  DELETE FROM risk_zones
  WHERE status = 'candidate'
    AND active_until < NOW();

  -- Use coarse regional bucketing to keep clustering bounded.
  FOR region_lat, region_lon IN
    SELECT
      ROUND(latitude::numeric, 1)::double precision,
      ROUND(longitude::numeric, 1)::double precision
    FROM hazard_reports
    WHERE created_at >= NOW() - (s.window_minutes || ' minutes')::INTERVAL
    GROUP BY 1, 2
    HAVING COUNT(*) >= s.min_points
  LOOP
    regions_processed := regions_processed + 1;

    WITH nearby AS (
      SELECT
        r.id,
        r.latitude,
        r.longitude,
        r.location,
        COALESCE(r.urgency_level, 'Low') AS urgency_level,
        r.is_high_risk,
        r.status,
        COALESCE(r.event_time, r.created_at) AS ts,
        COALESCE(array_length(r.media_urls, 1), 0) AS media_len,
        (
          s.report_weight
          + CASE
              WHEN COALESCE(r.urgency_level, 'Low') = 'High' THEN s.urgency_high_weight
              WHEN COALESCE(r.urgency_level, 'Low') = 'Medium' THEN s.urgency_medium_weight
              ELSE s.urgency_low_weight
            END
          + CASE WHEN r.status = 'verified' THEN s.verified_bonus ELSE 0 END
          + CASE WHEN COALESCE(array_length(r.media_urls, 1), 0) > 0 THEN s.media_bonus ELSE 0 END
          + CASE WHEN r.is_high_risk THEN s.high_risk_bonus ELSE 0 END
        ) AS weight
      FROM hazard_reports r
      WHERE
        r.created_at >= NOW() - (s.window_minutes || ' minutes')::INTERVAL
        AND ST_DWithin(
          r.location,
          ST_SetSRID(ST_MakePoint(region_lon, region_lat), 4326)::geography,
          s.search_radius_km * 1000.0
        )
    ),
    clustered AS (
      SELECT
        id,
        latitude,
        longitude,
        urgency_level,
        is_high_risk,
        status,
        ts,
        media_len,
        weight,
        ST_ClusterDBSCAN(location::geometry, eps := s.eps_meters, minpoints := s.min_points) OVER () AS cluster_id
      FROM nearby
    ),
    stats_base AS (
      SELECT
        cluster_id,
        AVG(latitude) AS avg_lat,
        AVG(longitude) AS avg_lon,
        COUNT(*)::integer AS report_count,
        COUNT(*) FILTER (WHERE status = 'verified')::integer AS verified_count,
        COUNT(*) FILTER (WHERE urgency_level = 'High')::integer AS high_count,
        COUNT(*) FILTER (WHERE urgency_level = 'Medium')::integer AS medium_count,
        COUNT(*) FILTER (WHERE urgency_level = 'Low')::integer AS low_count,
        COUNT(*) FILTER (WHERE media_len > 0)::integer AS media_count,
        COUNT(*) FILTER (WHERE is_high_risk)::integer AS high_risk_count,
        MAX(ts) AS last_ts,
        MIN(ts) AS first_ts,
        SUM(weight) AS raw_score,
        ARRAY_AGG(id ORDER BY ts DESC) AS contributing_ids
      FROM clustered
      WHERE cluster_id IS NOT NULL
      GROUP BY cluster_id
      HAVING COUNT(*) >= s.min_points
    ),
    stats_radius AS (
      SELECT
        c.cluster_id,
        GREATEST(
          MAX(
            ST_Distance(
              ST_SetSRID(ST_MakePoint(c.longitude, c.latitude), 4326)::geography,
              ST_SetSRID(ST_MakePoint(b.avg_lon, b.avg_lat), 4326)::geography
            )
          ),
          100.0
        ) AS radius_m
      FROM clustered c
      JOIN stats_base b ON b.cluster_id = c.cluster_id
      GROUP BY c.cluster_id, b.avg_lon, b.avg_lat
    ),
    stats AS (
      SELECT
        b.cluster_id,
        b.avg_lat,
        b.avg_lon,
        b.report_count,
        b.verified_count,
        b.high_count,
        b.medium_count,
        b.low_count,
        b.media_count,
        b.high_risk_count,
        b.last_ts,
        b.first_ts,
        r.radius_m,
        b.raw_score,
        b.contributing_ids
      FROM stats_base b
      JOIN stats_radius r ON r.cluster_id = b.cluster_id
    ),
    scored AS (
      SELECT
        -- A stable-ish key based on geohash + radius bucket (reduces churn)
        md5(
          ST_GeoHash(ST_SetSRID(ST_MakePoint(avg_lon, avg_lat), 4326), 7)
          || ':' || (ROUND(radius_m / 50.0) * 50.0)::text
        ) AS zone_key,
        avg_lat::double precision AS center_lat,
        avg_lon::double precision AS center_lon,
        radius_m::double precision AS radius_meters,
        report_count,
        verified_count,
        high_count,
        medium_count,
        low_count,
        media_count,
        high_risk_count,
        first_ts AS first_seen_at,
        last_ts AS last_seen_at,
        (NOW() + (s.active_minutes || ' minutes')::INTERVAL) AS active_until,
        NOW() AS calculated_at,
        contributing_ids,
        -- Score = raw_score * density_factor * time_decay
        (
          raw_score
          * (report_count::double precision / NULLIF(3.14159 * POWER(GREATEST(radius_m, 100.0) / 1000.0, 2), 0.01))
          * EXP(-LN(2) * (EXTRACT(EPOCH FROM (NOW() - last_ts)) / half_life_seconds))
        )::double precision AS score
      FROM stats
    ),
    classified AS (
      SELECT
        zone_key,
        center_lat,
        center_lon,
        radius_meters,
        report_count,
        verified_count,
        high_count,
        medium_count,
        low_count,
        media_count,
        high_risk_count,
        first_seen_at,
        last_seen_at,
        active_until,
        calculated_at,
        score,
        contributing_ids,
        CASE
          WHEN score >= s.high_threshold THEN 'high_risk'
          WHEN score >= s.caution_threshold THEN 'caution'
          WHEN score >= s.info_threshold THEN 'informational'
          ELSE NULL
        END AS level
      FROM scored
    )
    INSERT INTO risk_zones (
      zone_key,
      center_lat,
      center_lon,
      radius_meters,
      level,
      status,
      score,
      report_count,
      verified_count,
      high_count,
      medium_count,
      low_count,
      media_count,
      high_risk_count,
      first_seen_at,
      last_seen_at,
      active_until,
      calculated_at,
      contributing_report_ids
    )
    SELECT
      c.zone_key,
      c.center_lat,
      c.center_lon,
      c.radius_meters,
      c.level,
      'candidate',
      c.score,
      c.report_count,
      c.verified_count,
      c.high_count,
      c.medium_count,
      c.low_count,
      c.media_count,
      c.high_risk_count,
      c.first_seen_at,
      c.last_seen_at,
      c.active_until,
      c.calculated_at,
      c.contributing_ids
    FROM classified c
    WHERE c.level IS NOT NULL
    ON CONFLICT (zone_key)
    DO UPDATE SET
      center_lat = EXCLUDED.center_lat,
      center_lon = EXCLUDED.center_lon,
      radius_meters = EXCLUDED.radius_meters,
      level = EXCLUDED.level,
      score = EXCLUDED.score,
      report_count = EXCLUDED.report_count,
      verified_count = EXCLUDED.verified_count,
      high_count = EXCLUDED.high_count,
      medium_count = EXCLUDED.medium_count,
      low_count = EXCLUDED.low_count,
      media_count = EXCLUDED.media_count,
      high_risk_count = EXCLUDED.high_risk_count,
      first_seen_at = LEAST(risk_zones.first_seen_at, EXCLUDED.first_seen_at),
      last_seen_at = GREATEST(risk_zones.last_seen_at, EXCLUDED.last_seen_at),
      active_until = EXCLUDED.active_until,
      calculated_at = EXCLUDED.calculated_at,
      contributing_report_ids = EXCLUDED.contributing_report_ids,
      -- Preserve admin decisions.
      status = CASE
        WHEN risk_zones.status IN ('verified', 'suppressed') THEN risk_zones.status
        WHEN risk_zones.status = 'locked' AND COALESCE(risk_zones.locked_until, NOW()) > NOW() THEN 'locked'
        ELSE 'candidate'
      END;

    -- ROW_COUNT = number of rows inserted/updated by the last statement.
    -- Accumulate into zone_rows.
    DECLARE
      _rc INTEGER;
    BEGIN
      GET DIAGNOSTICS _rc = ROW_COUNT;
      zone_rows := zone_rows + _rc;
    END;
  END LOOP;

  RETURN zone_rows;
END;
$$;

GRANT EXECUTE ON FUNCTION refresh_system_risk_zones TO service_role;

COMMENT ON FUNCTION refresh_system_risk_zones IS 'Recompute candidate zones from recent reports using DBSCAN, score+classify them, and upsert into risk_zones. Intended for scheduling every 5-10 minutes.';

-- Keep backward-compatible scheduler entrypoint name.
-- Existing deployments may already schedule refresh_cached_risk_zones().
DROP FUNCTION IF EXISTS public.refresh_cached_risk_zones();

CREATE OR REPLACE FUNCTION refresh_cached_risk_zones()
RETURNS INTEGER
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
BEGIN
  RETURN refresh_system_risk_zones();
END;
$$;

GRANT EXECUTE ON FUNCTION refresh_cached_risk_zones TO service_role;

-- ============================================
-- 4. CITIZEN-SAFE FETCH (REUSES EXISTING RPC NAME)
-- ============================================

DROP FUNCTION IF EXISTS public.get_cached_risk_zones(
  double precision,
  double precision,
  double precision,
  double precision
);

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
    CASE rz.level
      WHEN 'high_risk' THEN 'high'
      WHEN 'caution' THEN 'medium'
      ELSE 'low'
    END AS intensity,
    rz.report_count,
    rz.score AS intensity_score,
    rz.calculated_at
  FROM risk_zones rz
  WHERE
    rz.status = 'verified'
    AND rz.active_until >= NOW()
    AND rz.center_lat BETWEEN min_lat AND max_lat
    AND rz.center_lon BETWEEN min_lon AND max_lon
  ORDER BY rz.score DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_cached_risk_zones TO authenticated;

COMMENT ON FUNCTION get_cached_risk_zones IS 'Citizen-safe zones for map overlays (verified + active only). Shape matches existing mobile client expectations.';

-- ============================================
-- 5. ADMIN VALIDATION API
-- ============================================

CREATE OR REPLACE FUNCTION admin_update_risk_zone_status(
  zone_id UUID,
  new_status TEXT,
  new_notes TEXT DEFAULT NULL,
  lock_until TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  IF new_status NOT IN ('candidate', 'verified', 'suppressed', 'locked') THEN
    RAISE EXCEPTION 'Invalid status: %', new_status;
  END IF;

  UPDATE risk_zones
  SET
    status = new_status,
    notes = COALESCE(new_notes, notes),
    locked_until = CASE WHEN new_status = 'locked' THEN lock_until ELSE NULL END,
    -- If admin verifies/locks, keep it active for longer.
    active_until = CASE
      WHEN new_status IN ('verified', 'locked') THEN GREATEST(active_until, NOW() + INTERVAL '6 hours')
      ELSE active_until
    END
  WHERE id = zone_id;
END;
$$;

REVOKE ALL ON FUNCTION admin_update_risk_zone_status(UUID, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_update_risk_zone_status(UUID, TEXT, TEXT, TIMESTAMPTZ) TO authenticated;

COMMENT ON FUNCTION admin_update_risk_zone_status IS 'Admin validation endpoint: confirm/suppress/lock zones and attach notes.';

-- ============================================
-- 6. ADMIN DEBUG / LISTING RPCs
-- ============================================

CREATE OR REPLACE FUNCTION admin_get_risk_zones_in_bounds(
  min_lat DOUBLE PRECISION,
  max_lat DOUBLE PRECISION,
  min_lon DOUBLE PRECISION,
  max_lon DOUBLE PRECISION,
  include_inactive BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  id UUID,
  zone_key TEXT,
  center_lat DOUBLE PRECISION,
  center_lon DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION,
  level TEXT,
  status TEXT,
  score DOUBLE PRECISION,
  report_count INTEGER,
  verified_count INTEGER,
  high_count INTEGER,
  medium_count INTEGER,
  low_count INTEGER,
  media_count INTEGER,
  high_risk_count INTEGER,
  first_seen_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  active_until TIMESTAMPTZ,
  calculated_at TIMESTAMPTZ,
  notes TEXT,
  locked_until TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    z.id,
    z.zone_key,
    z.center_lat,
    z.center_lon,
    z.radius_meters,
    z.level,
    z.status,
    z.score,
    z.report_count,
    z.verified_count,
    z.high_count,
    z.medium_count,
    z.low_count,
    z.media_count,
    z.high_risk_count,
    z.first_seen_at,
    z.last_seen_at,
    z.active_until,
    z.calculated_at,
    z.notes,
    z.locked_until
  FROM risk_zones z
  WHERE
    z.center_lat BETWEEN min_lat AND max_lat
    AND z.center_lon BETWEEN min_lon AND max_lon
    AND (include_inactive OR z.active_until >= NOW())
  ORDER BY z.score DESC
  LIMIT 500;
END;
$$;

REVOKE ALL ON FUNCTION admin_get_risk_zones_in_bounds(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_get_risk_zones_in_bounds(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, BOOLEAN) TO authenticated;

COMMENT ON FUNCTION admin_get_risk_zones_in_bounds IS 'Admin listing for generated zones (candidate/verified/suppressed/locked), including score and counts.';

CREATE OR REPLACE FUNCTION admin_refresh_system_risk_zones()
RETURNS INTEGER
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;
  RETURN refresh_system_risk_zones();
END;
$$;

REVOKE ALL ON FUNCTION admin_refresh_system_risk_zones() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_refresh_system_risk_zones() TO authenticated;

COMMENT ON FUNCTION admin_refresh_system_risk_zones IS 'Admin-triggered recomputation of candidate zones (useful for testing/tuning).';


-- END MIGRATION: 010_zone_system_generated_risk_zones.sql

-- ============================================================================
-- BEGIN MIGRATION: 011_admin_portal_hazard_reports_rls.sql
-- ============================================================================

-- Civil Alert System - Admin Portal RLS for hazard_reports
--
-- Problem:
-- - Migration 004 hardened hazard_reports so authenticated users can only SELECT their own reports.
-- - The admin web now uses real Supabase Auth (authenticated role), so it sees zero rows.
--
-- Fix:
-- - Add explicit admin policies that allow users marked in public.app_roles(role='admin')
--   to read and update all hazard reports.

ALTER TABLE public.hazard_reports ENABLE ROW LEVEL SECURITY;

-- Admins can read all reports
DROP POLICY IF EXISTS "Admins can view all reports" ON public.hazard_reports;
CREATE POLICY "Admins can view all reports"
  ON public.hazard_reports
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can update any report (verify/resolve)
DROP POLICY IF EXISTS "Admins can update any report" ON public.hazard_reports;
CREATE POLICY "Admins can update any report"
  ON public.hazard_reports
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- END MIGRATION: 011_admin_portal_hazard_reports_rls.sql

-- ============================================================================
-- BEGIN MIGRATION: 011_grant_cached_risk_zones_to_anon.sql
-- ============================================================================

-- Allow anonymous clients (mobile/public) to fetch citizen-safe cached risk zones.
-- The RPC itself returns ONLY verified + active zones.

GRANT EXECUTE ON FUNCTION public.get_cached_risk_zones(
  double precision,
  double precision,
  double precision,
  double precision
) TO anon;


-- END MIGRATION: 011_grant_cached_risk_zones_to_anon.sql

-- ============================================================================
-- BEGIN MIGRATION: 012_fix_refresh_system_risk_zones_nested_aggregates.sql
-- ============================================================================

-- Fix: "aggregate function calls cannot be nested" in refresh_system_risk_zones()
-- Cause: radius calculation used MAX(ST_Distance(... AVG(...) ...)) which nests aggregates.
-- Solution: compute centroid (AVG) in one CTE, then compute radius (MAX distance) in a second CTE.

CREATE OR REPLACE FUNCTION refresh_system_risk_zones()
RETURNS INTEGER
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
DECLARE
  s zone_settings%ROWTYPE;
  regions_processed INTEGER := 0;
  zone_rows INTEGER := 0;
  region_lat DOUBLE PRECISION;
  region_lon DOUBLE PRECISION;
  half_life_seconds DOUBLE PRECISION;
BEGIN
  SELECT * INTO s FROM zone_settings WHERE id = 1;

  IF s.id IS NULL THEN
    RAISE EXCEPTION 'zone_settings missing (id=1)';
  END IF;

  half_life_seconds := GREATEST(s.decay_half_life_minutes, 1) * 60.0;

  -- Cleanup: remove stale candidate zones that are no longer active.
  DELETE FROM risk_zones
  WHERE status = 'candidate'
    AND active_until < NOW();

  -- Use coarse regional bucketing to keep clustering bounded.
  FOR region_lat, region_lon IN
    SELECT
      ROUND(latitude::numeric, 1)::double precision,
      ROUND(longitude::numeric, 1)::double precision
    FROM hazard_reports
    WHERE created_at >= NOW() - (s.window_minutes || ' minutes')::INTERVAL
    GROUP BY 1, 2
    HAVING COUNT(*) >= s.min_points
  LOOP
    regions_processed := regions_processed + 1;

    WITH nearby AS (
      SELECT
        r.id,
        r.latitude,
        r.longitude,
        r.location,
        COALESCE(r.urgency_level, 'Low') AS urgency_level,
        r.is_high_risk,
        r.status,
        COALESCE(r.event_time, r.created_at) AS ts,
        COALESCE(array_length(r.media_urls, 1), 0) AS media_len,
        (
          s.report_weight
          + CASE
              WHEN COALESCE(r.urgency_level, 'Low') = 'High' THEN s.urgency_high_weight
              WHEN COALESCE(r.urgency_level, 'Low') = 'Medium' THEN s.urgency_medium_weight
              ELSE s.urgency_low_weight
            END
          + CASE WHEN r.status = 'verified' THEN s.verified_bonus ELSE 0 END
          + CASE WHEN COALESCE(array_length(r.media_urls, 1), 0) > 0 THEN s.media_bonus ELSE 0 END
          + CASE WHEN r.is_high_risk THEN s.high_risk_bonus ELSE 0 END
        ) AS weight
      FROM hazard_reports r
      WHERE
        r.created_at >= NOW() - (s.window_minutes || ' minutes')::INTERVAL
        AND ST_DWithin(
          r.location,
          ST_SetSRID(ST_MakePoint(region_lon, region_lat), 4326)::geography,
          s.search_radius_km * 1000.0
        )
    ),
    clustered AS (
      SELECT
        id,
        latitude,
        longitude,
        urgency_level,
        is_high_risk,
        status,
        ts,
        media_len,
        weight,
        ST_ClusterDBSCAN(location::geometry, eps := s.eps_meters, minpoints := s.min_points) OVER () AS cluster_id
      FROM nearby
    ),
    stats_base AS (
      SELECT
        cluster_id,
        AVG(latitude) AS avg_lat,
        AVG(longitude) AS avg_lon,
        COUNT(*)::integer AS report_count,
        COUNT(*) FILTER (WHERE status = 'verified')::integer AS verified_count,
        COUNT(*) FILTER (WHERE urgency_level = 'High')::integer AS high_count,
        COUNT(*) FILTER (WHERE urgency_level = 'Medium')::integer AS medium_count,
        COUNT(*) FILTER (WHERE urgency_level = 'Low')::integer AS low_count,
        COUNT(*) FILTER (WHERE media_len > 0)::integer AS media_count,
        COUNT(*) FILTER (WHERE is_high_risk)::integer AS high_risk_count,
        MAX(ts) AS last_ts,
        MIN(ts) AS first_ts,
        SUM(weight) AS raw_score,
        ARRAY_AGG(id ORDER BY ts DESC) AS contributing_ids
      FROM clustered
      WHERE cluster_id IS NOT NULL
      GROUP BY cluster_id
      HAVING COUNT(*) >= s.min_points
    ),
    stats_radius AS (
      SELECT
        c.cluster_id,
        GREATEST(
          MAX(
            ST_Distance(
              ST_SetSRID(ST_MakePoint(c.longitude, c.latitude), 4326)::geography,
              ST_SetSRID(ST_MakePoint(b.avg_lon, b.avg_lat), 4326)::geography
            )
          ),
          100.0
        ) AS radius_m
      FROM clustered c
      JOIN stats_base b ON b.cluster_id = c.cluster_id
      GROUP BY c.cluster_id, b.avg_lon, b.avg_lat
    ),
    stats AS (
      SELECT
        b.cluster_id,
        b.avg_lat,
        b.avg_lon,
        b.report_count,
        b.verified_count,
        b.high_count,
        b.medium_count,
        b.low_count,
        b.media_count,
        b.high_risk_count,
        b.last_ts,
        b.first_ts,
        r.radius_m,
        b.raw_score,
        b.contributing_ids
      FROM stats_base b
      JOIN stats_radius r ON r.cluster_id = b.cluster_id
    ),
    scored AS (
      SELECT
        -- A stable-ish key based on geohash + radius bucket (reduces churn)
        md5(
          ST_GeoHash(ST_SetSRID(ST_MakePoint(avg_lon, avg_lat), 4326), 7)
          || ':' || (ROUND(radius_m / 50.0) * 50.0)::text
        ) AS zone_key,
        avg_lat::double precision AS center_lat,
        avg_lon::double precision AS center_lon,
        radius_m::double precision AS radius_meters,
        report_count,
        verified_count,
        high_count,
        medium_count,
        low_count,
        media_count,
        high_risk_count,
        first_ts AS first_seen_at,
        last_ts AS last_seen_at,
        (NOW() + (s.active_minutes || ' minutes')::INTERVAL) AS active_until,
        NOW() AS calculated_at,
        contributing_ids,
        -- Score = raw_score * density_factor * time_decay
        (
          raw_score
          * (report_count::double precision / NULLIF(3.14159 * POWER(GREATEST(radius_m, 100.0) / 1000.0, 2), 0.01))
          * EXP(-LN(2) * (EXTRACT(EPOCH FROM (NOW() - last_ts)) / half_life_seconds))
        )::double precision AS score
      FROM stats
    ),
    classified AS (
      SELECT
        zone_key,
        center_lat,
        center_lon,
        radius_meters,
        report_count,
        verified_count,
        high_count,
        medium_count,
        low_count,
        media_count,
        high_risk_count,
        first_seen_at,
        last_seen_at,
        active_until,
        calculated_at,
        score,
        contributing_ids,
        CASE
          WHEN score >= s.high_threshold THEN 'high_risk'
          WHEN score >= s.caution_threshold THEN 'caution'
          WHEN score >= s.info_threshold THEN 'informational'
          ELSE NULL
        END AS level
      FROM scored
    )
    INSERT INTO risk_zones (
      zone_key,
      center_lat,
      center_lon,
      radius_meters,
      level,
      status,
      score,
      report_count,
      verified_count,
      high_count,
      medium_count,
      low_count,
      media_count,
      high_risk_count,
      first_seen_at,
      last_seen_at,
      active_until,
      calculated_at,
      contributing_report_ids
    )
    SELECT
      c.zone_key,
      c.center_lat,
      c.center_lon,
      c.radius_meters,
      c.level,
      'candidate',
      c.score,
      c.report_count,
      c.verified_count,
      c.high_count,
      c.medium_count,
      c.low_count,
      c.media_count,
      c.high_risk_count,
      c.first_seen_at,
      c.last_seen_at,
      c.active_until,
      c.calculated_at,
      c.contributing_ids
    FROM classified c
    WHERE c.level IS NOT NULL
    ON CONFLICT (zone_key)
    DO UPDATE SET
      center_lat = EXCLUDED.center_lat,
      center_lon = EXCLUDED.center_lon,
      radius_meters = EXCLUDED.radius_meters,
      level = EXCLUDED.level,
      score = EXCLUDED.score,
      report_count = EXCLUDED.report_count,
      verified_count = EXCLUDED.verified_count,
      high_count = EXCLUDED.high_count,
      medium_count = EXCLUDED.medium_count,
      low_count = EXCLUDED.low_count,
      media_count = EXCLUDED.media_count,
      high_risk_count = EXCLUDED.high_risk_count,
      first_seen_at = LEAST(risk_zones.first_seen_at, EXCLUDED.first_seen_at),
      last_seen_at = GREATEST(risk_zones.last_seen_at, EXCLUDED.last_seen_at),
      active_until = EXCLUDED.active_until,
      calculated_at = EXCLUDED.calculated_at,
      contributing_report_ids = EXCLUDED.contributing_report_ids,
      -- Preserve admin decisions.
      status = CASE
        WHEN risk_zones.status IN ('verified', 'suppressed') THEN risk_zones.status
        WHEN risk_zones.status = 'locked' AND COALESCE(risk_zones.locked_until, NOW()) > NOW() THEN 'locked'
        ELSE 'candidate'
      END;

    -- ROW_COUNT = number of rows inserted/updated by the last statement.
    -- Accumulate into zone_rows.
    DECLARE
      _rc INTEGER;
    BEGIN
      GET DIAGNOSTICS _rc = ROW_COUNT;
      zone_rows := zone_rows + _rc;
    END;
  END LOOP;

  RETURN zone_rows;
END;
$$;

GRANT EXECUTE ON FUNCTION refresh_system_risk_zones TO service_role;

COMMENT ON FUNCTION refresh_system_risk_zones IS 'Recompute candidate zones from recent reports using DBSCAN, score+classify them, and upsert into risk_zones. Intended for scheduling every 5-10 minutes.';


-- END MIGRATION: 012_fix_refresh_system_risk_zones_nested_aggregates.sql

-- ============================================================================
-- BEGIN MIGRATION: 013_admin_seed_mock_hazard_reports.sql
-- ============================================================================

-- Admin-only mock data seeding for zone testing
--
-- Why:
-- - Monitoring zones are generated from recent hazard_reports.
-- - In a new project there may be too few reports to form clusters.
--
-- What:
-- - admin_seed_mock_hazard_reports(): inserts clustered reports near a given center
-- - admin_clear_mock_hazard_reports(): deletes previously seeded reports

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.admin_seed_mock_hazard_reports(
  p_clusters integer DEFAULT 3,
  p_reports_per_cluster integer DEFAULT 25,
  p_center_lat double precision DEFAULT 13.0800,
  p_center_lon double precision DEFAULT 80.2700,
  p_cluster_spread_meters double precision DEFAULT 350.0,
  p_age_minutes integer DEFAULT 45
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_inserted integer := 0;
  c integer;
  i integer;
  base_lat double precision;
  base_lon double precision;
  d_m double precision;
  bearing double precision;
  lat_off double precision;
  lon_off double precision;
  lat double precision;
  lon double precision;
  hazard_types text[] := ARRAY['High Waves','Tsunami','Storm','Flood','Other'];
  urgency_levels text[] := ARRAY['Low','Medium','High'];
  chosen_hazard text;
  chosen_urgency text;
  chosen_status text;
  is_hr boolean;
  created_ts timestamptz;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_admin' USING ERRCODE = 'P0001';
  END IF;

  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;

  p_clusters := GREATEST(COALESCE(p_clusters, 0), 0);
  p_reports_per_cluster := GREATEST(COALESCE(p_reports_per_cluster, 0), 0);
  p_cluster_spread_meters := GREATEST(COALESCE(p_cluster_spread_meters, 0), 0.0);
  p_age_minutes := GREATEST(COALESCE(p_age_minutes, 1), 1);

  FOR c IN 1..p_clusters LOOP
    -- Pick a cluster center within ~2km of the given center.
    d_m := random() * 2000.0;
    bearing := random() * 2.0 * pi();

    lat_off := (d_m * cos(bearing)) / 111320.0;
    lon_off := (d_m * sin(bearing)) / (111320.0 * GREATEST(cos(radians(p_center_lat)), 0.2));

    base_lat := p_center_lat + lat_off;
    base_lon := p_center_lon + lon_off;

    FOR i IN 1..p_reports_per_cluster LOOP
      -- Scatter points around the cluster center.
      d_m := random() * p_cluster_spread_meters;
      bearing := random() * 2.0 * pi();

      lat_off := (d_m * cos(bearing)) / 111320.0;
      lon_off := (d_m * sin(bearing)) / (111320.0 * GREATEST(cos(radians(base_lat)), 0.2));

      lat := base_lat + lat_off;
      lon := base_lon + lon_off;

      chosen_hazard := hazard_types[1 + floor(random() * array_length(hazard_types, 1))::int];
      chosen_urgency := urgency_levels[1 + floor(random() * array_length(urgency_levels, 1))::int];

      -- Bias some reports as verified to create stronger signals.
      chosen_status := CASE WHEN random() < 0.35 THEN 'verified' ELSE 'pending' END;
      is_hr := random() < 0.25;

      created_ts := now() - ((random() * p_age_minutes)::text || ' minutes')::interval;

      INSERT INTO public.hazard_reports(
        id,
        client_id,
        user_id,
        user_phone,
        user_name,
        hazard_type,
        description,
        location,
        latitude,
        longitude,
        is_high_risk,
        people_at_risk,
        urgency_level,
        media_urls,
        upload_complete,
        status,
        event_time,
        created_at,
        device_id
      )
      VALUES (
        gen_random_uuid(),
        gen_random_uuid(),
        v_user_id,
        '0000000000',
        'Mock Admin',
        chosen_hazard,
        '[MOCK] Seed report for zone testing',
        ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
        lat,
        lon,
        is_hr,
        CASE WHEN random() < 0.5 THEN (10 + floor(random() * 80))::int ELSE NULL END,
        chosen_urgency,
        NULL,
        true,
        chosen_status,
        created_ts,
        created_ts,
        'mock-seed'
      );

      v_inserted := v_inserted + 1;
    END LOOP;
  END LOOP;

  RETURN v_inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_seed_mock_hazard_reports(integer, integer, double precision, double precision, double precision, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_seed_mock_hazard_reports(integer, integer, double precision, double precision, double precision, integer) TO authenticated;

COMMENT ON FUNCTION public.admin_seed_mock_hazard_reports IS 'Admin-only: seed clustered mock hazard_reports for testing zone generation. Writes rows with device_id=mock-seed and description prefix [MOCK].';


CREATE OR REPLACE FUNCTION public.admin_clear_mock_hazard_reports()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_admin' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM public.hazard_reports
  WHERE device_id = 'mock-seed'
     OR description LIKE '[MOCK]%';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_clear_mock_hazard_reports() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_clear_mock_hazard_reports() TO authenticated;

COMMENT ON FUNCTION public.admin_clear_mock_hazard_reports IS 'Admin-only: delete mock hazard_reports created for testing (device_id=mock-seed or description prefix [MOCK]).';


-- END MIGRATION: 013_admin_seed_mock_hazard_reports.sql

-- ============================================================================
-- BEGIN MIGRATION: 014_fix_mock_seed_uuid.sql
-- ============================================================================

-- Fix for mock seeding RPC: uuid_generate_v4() not available
--
-- Symptom:
--   function uuid_generate_v4() does not exist (42883)
--
-- Cause:
--   uuid-ossp extension may not be enabled in the project.
--
-- Fix:
--   Use pgcrypto's gen_random_uuid() (and ensure pgcrypto extension exists)
--   and replace the RPCs.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.admin_seed_mock_hazard_reports(
  p_clusters integer DEFAULT 3,
  p_reports_per_cluster integer DEFAULT 25,
  p_center_lat double precision DEFAULT 13.0800,
  p_center_lon double precision DEFAULT 80.2700,
  p_cluster_spread_meters double precision DEFAULT 350.0,
  p_age_minutes integer DEFAULT 45
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_inserted integer := 0;
  c integer;
  i integer;
  base_lat double precision;
  base_lon double precision;
  d_m double precision;
  bearing double precision;
  lat_off double precision;
  lon_off double precision;
  lat double precision;
  lon double precision;
  hazard_types text[] := ARRAY['High Waves','Tsunami','Storm','Flood','Other'];
  urgency_levels text[] := ARRAY['Low','Medium','High'];
  chosen_hazard text;
  chosen_urgency text;
  chosen_status text;
  is_hr boolean;
  created_ts timestamptz;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_admin' USING ERRCODE = 'P0001';
  END IF;

  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;

  p_clusters := GREATEST(COALESCE(p_clusters, 0), 0);
  p_reports_per_cluster := GREATEST(COALESCE(p_reports_per_cluster, 0), 0);
  p_cluster_spread_meters := GREATEST(COALESCE(p_cluster_spread_meters, 0), 0.0);
  p_age_minutes := GREATEST(COALESCE(p_age_minutes, 1), 1);

  FOR c IN 1..p_clusters LOOP
    -- Pick a cluster center within ~2km of the given center.
    d_m := random() * 2000.0;
    bearing := random() * 2.0 * pi();

    lat_off := (d_m * cos(bearing)) / 111320.0;
    lon_off := (d_m * sin(bearing)) / (111320.0 * GREATEST(cos(radians(p_center_lat)), 0.2));

    base_lat := p_center_lat + lat_off;
    base_lon := p_center_lon + lon_off;

    FOR i IN 1..p_reports_per_cluster LOOP
      -- Scatter points around the cluster center.
      d_m := random() * p_cluster_spread_meters;
      bearing := random() * 2.0 * pi();

      lat_off := (d_m * cos(bearing)) / 111320.0;
      lon_off := (d_m * sin(bearing)) / (111320.0 * GREATEST(cos(radians(base_lat)), 0.2));

      lat := base_lat + lat_off;
      lon := base_lon + lon_off;

      chosen_hazard := hazard_types[1 + floor(random() * array_length(hazard_types, 1))::int];
      chosen_urgency := urgency_levels[1 + floor(random() * array_length(urgency_levels, 1))::int];

      -- Bias some reports as verified to create stronger signals.
      chosen_status := CASE WHEN random() < 0.35 THEN 'verified' ELSE 'pending' END;
      is_hr := random() < 0.25;

      created_ts := now() - ((random() * p_age_minutes)::text || ' minutes')::interval;

      INSERT INTO public.hazard_reports(
        id,
        client_id,
        user_id,
        user_phone,
        user_name,
        hazard_type,
        description,
        location,
        latitude,
        longitude,
        is_high_risk,
        people_at_risk,
        urgency_level,
        media_urls,
        upload_complete,
        status,
        event_time,
        created_at,
        device_id
      )
      VALUES (
        gen_random_uuid(),
        gen_random_uuid(),
        v_user_id,
        '0000000000',
        'Mock Admin',
        chosen_hazard,
        '[MOCK] Seed report for zone testing',
        ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
        lat,
        lon,
        is_hr,
        CASE WHEN random() < 0.5 THEN (10 + floor(random() * 80))::int ELSE NULL END,
        chosen_urgency,
        NULL,
        true,
        chosen_status,
        created_ts,
        created_ts,
        'mock-seed'
      );

      v_inserted := v_inserted + 1;
    END LOOP;
  END LOOP;

  RETURN v_inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_seed_mock_hazard_reports(integer, integer, double precision, double precision, double precision, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_seed_mock_hazard_reports(integer, integer, double precision, double precision, double precision, integer) TO authenticated;

COMMENT ON FUNCTION public.admin_seed_mock_hazard_reports IS 'Admin-only: seed clustered mock hazard_reports for testing zone generation. Writes rows with device_id=mock-seed and description prefix [MOCK].';


CREATE OR REPLACE FUNCTION public.admin_clear_mock_hazard_reports()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_admin' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM public.hazard_reports
  WHERE device_id = 'mock-seed'
     OR description LIKE '[MOCK]%';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_clear_mock_hazard_reports() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_clear_mock_hazard_reports() TO authenticated;

COMMENT ON FUNCTION public.admin_clear_mock_hazard_reports IS 'Admin-only: delete mock hazard_reports created for testing (device_id=mock-seed or description prefix [MOCK]).';


-- END MIGRATION: 014_fix_mock_seed_uuid.sql

-- ============================================================================
-- BEGIN MIGRATION: 015_public_read_official_advisories.sql
-- ============================================================================

-- Allow mobile map (including anon users) to read official advisories
--
-- Problem:
-- - official_advisories RLS originally allowed SELECT only for authenticated.
-- - Many mobile users may not be signed in, so advisories (official updates) never appear on the map.
--
-- Fix:
-- - Add a SELECT policy for anon + authenticated.

ALTER TABLE public.official_advisories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read advisories" ON public.official_advisories;
DROP POLICY IF EXISTS "Public can read advisories" ON public.official_advisories;

CREATE POLICY "Public can read advisories"
  ON public.official_advisories
  FOR SELECT
  TO anon, authenticated
  USING (true);


-- END MIGRATION: 015_public_read_official_advisories.sql

-- ============================================================================
-- BEGIN MIGRATION: 016_admin_delete_official_advisories.sql
-- ============================================================================

-- Allow admins to delete official advisories (official updates)
--
-- The admin web app needs to delete records from `public.official_advisories`.
-- Deletion should be restricted to admin users only.

ALTER TABLE public.official_advisories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can delete advisories" ON public.official_advisories;

CREATE POLICY "Admins can delete advisories"
  ON public.official_advisories
  FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- END MIGRATION: 016_admin_delete_official_advisories.sql

-- ============================================================================
-- BEGIN MIGRATION: 017_grant_anon_verified_reports_in_bounds.sql
-- ============================================================================

-- Allow anon users to fetch privacy-safe verified reports for map/home feeds.
--
-- The RPC returns reduced-precision coordinates (~100m) and only verified reports,
-- so granting EXECUTE to anon is acceptable for public viewing.

GRANT EXECUTE ON FUNCTION public.get_verified_reports_in_bounds(
  double precision,
  double precision,
  double precision,
  double precision,
  integer
) TO anon;


-- END MIGRATION: 017_grant_anon_verified_reports_in_bounds.sql

-- ============================================================================
-- BEGIN MIGRATION: 018_verified_reports_in_bounds_include_media.sql
-- ============================================================================

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


-- END MIGRATION: 018_verified_reports_in_bounds_include_media.sql

-- ============================================================================
-- BEGIN MIGRATION: 019_add_rejected_status_hazard_reports.sql
-- ============================================================================

-- Allow admin reject flow by supporting a 'rejected' status on hazard_reports.
--
-- Admin web moderation uses status transitions:
-- - pending -> verified (accept)
-- - pending -> rejected (reject)
-- - verified -> resolved (optional)

DO $$
BEGIN
  -- Default name for inline CHECK constraint is typically hazard_reports_status_check
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'hazard_reports'
      AND c.conname = 'hazard_reports_status_check'
  ) THEN
    ALTER TABLE public.hazard_reports
      DROP CONSTRAINT hazard_reports_status_check;
  END IF;

  -- Recreate with rejected included.
  -- Idempotent: only add if not already present.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'hazard_reports'
      AND c.conname = 'hazard_reports_status_check'
  ) THEN
    ALTER TABLE public.hazard_reports
      ADD CONSTRAINT hazard_reports_status_check
      CHECK (status IN ('pending', 'verified', 'rejected', 'resolved'));
  END IF;
END
$$;


-- END MIGRATION: 019_add_rejected_status_hazard_reports.sql

-- ============================================================================
-- BEGIN MIGRATION: 020_fix_uuid_generate_v4_dependency.sql
-- ============================================================================

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


-- END MIGRATION: 020_fix_uuid_generate_v4_dependency.sql

-- ============================================================================
-- BEGIN MIGRATION: 021_fix_refresh_system_risk_zones_uuid_default_dependency.sql
-- ============================================================================

-- Fix: refresh_system_risk_zones() should not depend on risk_zones.id default uuid_generate_v4()
--
-- Some Supabase projects do not have uuid-ossp enabled, so table defaults calling
-- uuid_generate_v4() can break inserts. refresh_system_risk_zones() previously
-- inserted into risk_zones without specifying id, relying on the table default.
--
-- This migration updates refresh_system_risk_zones() to explicitly insert
-- id = gen_random_uuid() (pgcrypto), removing the dependency.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION refresh_system_risk_zones()
RETURNS INTEGER
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
DECLARE
  s zone_settings%ROWTYPE;
  regions_processed INTEGER := 0;
  zone_rows INTEGER := 0;
  region_lat DOUBLE PRECISION;
  region_lon DOUBLE PRECISION;
  half_life_seconds DOUBLE PRECISION;
BEGIN
  SELECT * INTO s FROM zone_settings WHERE id = 1;

  IF s.id IS NULL THEN
    RAISE EXCEPTION 'zone_settings missing (id=1)';
  END IF;

  half_life_seconds := GREATEST(s.decay_half_life_minutes, 1) * 60.0;

  -- Cleanup: remove stale candidate zones that are no longer active.
  DELETE FROM risk_zones
  WHERE status = 'candidate'
    AND active_until < NOW();

  -- Use coarse regional bucketing to keep clustering bounded.
  FOR region_lat, region_lon IN
    SELECT
      ROUND(latitude::numeric, 1)::double precision,
      ROUND(longitude::numeric, 1)::double precision
    FROM hazard_reports
    WHERE created_at >= NOW() - (s.window_minutes || ' minutes')::INTERVAL
    GROUP BY 1, 2
    HAVING COUNT(*) >= s.min_points
  LOOP
    regions_processed := regions_processed + 1;

    WITH nearby AS (
      SELECT
        r.id,
        r.latitude,
        r.longitude,
        r.location,
        COALESCE(r.urgency_level, 'Low') AS urgency_level,
        r.is_high_risk,
        r.status,
        COALESCE(r.event_time, r.created_at) AS ts,
        COALESCE(array_length(r.media_urls, 1), 0) AS media_len,
        (
          s.report_weight
          + CASE
              WHEN COALESCE(r.urgency_level, 'Low') = 'High' THEN s.urgency_high_weight
              WHEN COALESCE(r.urgency_level, 'Low') = 'Medium' THEN s.urgency_medium_weight
              ELSE s.urgency_low_weight
            END
          + CASE WHEN r.status = 'verified' THEN s.verified_bonus ELSE 0 END
          + CASE WHEN COALESCE(array_length(r.media_urls, 1), 0) > 0 THEN s.media_bonus ELSE 0 END
          + CASE WHEN r.is_high_risk THEN s.high_risk_bonus ELSE 0 END
        ) AS weight
      FROM hazard_reports r
      WHERE
        r.created_at >= NOW() - (s.window_minutes || ' minutes')::INTERVAL
        AND ST_DWithin(
          r.location,
          ST_SetSRID(ST_MakePoint(region_lon, region_lat), 4326)::geography,
          s.search_radius_km * 1000.0
        )
    ),
    clustered AS (
      SELECT
        id,
        latitude,
        longitude,
        urgency_level,
        is_high_risk,
        status,
        ts,
        media_len,
        weight,
        ST_ClusterDBSCAN(location::geometry, eps := s.eps_meters, minpoints := s.min_points) OVER () AS cluster_id
      FROM nearby
    ),
    stats_base AS (
      SELECT
        cluster_id,
        AVG(latitude) AS avg_lat,
        AVG(longitude) AS avg_lon,
        COUNT(*)::integer AS report_count,
        COUNT(*) FILTER (WHERE status = 'verified')::integer AS verified_count,
        COUNT(*) FILTER (WHERE urgency_level = 'High')::integer AS high_count,
        COUNT(*) FILTER (WHERE urgency_level = 'Medium')::integer AS medium_count,
        COUNT(*) FILTER (WHERE urgency_level = 'Low')::integer AS low_count,
        COUNT(*) FILTER (WHERE media_len > 0)::integer AS media_count,
        COUNT(*) FILTER (WHERE is_high_risk)::integer AS high_risk_count,
        MAX(ts) AS last_ts,
        MIN(ts) AS first_ts,
        SUM(weight) AS raw_score,
        ARRAY_AGG(id ORDER BY ts DESC) AS contributing_ids
      FROM clustered
      WHERE cluster_id IS NOT NULL
      GROUP BY cluster_id
      HAVING COUNT(*) >= s.min_points
    ),
    stats_radius AS (
      SELECT
        c.cluster_id,
        GREATEST(
          MAX(
            ST_Distance(
              ST_SetSRID(ST_MakePoint(c.longitude, c.latitude), 4326)::geography,
              ST_SetSRID(ST_MakePoint(b.avg_lon, b.avg_lat), 4326)::geography
            )
          ),
          100.0
        ) AS radius_m
      FROM clustered c
      JOIN stats_base b ON b.cluster_id = c.cluster_id
      GROUP BY c.cluster_id
    ),
    scored AS (
      SELECT
        b.cluster_id,
        b.avg_lat,
        b.avg_lon,
        r.radius_m,
        b.report_count,
        b.verified_count,
        b.high_count,
        b.medium_count,
        b.low_count,
        b.media_count,
        b.high_risk_count,
        b.first_ts,
        b.last_ts,
        b.raw_score,
        b.contributing_ids,
        NOW() AS calculated_at,
        -- Score = raw_score * density_factor * time_decay
        (
          b.raw_score
          * (1.0 + LEAST(b.report_count::double precision / 10.0, 2.0))
          * EXP(-LN(2) * (EXTRACT(EPOCH FROM (NOW() - b.last_ts)) / half_life_seconds))
        )::double precision AS score
      FROM stats_base b
      JOIN stats_radius r ON r.cluster_id = b.cluster_id
    ),
    classified AS (
      SELECT
        -- Stable key so upserts work across recomputes.
        (
          ST_GeoHash(ST_SetSRID(ST_MakePoint(avg_lon, avg_lat), 4326), 7)
          || ':' || ROUND(radius_m::numeric, 0)::text
        ) AS zone_key,
        avg_lat::double precision AS center_lat,
        avg_lon::double precision AS center_lon,
        radius_m::double precision AS radius_meters,
        NOW() AS calculated_at,
        score,
        report_count,
        verified_count,
        high_count,
        medium_count,
        low_count,
        media_count,
        high_risk_count,
        first_ts AS first_seen_at,
        last_ts AS last_seen_at,
        (last_ts + (s.active_minutes || ' minutes')::INTERVAL) AS active_until,
        contributing_ids,
        CASE
          WHEN score >= s.high_threshold THEN 'high_risk'
          WHEN score >= s.caution_threshold THEN 'caution'
          WHEN score >= s.info_threshold THEN 'informational'
          ELSE NULL
        END AS level
      FROM scored
    )
    INSERT INTO risk_zones (
      id,
      zone_key,
      center_lat,
      center_lon,
      radius_meters,
      level,
      status,
      score,
      report_count,
      verified_count,
      high_count,
      medium_count,
      low_count,
      media_count,
      high_risk_count,
      first_seen_at,
      last_seen_at,
      active_until,
      calculated_at,
      contributing_report_ids
    )
    SELECT
      gen_random_uuid(),
      c.zone_key,
      c.center_lat,
      c.center_lon,
      c.radius_meters,
      c.level,
      'candidate',
      c.score,
      c.report_count,
      c.verified_count,
      c.high_count,
      c.medium_count,
      c.low_count,
      c.media_count,
      c.high_risk_count,
      c.first_seen_at,
      c.last_seen_at,
      c.active_until,
      c.calculated_at,
      c.contributing_ids
    FROM classified c
    WHERE c.level IS NOT NULL
    ON CONFLICT (zone_key)
    DO UPDATE SET
      center_lat = EXCLUDED.center_lat,
      center_lon = EXCLUDED.center_lon,
      radius_meters = EXCLUDED.radius_meters,
      level = EXCLUDED.level,
      score = EXCLUDED.score,
      report_count = EXCLUDED.report_count,
      verified_count = EXCLUDED.verified_count,
      high_count = EXCLUDED.high_count,
      medium_count = EXCLUDED.medium_count,
      low_count = EXCLUDED.low_count,
      media_count = EXCLUDED.media_count,
      high_risk_count = EXCLUDED.high_risk_count,
      first_seen_at = LEAST(risk_zones.first_seen_at, EXCLUDED.first_seen_at),
      last_seen_at = GREATEST(risk_zones.last_seen_at, EXCLUDED.last_seen_at),
      active_until = EXCLUDED.active_until,
      calculated_at = EXCLUDED.calculated_at,
      contributing_report_ids = EXCLUDED.contributing_report_ids,
      -- Preserve admin decisions.
      status = CASE
        WHEN risk_zones.status IN ('verified', 'suppressed') THEN risk_zones.status
        WHEN risk_zones.status = 'locked' AND COALESCE(risk_zones.locked_until, NOW()) > NOW() THEN 'locked'
        ELSE 'candidate'
      END;

    -- ROW_COUNT = number of rows inserted/updated by the last statement.
    -- Accumulate into zone_rows.
    DECLARE
      _rc INTEGER;
    BEGIN
      GET DIAGNOSTICS _rc = ROW_COUNT;
      zone_rows := zone_rows + _rc;
    END;
  END LOOP;

  RETURN zone_rows;
END;
$$;

GRANT EXECUTE ON FUNCTION refresh_system_risk_zones TO service_role;

COMMENT ON FUNCTION refresh_system_risk_zones IS 'Recompute candidate zones from recent reports using DBSCAN, score+classify them, and upsert into risk_zones. Intended for scheduling every 5-10 minutes.';


-- END MIGRATION: 021_fix_refresh_system_risk_zones_uuid_default_dependency.sql

-- ============================================================================
-- BEGIN MIGRATION: 022_gamification_system.sql
-- ============================================================================

-- Civil Alert System - Gamification System
-- Points, badges, and leaderboard to drive sustained citizen engagement

-- ============================================
-- 1. BADGE DEFINITIONS TABLE (seeded, read-only)
-- ============================================

CREATE TABLE IF NOT EXISTS badge_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    points_threshold INT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view badge definitions" ON badge_definitions;
CREATE POLICY "Anyone can view badge definitions" ON badge_definitions
    FOR SELECT USING (true);

-- ============================================
-- 2. CITIZEN POINTS LEDGER
-- ============================================

CREATE TABLE IF NOT EXISTS citizen_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    report_id UUID REFERENCES hazard_reports(id) ON DELETE SET NULL,
    points INT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citizen_points_user ON citizen_points(user_id);
CREATE INDEX IF NOT EXISTS idx_citizen_points_created ON citizen_points(created_at DESC);

ALTER TABLE citizen_points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own points" ON citizen_points;
CREATE POLICY "Users can view own points" ON citizen_points
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 3. CITIZEN EARNED BADGES
-- ============================================

CREATE TABLE IF NOT EXISTS citizen_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    badge_id TEXT NOT NULL REFERENCES badge_definitions(id),
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_citizen_badges_user ON citizen_badges(user_id);

ALTER TABLE citizen_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own badges" ON citizen_badges;
CREATE POLICY "Users can view own badges" ON citizen_badges
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 4. BADGE-CHECKING FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION fn_check_and_award_badges(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    _total_reports INT;
    _verified_count INT;
    _media_count INT;
    _total_points INT;
    _today_count INT;
BEGIN
    SELECT COUNT(*) INTO _total_reports FROM hazard_reports WHERE user_id = p_user_id;
    SELECT COUNT(*) INTO _verified_count FROM hazard_reports WHERE user_id = p_user_id AND status = 'verified';
    SELECT COUNT(*) INTO _media_count FROM hazard_reports WHERE user_id = p_user_id
        AND media_urls IS NOT NULL AND array_length(media_urls, 1) > 0;
    SELECT COALESCE(SUM(points), 0) INTO _total_points FROM citizen_points WHERE user_id = p_user_id;
    SELECT COUNT(*) INTO _today_count FROM hazard_reports WHERE user_id = p_user_id
        AND created_at >= (NOW() - INTERVAL '24 hours');

    -- First Wave: 1 report
    IF _total_reports >= 1 THEN
        INSERT INTO citizen_badges (user_id, badge_id) VALUES (p_user_id, 'first_wave') ON CONFLICT DO NOTHING;
    END IF;

    -- Active Sensor: 10 reports
    IF _total_reports >= 10 THEN
        INSERT INTO citizen_badges (user_id, badge_id) VALUES (p_user_id, 'active_sensor') ON CONFLICT DO NOTHING;
    END IF;

    -- Verified Guardian: 5 verified
    IF _verified_count >= 5 THEN
        INSERT INTO citizen_badges (user_id, badge_id) VALUES (p_user_id, 'verified_guardian') ON CONFLICT DO NOTHING;
    END IF;

    -- Evidence Collector: 10 with media
    IF _media_count >= 10 THEN
        INSERT INTO citizen_badges (user_id, badge_id) VALUES (p_user_id, 'evidence_collector') ON CONFLICT DO NOTHING;
    END IF;

    -- Rapid Responder: 3 reports in one day
    IF _today_count >= 3 THEN
        INSERT INTO citizen_badges (user_id, badge_id) VALUES (p_user_id, 'rapid_responder') ON CONFLICT DO NOTHING;
    END IF;

    -- Community Champion: 500 points
    IF _total_points >= 500 THEN
        INSERT INTO citizen_badges (user_id, badge_id) VALUES (p_user_id, 'community_champion') ON CONFLICT DO NOTHING;
    END IF;

    -- Elite Reporter: 1000 points
    IF _total_points >= 1000 THEN
        INSERT INTO citizen_badges (user_id, badge_id) VALUES (p_user_id, 'elite_reporter') ON CONFLICT DO NOTHING;
    END IF;

    -- Precision Scout: 80%+ verification rate (min 10)
    IF _total_reports >= 10 AND (_verified_count::FLOAT / _total_reports) >= 0.8 THEN
        INSERT INTO citizen_badges (user_id, badge_id) VALUES (p_user_id, 'precision_scout') ON CONFLICT DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. TRIGGER: AWARD POINTS ON REPORT INSERT
-- ============================================

CREATE OR REPLACE FUNCTION fn_gamification_on_insert()
RETURNS TRIGGER AS $$
DECLARE
    _points INT := 10;
    _has_media BOOLEAN;
BEGIN
    _has_media := (NEW.media_urls IS NOT NULL AND array_length(NEW.media_urls, 1) > 0);
    IF _has_media THEN _points := _points + 5; END IF;

    INSERT INTO citizen_points (user_id, report_id, points, reason)
    VALUES (NEW.user_id, NEW.id, _points, 'report_submitted');

    PERFORM fn_check_and_award_badges(NEW.user_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_gamification_insert ON hazard_reports;
CREATE TRIGGER trg_gamification_insert
    AFTER INSERT ON hazard_reports
    FOR EACH ROW
    EXECUTE FUNCTION fn_gamification_on_insert();

-- ============================================
-- 6. TRIGGER: AWARD POINTS ON STATUS CHANGE
-- ============================================

CREATE OR REPLACE FUNCTION fn_gamification_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
    _points INT := 0;
    _reason TEXT;
BEGIN
    IF OLD.status = NEW.status THEN RETURN NEW; END IF;

    IF NEW.status = 'verified' AND OLD.status = 'pending' THEN
        _points := 25;
        _reason := 'report_verified';
        IF NEW.is_high_risk THEN
            _points := _points + 15;
            _reason := 'high_risk_verified';
        END IF;
    ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
        _points := -5;
        _reason := 'report_rejected';
    END IF;

    IF _points != 0 THEN
        INSERT INTO citizen_points (user_id, report_id, points, reason)
        VALUES (NEW.user_id, NEW.id, _points, _reason);
    END IF;

    PERFORM fn_check_and_award_badges(NEW.user_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_gamification_status ON hazard_reports;
CREATE TRIGGER trg_gamification_status
    AFTER UPDATE ON hazard_reports
    FOR EACH ROW
    EXECUTE FUNCTION fn_gamification_on_status_change();

-- ============================================
-- 7. RPC: GET CITIZEN STATS
-- ============================================

CREATE OR REPLACE FUNCTION get_citizen_stats(p_user_id UUID)
RETURNS JSON AS $$
    SELECT json_build_object(
        'total_points', COALESCE((SELECT SUM(points) FROM citizen_points WHERE user_id = p_user_id), 0),
        'total_reports', (SELECT COUNT(*) FROM hazard_reports WHERE user_id = p_user_id),
        'verified_count', (SELECT COUNT(*) FROM hazard_reports WHERE user_id = p_user_id AND status = 'verified'),
        'rejected_count', (SELECT COUNT(*) FROM hazard_reports WHERE user_id = p_user_id AND status = 'rejected'),
        'rank', COALESCE((
            SELECT rank FROM (
                SELECT user_id, RANK() OVER (ORDER BY SUM(points) DESC) as rank
                FROM citizen_points GROUP BY user_id
            ) r WHERE r.user_id = p_user_id
        ), 0),
        'badges', COALESCE((
            SELECT json_agg(json_build_object(
                'badge_id', cb.badge_id,
                'earned_at', cb.earned_at,
                'name', bd.name,
                'description', bd.description,
                'icon', bd.icon,
                'category', bd.category
            ) ORDER BY bd.sort_order)
            FROM citizen_badges cb JOIN badge_definitions bd ON cb.badge_id = bd.id
            WHERE cb.user_id = p_user_id
        ), '[]'::json),
        'recent_points', COALESCE((
            SELECT json_agg(json_build_object(
                'points', points,
                'reason', reason,
                'created_at', created_at
            ))
            FROM (SELECT points, reason, created_at FROM citizen_points
                  WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 10) sub
        ), '[]'::json)
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- 8. RPC: GET LEADERBOARD
-- ============================================

CREATE OR REPLACE FUNCTION get_leaderboard(p_limit INT DEFAULT 20)
RETURNS JSON AS $$
    SELECT COALESCE(json_agg(row_data), '[]'::json) FROM (
        SELECT
            cp.user_id,
            COALESCE(hr.user_name, 'Anonymous') as user_name,
            SUM(cp.points) as total_points,
            COUNT(DISTINCT hr2.id) as report_count,
            RANK() OVER (ORDER BY SUM(cp.points) DESC) as rank
        FROM citizen_points cp
        LEFT JOIN LATERAL (
            SELECT user_name FROM hazard_reports WHERE user_id = cp.user_id LIMIT 1
        ) hr ON true
        LEFT JOIN hazard_reports hr2 ON hr2.user_id = cp.user_id
        GROUP BY cp.user_id, hr.user_name
        ORDER BY total_points DESC
        LIMIT p_limit
    ) row_data;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- 9. RPC: GET ALL BADGE DEFINITIONS
-- ============================================

CREATE OR REPLACE FUNCTION get_all_badges()
RETURNS JSON AS $$
    SELECT COALESCE(json_agg(json_build_object(
        'id', id,
        'name', name,
        'description', description,
        'icon', icon,
        'category', category,
        'points_threshold', points_threshold,
        'sort_order', sort_order
    ) ORDER BY sort_order), '[]'::json)
    FROM badge_definitions;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- 10. SEED BADGE DEFINITIONS
-- ============================================

INSERT INTO badge_definitions (id, name, description, icon, category, points_threshold, sort_order) VALUES
    ('first_wave', 'First Wave', 'Submit your first hazard report', 'water_drop', 'milestone', NULL, 1),
    ('active_sensor', 'Active Sensor', 'Submit 10 hazard reports', 'sensors', 'milestone', NULL, 2),
    ('verified_guardian', 'Verified Guardian', 'Get 5 reports verified by analysts', 'verified_user', 'quality', NULL, 3),
    ('evidence_collector', 'Evidence Collector', 'Submit 10 reports with photo/video evidence', 'camera_alt', 'quality', NULL, 4),
    ('rapid_responder', 'Rapid Responder', 'Submit 3 reports in a single day', 'bolt', 'consistency', NULL, 5),
    ('community_champion', 'Community Champion', 'Earn 500 total points', 'emoji_events', 'milestone', 500, 6),
    ('elite_reporter', 'Elite Reporter', 'Earn 1000 total points', 'star', 'milestone', 1000, 7),
    ('precision_scout', 'Precision Scout', '80%+ verification rate (min 10 reports)', 'gps_fixed', 'quality', NULL, 8),
    ('streak_master', 'Streak Master', 'Report on 7 consecutive days', 'local_fire_department', 'consistency', NULL, 9),
    ('area_expert', 'Area Expert', 'Submit from 5+ distinct locations (>1km apart)', 'explore', 'consistency', NULL, 10)
ON CONFLICT (id) DO NOTHING;


-- END MIGRATION: 022_gamification_system.sql


 
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -   B E G I N   M I G R A T I O N :   0 1 7 _ a d v i s o r y _ r a d i u s . s q l  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
  
-- Community Champion: 500 points
    IF _total_points >= 500 THEN
        INSERT INTO citizen_badges (user_id, badge_id) VALUES (p_user_id, 'community_champion') ON CONFLICT DO NOTHING;
    END IF;

    -- Elite Reporter: 1000 points
    IF _total_points >= 1000 THEN
        INSERT INTO citizen_badges (user_id, badge_id) VALUES (p_user_id, 'elite_reporter') ON CONFLICT DO NOTHING;
    END IF;

    -- Precision Scout: 80%+ verification rate (min 10)
    IF _total_reports >= 10 AND (_verified_count::FLOAT / _total_reports) >= 0.8 THEN
        INSERT INTO citizen_badges (user_id, badge_id) VALUES (p_user_id, 'precision_scout') ON CONFLICT DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. TRIGGER: AWARD POINTS ON REPORT INSERT
-- ============================================

CREATE OR REPLACE FUNCTION fn_gamification_on_insert()
RETURNS TRIGGER AS $$
DECLARE
    _points INT := 10;
    _has_media BOOLEAN;
BEGIN
    _has_media := (NEW.media_urls IS NOT NULL AND array_length(NEW.media_urls, 1) > 0);
    IF _has_media THEN _points := _points + 5; END IF;

    INSERT INTO citizen_points (user_id, report_id, points, reason)
    VALUES (NEW.user_id, NEW.id, _points, 'report_submitted');

    PERFORM fn_check_and_award_badges(NEW.user_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_gamification_insert ON hazard_reports;
CREATE TRIGGER trg_gamification_insert
    AFTER INSERT ON hazard_reports
    FOR EACH ROW
    EXECUTE FUNCTION fn_gamification_on_insert();

-- ============================================
-- 6. TRIGGER: AWARD POINTS ON STATUS CHANGE
-- ============================================

CREATE OR REPLACE FUNCTION fn_gamification_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
    _points INT := 0;
    _reason TEXT;
BEGIN
    IF OLD.status = NEW.status THEN RETURN NEW; END IF;

    IF NEW.status = 'verified' AND OLD.status = 'pending' THEN
        _points := 25;
        _reason := 'report_verified';
        IF NEW.is_high_risk THEN
            _points := _points + 15;
            _reason := 'high_risk_verified';
        END IF;
    ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
        _points := -5;
        _reason := 'report_rejected';
    END IF;

    IF _points != 0 THEN
        INSERT INTO citizen_points (user_id, report_id, points, reason)
        VALUES (NEW.user_id, NEW.id, _points, _reason);
    END IF;

    PERFORM fn_check_and_award_badges(NEW.user_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_gamification_status ON hazard_reports;
CREATE TRIGGER trg_gamification_status
    AFTER UPDATE ON hazard_reports
    FOR EACH ROW
    EXECUTE FUNCTION fn_gamification_on_status_change();

-- ============================================
-- 7. RPC: GET CITIZEN STATS
-- ============================================

CREATE OR REPLACE FUNCTION get_citizen_stats(p_user_id UUID)
RETURNS JSON AS $$
    SELECT json_build_object(
        'total_points', COALESCE((SELECT SUM(points) FROM citizen_points WHERE user_id = p_user_id), 0),
        'total_reports', (SELECT COUNT(*) FROM hazard_reports WHERE user_id = p_user_id),
        'verified_count', (SELECT COUNT(*) FROM hazard_reports WHERE user_id = p_user_id AND status = 'verified'),
        'rejected_count', (SELECT COUNT(*) FROM hazard_reports WHERE user_id = p_user_id AND status = 'rejected'),
        'rank', COALESCE((
            SELECT rank FROM (
                SELECT user_id, RANK() OVER (ORDER BY SUM(points) DESC) as rank
                FROM citizen_points GROUP BY user_id
            ) r WHERE r.user_id = p_user_id
        ), 0),
        'badges', COALESCE((
            SELECT json_agg(json_build_object(
                'badge_id', cb.badge_id,
                'earned_at', cb.earned_at,
                'name', bd.name,
                'description', bd.description,
                'icon', bd.icon,
                'category', bd.category
            ) ORDER BY bd.sort_order)
            FROM citizen_badges cb JOIN badge_definitions bd ON cb.badge_id = bd.id
            WHERE cb.user_id = p_user_id
        ), '[]'::json),
        'recent_points', COALESCE((
            SELECT json_agg(json_build_object(
                'points', points,
                'reason', reason,
                'created_at', created_at
            ))
            FROM (SELECT points, reason, created_at FROM citizen_points
                  WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 10) sub
        ), '[]'::json)
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- 8. RPC: GET LEADERBOARD
-- ============================================

CREATE OR REPLACE FUNCTION get_leaderboard(p_limit INT DEFAULT 20)
RETURNS JSON AS $$
    SELECT COALESCE(json_agg(row_data), '[]'::json) FROM (
        SELECT
            cp.user_id,
            COALESCE(hr.user_name, 'Anonymous') as user_name,
            SUM(cp.points) as total_points,
            COUNT(DISTINCT hr2.id) as report_count,
            RANK() OVER (ORDER BY SUM(cp.points) DESC) as rank
        FROM citizen_points cp
        LEFT JOIN LATERAL (
            SELECT user_name FROM hazard_reports WHERE user_id = cp.user_id LIMIT 1
        ) hr ON true
        LEFT JOIN hazard_reports hr2 ON hr2.user_id = cp.user_id
        GROUP BY cp.user_id, hr.user_name
        ORDER BY total_points DESC
        LIMIT p_limit
    ) row_data;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- 9. RPC: GET ALL BADGE DEFINITIONS
-- ============================================

CREATE OR REPLACE FUNCTION get_all_badges()
RETURNS JSON AS $$
    SELECT COALESCE(json_agg(json_build_object(
        'id', id,
        'name', name,
        'description', description,
        'icon', icon,
        'category', category,
        'points_threshold', points_threshold,
        'sort_order', sort_order
    ) ORDER BY sort_order), '[]'::json)
    FROM badge_definitions;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- 10. SEED BADGE DEFINITIONS
-- ============================================

INSERT INTO badge_definitions (id, name, description, icon, category, points_threshold, sort_order) VALUES
    ('first_wave', 'First Wave', 'Submit your first hazard report', 'water_drop', 'milestone', NULL, 1),
    ('active_sensor', 'Active Sensor', 'Submit 10 hazard reports', 'sensors', 'milestone', NULL, 2),
    ('verified_guardian', 'Verified Guardian', 'Get 5 reports verified by analysts', 'verified_user', 'quality', NULL, 3),
    ('evidence_collector', 'Evidence Collector', 'Submit 10 reports with photo/video evidence', 'camera_alt', 'quality', NULL, 4),
    ('rapid_responder', 'Rapid Responder', 'Submit 3 reports in a single day', 'bolt', 'consistency', NULL, 5),
    ('community_champion', 'Community Champion', 'Earn 500 total points', 'emoji_events', 'milestone', 500, 6),
    ('elite_reporter', 'Elite Reporter', 'Earn 1000 total points', 'star', 'milestone', 1000, 7),
    ('precision_scout', 'Precision Scout', '80%+ verification rate (min 10 reports)', 'gps_fixed', 'quality', NULL, 8),
    ('streak_master', 'Streak Master', 'Report on 7 consecutive days', 'local_fire_department', 'consistency', NULL, 9),
    ('area_expert', 'Area Expert', 'Submit from 5+ distinct locations (>1km apart)', 'explore', 'consistency', NULL, 10)
ON CONFLICT (id) DO NOTHING;


-- END MIGRATION: 022_gamification_system.sql


-- ============================================================================
-- BEGIN MIGRATION: 017_advisory_radius.sql
-- ============================================================================

ALTER TABLE public.official_advisories
ADD COLUMN IF NOT EXISTS radius_km NUMERIC;

COMMENT ON COLUMN public.official_advisories.radius_km IS 'Radius in kilometers for GPS-targeted advisories. Null means broadcast to everyone.';

-- END MIGRATION: 017_advisory_radius.sql

-- ============================================================================
-- BEGIN MIGRATION: 023_admin_audit_trail.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.report_status_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES public.hazard_reports(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id),
  admin_email TEXT NOT NULL,
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_report_id ON public.report_status_audit(report_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON public.report_status_audit(changed_at DESC);

ALTER TABLE public.report_status_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.report_status_audit;
CREATE POLICY "Admins can view audit logs" 
  ON public.report_status_audit 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.app_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Database Trigger to log status changes automatically
CREATE OR REPLACE FUNCTION public.log_report_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_email TEXT;
BEGIN
  -- Only log if the status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Extract email from JWT if available, else fallback
    v_admin_email := current_setting('request.jwt.claims', true)::json->>'email';
    IF v_admin_email IS NULL THEN
      v_admin_email := 'system/unknown';
    END IF;
    -- Log the change even if auth.uid() is missing (fallback to 'system')
    INSERT INTO public.report_status_audit (
      report_id,
      admin_id,
      admin_email,
      old_status,
      new_status
    ) VALUES (
      NEW.id,
      auth.uid(),
      v_admin_email,
      COALESCE(OLD.status, 'pending'),
      NEW.status
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_report_status_change ON public.hazard_reports;
CREATE TRIGGER trigger_log_report_status_change
  AFTER UPDATE OF status ON public.hazard_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.log_report_status_change();

-- END MIGRATION: 023_admin_audit_trail.sql
