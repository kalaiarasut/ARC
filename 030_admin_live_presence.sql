-- ============================================================================
-- 030_admin_live_presence.sql
-- Admin live presence layers and emergency exact location sessions
-- ============================================================================

BEGIN;

ALTER TABLE public.push_tokens
  ADD COLUMN IF NOT EXISTS zone_monitoring_opt_in BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.admin_feature_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_code TEXT NOT NULL,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, permission_code)
);

CREATE TABLE IF NOT EXISTS public.device_location_heartbeats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy_meters DOUBLE PRECISION,
  source TEXT NOT NULL CHECK (source IN ('foreground', 'background')),
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  zone_monitoring_opt_in_snapshot BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.live_location_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  incident_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'expired')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.live_location_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  session_id UUID REFERENCES public.live_location_sessions(id) ON DELETE SET NULL,
  incident_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_feature_permissions_lookup
  ON public.admin_feature_permissions (user_id, permission_code);
CREATE INDEX IF NOT EXISTS idx_device_location_heartbeats_recent
  ON public.device_location_heartbeats (observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_location_heartbeats_device_time
  ON public.device_location_heartbeats (device_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_location_heartbeats_user_time
  ON public.device_location_heartbeats (user_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_location_heartbeats_opt_in_recent
  ON public.device_location_heartbeats (zone_monitoring_opt_in_snapshot, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_location_sessions_status_expiry
  ON public.live_location_sessions (status, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_location_audit_logs_time
  ON public.live_location_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_location_audit_logs_actor
  ON public.live_location_audit_logs (actor_user_id, created_at DESC);

ALTER TABLE public.admin_feature_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_location_heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_location_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_location_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage feature permissions" ON public.admin_feature_permissions;
CREATE POLICY "Admins manage feature permissions"
  ON public.admin_feature_permissions FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "No direct heartbeat access" ON public.device_location_heartbeats;
CREATE POLICY "No direct heartbeat access"
  ON public.device_location_heartbeats FOR ALL
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Admins read live location sessions" ON public.live_location_sessions;
CREATE POLICY "Admins read live location sessions"
  ON public.live_location_sessions FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "No direct live location session writes" ON public.live_location_sessions;
CREATE POLICY "No direct live location session writes"
  ON public.live_location_sessions FOR INSERT TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "Admins read live location audit logs" ON public.live_location_audit_logs;
CREATE POLICY "Admins read live location audit logs"
  ON public.live_location_audit_logs FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "No direct live location audit writes" ON public.live_location_audit_logs;
CREATE POLICY "No direct live location audit writes"
  ON public.live_location_audit_logs FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.has_admin_permission(p_permission_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    public.is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.admin_feature_permissions AS afp
      WHERE afp.user_id = auth.uid()
        AND afp.permission_code = p_permission_code
    );
$$;

CREATE OR REPLACE FUNCTION public.expire_live_location_sessions()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.live_location_sessions
  SET
    status = 'expired',
    ended_at = COALESCE(ended_at, NOW())
  WHERE status = 'active'
    AND expires_at <= NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_live_location_data()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.expire_live_location_sessions();

  DELETE FROM public.device_location_heartbeats
  WHERE observed_at < NOW() - INTERVAL '24 hours';

  DELETE FROM public.live_location_sessions
  WHERE status IN ('ended', 'expired')
    AND COALESCE(ended_at, expires_at) < NOW() - INTERVAL '30 days';

  DELETE FROM public.live_location_audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_live_presence_anonymized(
  p_min_lat DOUBLE PRECISION DEFAULT NULL,
  p_max_lat DOUBLE PRECISION DEFAULT NULL,
  p_min_lon DOUBLE PRECISION DEFAULT NULL,
  p_max_lon DOUBLE PRECISION DEFAULT NULL,
  p_zoom INTEGER DEFAULT 10,
  p_minutes INTEGER DEFAULT 15
)
RETURNS TABLE (
  cell_key TEXT,
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  people_count INTEGER,
  latest_observed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_minutes INTEGER := GREATEST(1, LEAST(COALESCE(p_minutes, 15), 60));
  v_zoom INTEGER := GREATEST(1, LEAST(COALESCE(p_zoom, 10), 20));
  v_grid_size DOUBLE PRECISION;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin_only' USING ERRCODE = '42501';
  END IF;

  v_grid_size := CASE
    WHEN v_zoom >= 14 THEN 0.0025
    WHEN v_zoom >= 12 THEN 0.005
    WHEN v_zoom >= 10 THEN 0.01
    WHEN v_zoom >= 8 THEN 0.02
    ELSE 0.05
  END;

  RETURN QUERY
  WITH latest_points AS (
    SELECT DISTINCT ON (dlh.device_id)
      dlh.device_id,
      dlh.latitude,
      dlh.longitude,
      dlh.observed_at
    FROM public.device_location_heartbeats AS dlh
    WHERE dlh.zone_monitoring_opt_in_snapshot = true
      AND dlh.observed_at >= NOW() - make_interval(mins => v_minutes)
      AND (p_min_lat IS NULL OR dlh.latitude >= p_min_lat)
      AND (p_max_lat IS NULL OR dlh.latitude <= p_max_lat)
      AND (p_min_lon IS NULL OR dlh.longitude >= p_min_lon)
      AND (p_max_lon IS NULL OR dlh.longitude <= p_max_lon)
    ORDER BY dlh.device_id, dlh.observed_at DESC
  ),
  bucketed AS (
    SELECT
      floor(latitude / v_grid_size) * v_grid_size AS lat_bucket,
      floor(longitude / v_grid_size) * v_grid_size AS lon_bucket,
      AVG(latitude)::DOUBLE PRECISION AS avg_lat,
      AVG(longitude)::DOUBLE PRECISION AS avg_lng,
      COUNT(*)::INTEGER AS total_people,
      MAX(observed_at) AS max_observed_at
    FROM latest_points
    GROUP BY 1, 2
  )
  SELECT
    md5(lat_bucket::TEXT || ':' || lon_bucket::TEXT) AS cell_key,
    avg_lat AS center_lat,
    avg_lng AS center_lng,
    total_people AS people_count,
    max_observed_at AS latest_observed_at
  FROM bucketed
  ORDER BY total_people DESC, max_observed_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_active_live_location_session()
RETURNS TABLE (
  id UUID,
  started_by UUID,
  incident_id TEXT,
  reason TEXT,
  status TEXT,
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin_only' USING ERRCODE = '42501';
  END IF;

  PERFORM public.expire_live_location_sessions();

  RETURN QUERY
  SELECT
    lls.id,
    lls.started_by,
    lls.incident_id,
    lls.reason,
    lls.status,
    lls.started_at,
    lls.expires_at,
    lls.ended_at
  FROM public.live_location_sessions AS lls
  WHERE lls.status = 'active'
    AND lls.expires_at > NOW()
  ORDER BY lls.started_at DESC
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_start_live_location_session(
  p_incident_id TEXT,
  p_reason TEXT
)
RETURNS TABLE (
  id UUID,
  started_by UUID,
  incident_id TEXT,
  reason TEXT,
  status TEXT,
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  IF NOT public.has_admin_permission('live_location_exact_view') THEN
    RAISE EXCEPTION 'exact_location_permission_required' USING ERRCODE = '42501';
  END IF;

  IF COALESCE(btrim(p_incident_id), '') = '' THEN
    RAISE EXCEPTION 'incident_id_required' USING ERRCODE = '22023';
  END IF;

  IF COALESCE(btrim(p_reason), '') = '' THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE = '22023';
  END IF;

  PERFORM public.expire_live_location_sessions();

  INSERT INTO public.live_location_sessions (
    started_by,
    incident_id,
    reason,
    status,
    started_at,
    expires_at
  )
  VALUES (
    v_user_id,
    btrim(p_incident_id),
    btrim(p_reason),
    'active',
    NOW(),
    NOW() + INTERVAL '30 minutes'
  )
  RETURNING live_location_sessions.id INTO v_session_id;

  INSERT INTO public.live_location_audit_logs (
    actor_user_id,
    action,
    session_id,
    incident_id,
    details
  )
  VALUES (
    v_user_id,
    'session_started',
    v_session_id,
    btrim(p_incident_id),
    jsonb_build_object('reason', btrim(p_reason))
  );

  RETURN QUERY
  SELECT
    lls.id,
    lls.started_by,
    lls.incident_id,
    lls.reason,
    lls.status,
    lls.started_at,
    lls.expires_at,
    lls.ended_at
  FROM public.live_location_sessions AS lls
  WHERE lls.id = v_session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_stop_live_location_session(
  p_session_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_incident_id TEXT;
BEGIN
  IF NOT public.has_admin_permission('live_location_exact_view') THEN
    RAISE EXCEPTION 'exact_location_permission_required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.live_location_sessions
  SET
    status = 'ended',
    ended_at = NOW()
  WHERE id = p_session_id
    AND status = 'active'
  RETURNING incident_id INTO v_incident_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.live_location_audit_logs (
    actor_user_id,
    action,
    session_id,
    incident_id,
    details
  )
  VALUES (
    auth.uid(),
    'session_stopped',
    p_session_id,
    v_incident_id,
    '{}'::JSONB
  );

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_live_exact_pins(
  p_session_id UUID,
  p_min_lat DOUBLE PRECISION DEFAULT NULL,
  p_max_lat DOUBLE PRECISION DEFAULT NULL,
  p_min_lon DOUBLE PRECISION DEFAULT NULL,
  p_max_lon DOUBLE PRECISION DEFAULT NULL,
  p_minutes INTEGER DEFAULT 15
)
RETURNS TABLE (
  device_id TEXT,
  user_id UUID,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  observed_at TIMESTAMPTZ,
  source TEXT,
  accuracy_meters DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_minutes INTEGER := GREATEST(1, LEAST(COALESCE(p_minutes, 15), 15));
  v_incident_id TEXT;
  v_status TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  IF NOT public.has_admin_permission('live_location_exact_view') THEN
    RAISE EXCEPTION 'exact_location_permission_required' USING ERRCODE = '42501';
  END IF;

  PERFORM public.expire_live_location_sessions();

  SELECT incident_id, status, expires_at
  INTO v_incident_id, v_status, v_expires_at
  FROM public.live_location_sessions
  WHERE id = p_session_id;

  IF NOT FOUND OR v_status <> 'active' OR v_expires_at <= NOW() THEN
    RAISE EXCEPTION 'live_location_session_inactive' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.live_location_audit_logs (
    actor_user_id,
    action,
    session_id,
    incident_id,
    details
  )
  VALUES (
    v_user_id,
    'exact_pins_read',
    p_session_id,
    v_incident_id,
    jsonb_build_object(
      'minutes', v_minutes,
      'bounds', jsonb_build_object(
        'min_lat', p_min_lat,
        'max_lat', p_max_lat,
        'min_lon', p_min_lon,
        'max_lon', p_max_lon
      )
    )
  );

  RETURN QUERY
  WITH latest_points AS (
    SELECT DISTINCT ON (dlh.device_id)
      dlh.device_id,
      dlh.user_id,
      dlh.latitude,
      dlh.longitude,
      dlh.observed_at,
      dlh.source,
      dlh.accuracy_meters
    FROM public.device_location_heartbeats AS dlh
    WHERE dlh.zone_monitoring_opt_in_snapshot = true
      AND dlh.observed_at >= NOW() - make_interval(mins => v_minutes)
      AND (p_min_lat IS NULL OR dlh.latitude >= p_min_lat)
      AND (p_max_lat IS NULL OR dlh.latitude <= p_max_lat)
      AND (p_min_lon IS NULL OR dlh.longitude >= p_min_lon)
      AND (p_max_lon IS NULL OR dlh.longitude <= p_max_lon)
    ORDER BY dlh.device_id, dlh.observed_at DESC
  )
  SELECT
    latest_points.device_id,
    latest_points.user_id,
    latest_points.latitude,
    latest_points.longitude,
    latest_points.observed_at,
    latest_points.source,
    latest_points.accuracy_meters
  FROM latest_points
  ORDER BY latest_points.observed_at DESC;
END;
$$;

INSERT INTO public.admin_feature_permissions (user_id, permission_code, granted_by)
SELECT ar.user_id, 'live_location_exact_view', NULL
FROM public.app_roles AS ar
WHERE ar.role = 'admin'
ON CONFLICT (user_id, permission_code) DO NOTHING;

GRANT EXECUTE ON FUNCTION public.has_admin_permission(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_live_location_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_live_location_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_live_presence_anonymized(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_active_live_location_session() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_start_live_location_session(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_stop_live_location_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_live_exact_pins(UUID, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, INTEGER) TO authenticated;

COMMIT;

