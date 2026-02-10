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
