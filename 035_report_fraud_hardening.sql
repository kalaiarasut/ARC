-- ============================================================================
-- BEGIN MIGRATION: 035_report_fraud_hardening.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.report_submission_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.hazard_reports(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  device_id TEXT,
  client_id UUID,
  event_type TEXT NOT NULL CHECK (event_type IN ('accepted', 'blocked', 'duplicate_linked')),
  result_code TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_submission_events_report_created
  ON public.report_submission_events (report_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_submission_events_user_created
  ON public.report_submission_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_submission_events_device_created
  ON public.report_submission_events (device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_submission_events_result_created
  ON public.report_submission_events (result_code, created_at DESC);

ALTER TABLE public.report_submission_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read report submission events" ON public.report_submission_events;
CREATE POLICY "Admins read report submission events"
  ON public.report_submission_events FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.report_integrity_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.hazard_reports(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  source TEXT NOT NULL DEFAULT 'system' CHECK (source IN ('system', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'resolved')),
  details_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_integrity_signals_report_status
  ON public.report_integrity_signals (report_id, status, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_integrity_signals_signal_status
  ON public.report_integrity_signals (signal_type, status, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_integrity_signals_severity_status
  ON public.report_integrity_signals (severity, status, detected_at DESC);

ALTER TABLE public.report_integrity_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read report integrity signals" ON public.report_integrity_signals;
CREATE POLICY "Admins read report integrity signals"
  ON public.report_integrity_signals FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins update report integrity signals" ON public.report_integrity_signals;
CREATE POLICY "Admins update report integrity signals"
  ON public.report_integrity_signals FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.report_duplicate_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_reason TEXT NOT NULL,
  last_report_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_duplicate_clusters_last_report
  ON public.report_duplicate_clusters (last_report_at DESC NULLS LAST, created_at DESC);

ALTER TABLE public.report_duplicate_clusters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read report duplicate clusters" ON public.report_duplicate_clusters;
CREATE POLICY "Admins read report duplicate clusters"
  ON public.report_duplicate_clusters FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.report_duplicate_cluster_members (
  cluster_id UUID NOT NULL REFERENCES public.report_duplicate_clusters(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES public.hazard_reports(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cluster_id, report_id),
  UNIQUE (report_id)
);

CREATE INDEX IF NOT EXISTS idx_report_duplicate_cluster_members_cluster
  ON public.report_duplicate_cluster_members (cluster_id, joined_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_duplicate_cluster_members_report
  ON public.report_duplicate_cluster_members (report_id, joined_at DESC);

ALTER TABLE public.report_duplicate_cluster_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read report duplicate cluster members" ON public.report_duplicate_cluster_members;
CREATE POLICY "Admins read report duplicate cluster members"
  ON public.report_duplicate_cluster_members FOR SELECT TO authenticated
  USING (public.is_admin());

DROP TRIGGER IF EXISTS trg_report_integrity_signals_updated_at ON public.report_integrity_signals;
CREATE TRIGGER trg_report_integrity_signals_updated_at
  BEFORE UPDATE ON public.report_integrity_signals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_report_duplicate_clusters_updated_at ON public.report_duplicate_clusters;
CREATE TRIGGER trg_report_duplicate_clusters_updated_at
  BEFORE UPDATE ON public.report_duplicate_clusters
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.insert_admin_audit_event(
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_action TEXT,
  p_reason TEXT DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_event_kind TEXT DEFAULT 'audit',
  p_actor_user_id UUID DEFAULT auth.uid(),
  p_actor_email TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.admin_audit_log (
    event_kind,
    entity_type,
    entity_id,
    action,
    actor_user_id,
    actor_email,
    reason,
    old_data,
    new_data,
    metadata,
    changed_fields
  )
  VALUES (
    COALESCE(NULLIF(p_event_kind, ''), 'audit'),
    p_entity_type,
    p_entity_id,
    p_action,
    p_actor_user_id,
    COALESCE(NULLIF(p_actor_email, ''), public.current_request_actor_email()),
    p_reason,
    p_old_data,
    p_new_data,
    COALESCE(p_metadata, '{}'::JSONB),
    public.audit_changed_fields(p_old_data, p_new_data)
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_report_submission_event(
  p_report_id UUID,
  p_user_id UUID,
  p_device_id TEXT,
  p_client_id UUID,
  p_event_type TEXT,
  p_result_code TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.report_submission_events (
    report_id,
    user_id,
    device_id,
    client_id,
    event_type,
    result_code,
    metadata
  )
  VALUES (
    p_report_id,
    p_user_id,
    NULLIF(BTRIM(COALESCE(p_device_id, '')), ''),
    p_client_id,
    p_event_type,
    p_result_code,
    COALESCE(p_metadata, '{}'::JSONB)
  )
  RETURNING id INTO v_event_id;

  IF p_event_type <> 'accepted' THEN
    PERFORM public.insert_admin_audit_event(
      'hazard_report_submission',
      COALESCE(p_report_id::TEXT, p_client_id::TEXT, v_event_id::TEXT),
      p_event_type || ':' || p_result_code,
      NULL,
      NULL,
      NULL,
      jsonb_build_object(
        'submission_event_id', v_event_id,
        'report_id', p_report_id,
        'user_id', p_user_id,
        'device_id', NULLIF(BTRIM(COALESCE(p_device_id, '')), ''),
        'client_id', p_client_id,
        'metadata', COALESCE(p_metadata, '{}'::JSONB)
      ),
      'activity',
      p_user_id,
      NULL
    );
  END IF;

  RETURN v_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_report_description(p_description TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(regexp_replace(lower(COALESCE(p_description, '')), '\s+', ' ', 'g'), '');
$$;

CREATE OR REPLACE FUNCTION public.merge_report_duplicate_clusters(
  p_primary_cluster_id UUID,
  p_secondary_cluster_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_primary_cluster_id IS NULL THEN
    RETURN p_secondary_cluster_id;
  END IF;

  IF p_secondary_cluster_id IS NULL OR p_secondary_cluster_id = p_primary_cluster_id THEN
    RETURN p_primary_cluster_id;
  END IF;

  UPDATE public.report_duplicate_cluster_members
  SET cluster_id = p_primary_cluster_id
  WHERE cluster_id = p_secondary_cluster_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.report_duplicate_cluster_members AS existing_member
      WHERE existing_member.cluster_id = p_primary_cluster_id
        AND existing_member.report_id = public.report_duplicate_cluster_members.report_id
    );

  DELETE FROM public.report_duplicate_cluster_members
  WHERE cluster_id = p_secondary_cluster_id;

  UPDATE public.report_duplicate_clusters AS target_cluster
  SET last_report_at = GREATEST(
    COALESCE(target_cluster.last_report_at, '-infinity'::TIMESTAMPTZ),
    COALESCE(source_cluster.last_report_at, '-infinity'::TIMESTAMPTZ)
  )
  FROM public.report_duplicate_clusters AS source_cluster
  WHERE target_cluster.id = p_primary_cluster_id
    AND source_cluster.id = p_secondary_cluster_id;

  DELETE FROM public.report_duplicate_clusters
  WHERE id = p_secondary_cluster_id;

  RETURN p_primary_cluster_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_empty_report_duplicate_clusters()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.report_duplicate_clusters AS cluster
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.report_duplicate_cluster_members AS member
    WHERE member.cluster_id = cluster.id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_report_duplicate_cluster(p_report_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_report RECORD;
  v_target_cluster_id UUID;
  v_existing_cluster_id UUID;
  v_has_related BOOLEAN := FALSE;
BEGIN
  SELECT
    report.id,
    report.hazard_type,
    report.created_at,
    report.location,
    public.normalize_report_description(COALESCE(report.translated_english, report.description)) AS normalized_description
  INTO v_report
  FROM public.hazard_reports AS report
  WHERE report.id = p_report_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  DELETE FROM public.report_duplicate_cluster_members
  WHERE report_id = p_report_id;

  IF v_report.normalized_description IS NULL THEN
    PERFORM public.cleanup_empty_report_duplicate_clusters();
    RETURN NULL;
  END IF;

  FOR v_existing_cluster_id IN
    SELECT DISTINCT member.cluster_id
    FROM public.hazard_reports AS related
    JOIN public.report_duplicate_cluster_members AS member
      ON member.report_id = related.id
    WHERE related.id <> p_report_id
      AND related.hazard_type = v_report.hazard_type
      AND related.created_at BETWEEN v_report.created_at - INTERVAL '60 minutes' AND v_report.created_at + INTERVAL '60 minutes'
      AND ST_DWithin(related.location, v_report.location, 250)
      AND public.normalize_report_description(COALESCE(related.translated_english, related.description)) = v_report.normalized_description
  LOOP
    v_has_related := TRUE;
    IF v_target_cluster_id IS NULL THEN
      v_target_cluster_id := v_existing_cluster_id;
    ELSE
      v_target_cluster_id := public.merge_report_duplicate_clusters(v_target_cluster_id, v_existing_cluster_id);
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM public.hazard_reports AS related
    WHERE related.id <> p_report_id
      AND related.hazard_type = v_report.hazard_type
      AND related.created_at BETWEEN v_report.created_at - INTERVAL '60 minutes' AND v_report.created_at + INTERVAL '60 minutes'
      AND ST_DWithin(related.location, v_report.location, 250)
      AND public.normalize_report_description(COALESCE(related.translated_english, related.description)) = v_report.normalized_description
  ) THEN
    v_has_related := TRUE;
  END IF;

  IF NOT v_has_related THEN
    PERFORM public.cleanup_empty_report_duplicate_clusters();
    RETURN NULL;
  END IF;

  IF v_target_cluster_id IS NULL THEN
    INSERT INTO public.report_duplicate_clusters (
      cluster_reason,
      last_report_at
    )
    VALUES (
      'exact_text_recent_nearby',
      v_report.created_at
    )
    RETURNING id INTO v_target_cluster_id;
  END IF;

  INSERT INTO public.report_duplicate_cluster_members (cluster_id, report_id)
  SELECT v_target_cluster_id, related.id
  FROM public.hazard_reports AS related
  WHERE related.id <> p_report_id
    AND related.hazard_type = v_report.hazard_type
    AND related.created_at BETWEEN v_report.created_at - INTERVAL '60 minutes' AND v_report.created_at + INTERVAL '60 minutes'
    AND ST_DWithin(related.location, v_report.location, 250)
    AND public.normalize_report_description(COALESCE(related.translated_english, related.description)) = v_report.normalized_description
  ON CONFLICT DO NOTHING;

  INSERT INTO public.report_duplicate_cluster_members (cluster_id, report_id)
  VALUES (v_target_cluster_id, p_report_id)
  ON CONFLICT DO NOTHING;

  UPDATE public.report_duplicate_clusters
  SET last_report_at = GREATEST(COALESCE(last_report_at, v_report.created_at), v_report.created_at)
  WHERE id = v_target_cluster_id;

  PERFORM public.cleanup_empty_report_duplicate_clusters();
  RETURN v_target_cluster_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_report_integrity_for_report(p_report_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_report RECORD;
  v_user_5m_count INTEGER := 0;
  v_user_hour_count INTEGER := 0;
  v_device_5m_count INTEGER := 0;
  v_device_15m_count INTEGER := 0;
  v_device_hour_count INTEGER := 0;
  v_device_distinct_users INTEGER := 0;
  v_exact_text_count INTEGER := 0;
  v_nearby_recent_count INTEGER := 0;
  v_cluster_id UUID;
  v_cluster_size INTEGER := 0;
BEGIN
  SELECT
    report.id,
    report.user_id,
    NULLIF(BTRIM(COALESCE(report.device_id, '')), '') AS device_id,
    report.hazard_type,
    report.created_at,
    report.location,
    public.normalize_report_description(COALESCE(report.translated_english, report.description)) AS normalized_description
  INTO v_report
  FROM public.hazard_reports AS report
  WHERE report.id = p_report_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  DELETE FROM public.report_integrity_signals
  WHERE report_id = p_report_id
    AND source = 'system'
    AND status = 'active';

  SELECT COUNT(*)::INTEGER
  INTO v_user_5m_count
  FROM public.hazard_reports AS report
  WHERE report.user_id = v_report.user_id
    AND report.created_at BETWEEN v_report.created_at - INTERVAL '5 minutes' AND v_report.created_at + INTERVAL '5 minutes';

  IF v_user_5m_count >= 3 THEN
    INSERT INTO public.report_integrity_signals (report_id, signal_type, severity, score, details_json)
    VALUES (
      p_report_id,
      'rapid_submissions_user',
      'high',
      60,
      jsonb_build_object('count', v_user_5m_count, 'window', '5 minutes')
    );
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO v_user_hour_count
  FROM public.hazard_reports AS report
  WHERE report.user_id = v_report.user_id
    AND report.created_at BETWEEN v_report.created_at - INTERVAL '1 hour' AND v_report.created_at + INTERVAL '1 hour';

  IF v_user_hour_count >= 8 THEN
    INSERT INTO public.report_integrity_signals (report_id, signal_type, severity, score, details_json)
    VALUES (
      p_report_id,
      'high_hourly_volume_user',
      'medium',
      40,
      jsonb_build_object('count', v_user_hour_count, 'window', '1 hour')
    );
  END IF;

  IF v_report.device_id IS NOT NULL THEN
    SELECT COUNT(*)::INTEGER
    INTO v_device_5m_count
    FROM public.hazard_reports AS report
    WHERE report.device_id = v_report.device_id
      AND report.created_at BETWEEN v_report.created_at - INTERVAL '5 minutes' AND v_report.created_at + INTERVAL '5 minutes';

    IF v_device_5m_count >= 3 THEN
      INSERT INTO public.report_integrity_signals (report_id, signal_type, severity, score, details_json)
      VALUES (
        p_report_id,
        'rapid_submissions_device',
        'critical',
        85,
        jsonb_build_object('count', v_device_5m_count, 'window', '5 minutes')
      );
    END IF;

    SELECT COUNT(*)::INTEGER
    INTO v_device_15m_count
    FROM public.hazard_reports AS report
    WHERE report.device_id = v_report.device_id
      AND report.created_at BETWEEN v_report.created_at - INTERVAL '15 minutes' AND v_report.created_at + INTERVAL '15 minutes';

    IF v_device_15m_count >= 6 THEN
      INSERT INTO public.report_integrity_signals (report_id, signal_type, severity, score, details_json)
      VALUES (
        p_report_id,
        'device_submission_burst',
        'critical',
        90,
        jsonb_build_object('count', v_device_15m_count, 'window', '15 minutes')
      );
    END IF;

    SELECT COUNT(*)::INTEGER
    INTO v_device_hour_count
    FROM public.hazard_reports AS report
    WHERE report.device_id = v_report.device_id
      AND report.created_at BETWEEN v_report.created_at - INTERVAL '1 hour' AND v_report.created_at + INTERVAL '1 hour';

    IF v_device_hour_count >= 8 THEN
      INSERT INTO public.report_integrity_signals (report_id, signal_type, severity, score, details_json)
      VALUES (
        p_report_id,
        'high_hourly_volume_device',
        'high',
        70,
        jsonb_build_object('count', v_device_hour_count, 'window', '1 hour')
      );
    END IF;

    SELECT COUNT(DISTINCT report.user_id)::INTEGER
    INTO v_device_distinct_users
    FROM public.hazard_reports AS report
    WHERE report.device_id = v_report.device_id
      AND report.created_at > NOW() - INTERVAL '7 days';

    IF v_device_distinct_users >= 2 THEN
      INSERT INTO public.report_integrity_signals (report_id, signal_type, severity, score, details_json)
      VALUES (
        p_report_id,
        'multi_account_same_device',
        'high',
        75,
        jsonb_build_object('distinct_users', v_device_distinct_users, 'window', '7 days')
      );
    END IF;
  END IF;

  IF v_report.normalized_description IS NOT NULL THEN
    SELECT COUNT(*)::INTEGER
    INTO v_exact_text_count
    FROM public.hazard_reports AS report
    WHERE report.id <> p_report_id
      AND report.hazard_type = v_report.hazard_type
      AND report.created_at BETWEEN v_report.created_at - INTERVAL '60 minutes' AND v_report.created_at + INTERVAL '60 minutes'
      AND ST_DWithin(report.location, v_report.location, 250)
      AND public.normalize_report_description(COALESCE(report.translated_english, report.description)) = v_report.normalized_description;

    IF v_exact_text_count >= 1 THEN
      INSERT INTO public.report_integrity_signals (report_id, signal_type, severity, score, details_json)
      VALUES (
        p_report_id,
        'duplicate_exact_text',
        'high',
        65,
        jsonb_build_object('matches', v_exact_text_count, 'window', '60 minutes', 'radius_meters', 250)
      );
    END IF;
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO v_nearby_recent_count
  FROM public.hazard_reports AS report
  WHERE report.id <> p_report_id
    AND report.hazard_type = v_report.hazard_type
    AND report.created_at BETWEEN v_report.created_at - INTERVAL '10 minutes' AND v_report.created_at + INTERVAL '10 minutes'
    AND ST_DWithin(report.location, v_report.location, 75);

  IF v_nearby_recent_count >= 1 THEN
    INSERT INTO public.report_integrity_signals (report_id, signal_type, severity, score, details_json)
    VALUES (
      p_report_id,
      'duplicate_nearby_recent',
      'medium',
      45,
      jsonb_build_object('matches', v_nearby_recent_count, 'window', '10 minutes', 'radius_meters', 75)
    );
  END IF;

  SELECT member.cluster_id, COUNT(*)::INTEGER
  INTO v_cluster_id, v_cluster_size
  FROM public.report_duplicate_cluster_members AS member
  WHERE member.cluster_id = (
    SELECT cluster_id
    FROM public.report_duplicate_cluster_members
    WHERE report_id = p_report_id
    LIMIT 1
  )
  GROUP BY member.cluster_id;

  IF v_cluster_id IS NOT NULL AND COALESCE(v_cluster_size, 0) > 1 THEN
    INSERT INTO public.report_integrity_signals (report_id, signal_type, severity, score, details_json)
    VALUES (
      p_report_id,
      'duplicate_cluster_member',
      'medium',
      35,
      jsonb_build_object('cluster_id', v_cluster_id, 'cluster_size', v_cluster_size)
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_refresh_report_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_impacted_report_id UUID;
  v_cluster_id UUID;
BEGIN
  PERFORM public.upsert_report_duplicate_cluster(NEW.id);
  PERFORM public.refresh_report_integrity_for_report(NEW.id);

  SELECT cluster_id
  INTO v_cluster_id
  FROM public.report_duplicate_cluster_members
  WHERE report_id = NEW.id
  LIMIT 1;

  FOR v_impacted_report_id IN
    SELECT DISTINCT impacted.report_id
    FROM (
      SELECT report.id AS report_id
      FROM public.hazard_reports AS report
      WHERE report.id <> NEW.id
        AND (
          report.user_id = NEW.user_id
          OR (
            NULLIF(BTRIM(COALESCE(report.device_id, '')), '') IS NOT NULL
            AND report.device_id = NULLIF(BTRIM(COALESCE(NEW.device_id, '')), '')
          )
          OR (
            report.hazard_type = NEW.hazard_type
            AND report.created_at BETWEEN NEW.created_at - INTERVAL '60 minutes' AND NEW.created_at + INTERVAL '60 minutes'
            AND ST_DWithin(report.location, NEW.location, 250)
          )
        )
      UNION
      SELECT member.report_id
      FROM public.report_duplicate_cluster_members AS member
      WHERE member.cluster_id = v_cluster_id
    ) AS impacted
    WHERE impacted.report_id IS NOT NULL
  LOOP
    PERFORM public.upsert_report_duplicate_cluster(v_impacted_report_id);
    PERFORM public.refresh_report_integrity_for_report(v_impacted_report_id);
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_report_integrity ON public.hazard_reports;
CREATE TRIGGER trg_refresh_report_integrity
  AFTER INSERT OR UPDATE OF description, translated_english, hazard_type, location, created_at, user_id, device_id
  ON public.hazard_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_refresh_report_integrity();

CREATE OR REPLACE FUNCTION public.trg_cleanup_empty_duplicate_cluster()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.cleanup_empty_report_duplicate_clusters();
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_empty_duplicate_cluster ON public.report_duplicate_cluster_members;
CREATE TRIGGER trg_cleanup_empty_duplicate_cluster
  AFTER DELETE ON public.report_duplicate_cluster_members
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_cleanup_empty_duplicate_cluster();

CREATE OR REPLACE FUNCTION public.admin_get_report_integrity_snapshots(
  p_report_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  report_id UUID,
  integrity_severity TEXT,
  integrity_score INTEGER,
  active_signal_count INTEGER,
  active_signal_types TEXT[],
  duplicate_cluster_id UUID,
  duplicate_cluster_size INTEGER,
  latest_submission_event_type TEXT,
  latest_submission_result_code TEXT,
  latest_submission_at TIMESTAMPTZ
)
LANGUAGE sql
AS $$
  WITH selected_reports AS (
    SELECT report.id AS report_id
    FROM public.hazard_reports AS report
    WHERE p_report_ids IS NULL OR report.id = ANY(p_report_ids)
  ),
  active_signals AS (
    SELECT
      signal.report_id,
      COALESCE(SUM(signal.score), 0)::INTEGER AS score_total,
      COALESCE(COUNT(*), 0)::INTEGER AS signal_count,
      COALESCE(array_agg(signal.signal_type ORDER BY signal.score DESC, signal.detected_at DESC), ARRAY[]::TEXT[]) AS signal_types,
      MAX(
        CASE signal.severity
          WHEN 'critical' THEN 4
          WHEN 'high' THEN 3
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 1
          ELSE 0
        END
      ) AS severity_rank
    FROM public.report_integrity_signals AS signal
    WHERE signal.status = 'active'
      AND (p_report_ids IS NULL OR signal.report_id = ANY(p_report_ids))
    GROUP BY signal.report_id
  ),
  cluster_rollup AS (
    SELECT
      member.report_id,
      member.cluster_id,
      cluster_sizes.cluster_size
    FROM public.report_duplicate_cluster_members AS member
    JOIN (
      SELECT cluster_id, COUNT(*)::INTEGER AS cluster_size
      FROM public.report_duplicate_cluster_members
      GROUP BY cluster_id
    ) AS cluster_sizes
      ON cluster_sizes.cluster_id = member.cluster_id
  ),
  latest_events AS (
    SELECT DISTINCT ON (event.report_id)
      event.report_id,
      event.event_type,
      event.result_code,
      event.created_at
    FROM public.report_submission_events AS event
    WHERE event.report_id IS NOT NULL
      AND (p_report_ids IS NULL OR event.report_id = ANY(p_report_ids))
    ORDER BY event.report_id, event.created_at DESC
  )
  SELECT
    report.report_id,
    CASE COALESCE(signal.severity_rank, 0)
      WHEN 4 THEN 'critical'
      WHEN 3 THEN 'high'
      WHEN 2 THEN 'medium'
      WHEN 1 THEN 'low'
      ELSE 'none'
    END AS integrity_severity,
    LEAST(COALESCE(signal.score_total, 0), 100) AS integrity_score,
    COALESCE(signal.signal_count, 0) AS active_signal_count,
    COALESCE(signal.signal_types, ARRAY[]::TEXT[]) AS active_signal_types,
    cluster.cluster_id AS duplicate_cluster_id,
    COALESCE(cluster.cluster_size, 0) AS duplicate_cluster_size,
    latest.event_type AS latest_submission_event_type,
    latest.result_code AS latest_submission_result_code,
    latest.created_at AS latest_submission_at
  FROM selected_reports AS report
  LEFT JOIN active_signals AS signal
    ON signal.report_id = report.report_id
  LEFT JOIN cluster_rollup AS cluster
    ON cluster.report_id = report.report_id
  LEFT JOIN latest_events AS latest
    ON latest.report_id = report.report_id;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_report_duplicate_cluster_members(
  p_report_id UUID
)
RETURNS TABLE (
  cluster_id UUID,
  report_id UUID,
  user_id UUID,
  user_name TEXT,
  hazard_type TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  description TEXT,
  translated_english TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_cluster_id UUID;
BEGIN
  SELECT member.cluster_id
  INTO v_cluster_id
  FROM public.report_duplicate_cluster_members AS member
  WHERE member.report_id = p_report_id
  LIMIT 1;

  IF v_cluster_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    v_cluster_id,
    report.id,
    report.user_id,
    report.user_name,
    report.hazard_type,
    report.status,
    report.created_at,
    report.description,
    report.translated_english
  FROM public.report_duplicate_cluster_members AS member
  JOIN public.hazard_reports AS report
    ON report.id = member.report_id
  WHERE member.cluster_id = v_cluster_id
  ORDER BY report.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_report_submission_events(
  p_report_id UUID,
  p_limit INTEGER DEFAULT 25
)
RETURNS TABLE (
  id UUID,
  report_id UUID,
  user_id UUID,
  device_id TEXT,
  client_id UUID,
  event_type TEXT,
  result_code TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
AS $$
  SELECT
    event.id,
    event.report_id,
    event.user_id,
    event.device_id,
    event.client_id,
    event.event_type,
    event.result_code,
    event.metadata,
    event.created_at
  FROM public.report_submission_events AS event
  WHERE event.report_id = p_report_id
  ORDER BY event.created_at DESC
  LIMIT GREATEST(COALESCE(p_limit, 25), 1);
$$;

GRANT EXECUTE ON FUNCTION public.insert_admin_audit_event(TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_report_submission_event(UUID, UUID, TEXT, UUID, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_report_integrity_snapshots(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_report_duplicate_cluster_members(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_report_submission_events(UUID, INTEGER) TO authenticated;

DROP FUNCTION IF EXISTS public.create_hazard_report(
  uuid, text, text, text, text, double precision, double precision, boolean, integer, text, timestamptz, text
);

DROP FUNCTION IF EXISTS public.create_hazard_report(
  uuid, text, text, text, text, double precision, double precision, boolean, integer, text, text, text, timestamptz, text
);

CREATE FUNCTION public.create_hazard_report(
  p_client_id uuid, p_user_phone text, p_user_name text, p_hazard_type text, p_description text,
  p_latitude double precision, p_longitude double precision, p_is_high_risk boolean DEFAULT false,
  p_people_at_risk integer DEFAULT null, p_urgency_level text DEFAULT null,
  p_immediate_danger_status text DEFAULT 'no', p_affected_people_band text DEFAULT null,
  p_event_time timestamptz DEFAULT now(), p_device_id text DEFAULT null
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid;
  v_existing_id uuid;
  v_recent_count integer;
  v_last_created timestamptz;
  v_device_last_created timestamptz;
  v_device_recent_count integer;
  v_device_hour_count integer;
  v_device_id text;
  v_report_location geography;
  v_metadata jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;

  v_device_id := NULLIF(BTRIM(COALESCE(p_device_id, '')), '');
  v_report_location := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;
  v_metadata := jsonb_build_object(
    'hazard_type', p_hazard_type,
    'latitude', p_latitude,
    'longitude', p_longitude
  );

  IF v_device_id IS NULL THEN
    PERFORM public.log_report_submission_event(
      NULL,
      v_user_id,
      NULL,
      p_client_id,
      'blocked',
      'device_id_required',
      v_metadata
    );
    RAISE EXCEPTION 'device_id_required' USING ERRCODE = '22023';
  END IF;

  SELECT id
  INTO v_existing_id
  FROM public.hazard_reports
  WHERE user_id = v_user_id
    AND hazard_type = p_hazard_type
    AND created_at > now() - interval '10 minutes'
    AND ST_DWithin(location, v_report_location, 50)
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    PERFORM public.log_report_submission_event(
      v_existing_id,
      v_user_id,
      v_device_id,
      p_client_id,
      'duplicate_linked',
      'duplicate_nearby_recent',
      v_metadata
    );
    RETURN v_existing_id;
  END IF;

  SELECT created_at INTO v_last_created
  FROM public.hazard_reports
  WHERE user_id = v_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_last_created IS NOT NULL AND v_last_created > now() - interval '30 seconds' THEN
    PERFORM public.log_report_submission_event(
      NULL,
      v_user_id,
      v_device_id,
      p_client_id,
      'blocked',
      'rate_limited_min_interval',
      jsonb_build_object('last_created_at', v_last_created) || v_metadata
    );
    RAISE EXCEPTION 'rate_limited_min_interval' USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*)::int INTO v_recent_count
  FROM public.hazard_reports
  WHERE user_id = v_user_id
    AND created_at > now() - interval '1 hour';

  IF v_recent_count >= 20 THEN
    PERFORM public.log_report_submission_event(
      NULL,
      v_user_id,
      v_device_id,
      p_client_id,
      'blocked',
      'rate_limited_hourly',
      jsonb_build_object('hourly_count', v_recent_count) || v_metadata
    );
    RAISE EXCEPTION 'rate_limited_hourly' USING ERRCODE = 'P0001';
  END IF;

  SELECT created_at INTO v_device_last_created
  FROM public.hazard_reports
  WHERE device_id = v_device_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_device_last_created IS NOT NULL AND v_device_last_created > now() - interval '20 seconds' THEN
    PERFORM public.log_report_submission_event(
      NULL,
      v_user_id,
      v_device_id,
      p_client_id,
      'blocked',
      'rate_limited_device_min_interval',
      jsonb_build_object('last_created_at', v_device_last_created) || v_metadata
    );
    RAISE EXCEPTION 'rate_limited_device_min_interval' USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*)::int INTO v_device_recent_count
  FROM public.hazard_reports
  WHERE device_id = v_device_id
    AND created_at > now() - interval '15 minutes';

  IF v_device_recent_count >= 6 THEN
    PERFORM public.log_report_submission_event(
      NULL,
      v_user_id,
      v_device_id,
      p_client_id,
      'blocked',
      'rate_limited_device_burst',
      jsonb_build_object('device_count_15m', v_device_recent_count) || v_metadata
    );
    RAISE EXCEPTION 'rate_limited_device_burst' USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*)::int INTO v_device_hour_count
  FROM public.hazard_reports
  WHERE device_id = v_device_id
    AND created_at > now() - interval '1 hour';

  IF v_device_hour_count >= 12 THEN
    PERFORM public.log_report_submission_event(
      NULL,
      v_user_id,
      v_device_id,
      p_client_id,
      'blocked',
      'rate_limited_device_hourly',
      jsonb_build_object('device_count_hourly', v_device_hour_count) || v_metadata
    );
    RAISE EXCEPTION 'rate_limited_device_hourly' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.hazard_reports(
    client_id, user_id, user_phone, user_name, hazard_type, description,
    location, latitude, longitude, is_high_risk, people_at_risk, urgency_level,
    immediate_danger_status, affected_people_band, status, event_time, device_id
  )
  VALUES (
    p_client_id,
    v_user_id,
    p_user_phone,
    NULLIF(p_user_name, ''),
    p_hazard_type,
    p_description,
    v_report_location,
    p_latitude,
    p_longitude,
    COALESCE(p_is_high_risk, false),
    p_people_at_risk,
    p_urgency_level,
    COALESCE(NULLIF(p_immediate_danger_status, ''), 'no'),
    CASE
      WHEN COALESCE(NULLIF(p_immediate_danger_status, ''), 'no') = 'yes'
        THEN COALESCE(NULLIF(p_affected_people_band, ''), 'unknown')
      ELSE NULL
    END,
    'pending',
    COALESCE(p_event_time, now()),
    v_device_id
  )
  RETURNING id INTO v_existing_id;

  PERFORM public.log_report_submission_event(
    v_existing_id,
    v_user_id,
    v_device_id,
    p_client_id,
    'accepted',
    'accepted',
    v_metadata
  );

  RETURN v_existing_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_hazard_report TO authenticated;

-- END MIGRATION: 035_report_fraud_hardening.sql
