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
