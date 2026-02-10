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
