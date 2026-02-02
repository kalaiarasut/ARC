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
