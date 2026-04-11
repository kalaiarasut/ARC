-- ============================================================================
-- BEGIN MIGRATION: 034_report_ai_scoring.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.report_ai_analysis (
  report_id UUID PRIMARY KEY REFERENCES public.hazard_reports(id) ON DELETE CASCADE,
  analysis_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (analysis_status IN ('pending', 'processing', 'completed', 'partial', 'failed')),
  operational_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  score_bucket TEXT NOT NULL DEFAULT 'low'
    CHECK (score_bucket IN ('critical', 'high', 'medium', 'low')),
  text_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  image_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  audio_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  video_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  metadata_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  confidence_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  recommended_action TEXT,
  recommended_status TEXT
    CHECK (recommended_status IS NULL OR recommended_status IN ('pending', 'verified', 'rejected', 'resolved')),
  summary TEXT,
  extracted_signals_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  scoring_reasons_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  media_evidence_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_modalities_json JSONB NOT NULL DEFAULT jsonb_build_object(
    'metadata', false,
    'text', false,
    'image', false,
    'audio', false,
    'video', false
  ),
  provider_primary TEXT,
  model_primary TEXT,
  provider_fallback TEXT,
  model_fallback TEXT,
  analysis_attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  needs_recompute BOOLEAN NOT NULL DEFAULT true,
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.report_ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.hazard_reports(id) ON DELETE CASCADE,
  run_kind TEXT NOT NULL
    CHECK (run_kind IN ('base', 'media', 'manual_retry', 'scheduled')),
  status TEXT NOT NULL
    CHECK (status IN ('started', 'completed', 'partial', 'failed')),
  provider_primary TEXT,
  model_primary TEXT,
  provider_fallback TEXT,
  model_fallback TEXT,
  prompt_version TEXT,
  summary TEXT,
  error_text TEXT,
  score_snapshot DOUBLE PRECISION,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.report_ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.hazard_reports(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  score_helpful BOOLEAN,
  recommendation_helpful BOOLEAN,
  summary_helpful BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_ai_analysis_status
  ON public.report_ai_analysis (analysis_status, needs_recompute, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_report_ai_analysis_score
  ON public.report_ai_analysis (operational_score DESC, score_bucket, analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_ai_runs_report_created
  ON public.report_ai_runs (report_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_ai_feedback_report_created
  ON public.report_ai_feedback (report_id, created_at DESC);

ALTER TABLE public.report_ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_ai_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read report ai analysis" ON public.report_ai_analysis;
CREATE POLICY "Admins can read report ai analysis"
  ON public.report_ai_analysis FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "No direct report ai analysis writes" ON public.report_ai_analysis;
CREATE POLICY "No direct report ai analysis writes"
  ON public.report_ai_analysis FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Admins can read report ai runs" ON public.report_ai_runs;
CREATE POLICY "Admins can read report ai runs"
  ON public.report_ai_runs FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "No direct report ai run writes" ON public.report_ai_runs;
CREATE POLICY "No direct report ai run writes"
  ON public.report_ai_runs FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Admins can read report ai feedback" ON public.report_ai_feedback;
CREATE POLICY "Admins can read report ai feedback"
  ON public.report_ai_feedback FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert report ai feedback" ON public.report_ai_feedback;
CREATE POLICY "Admins can insert report ai feedback"
  ON public.report_ai_feedback FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS trg_report_ai_analysis_updated_at ON public.report_ai_analysis;
CREATE TRIGGER trg_report_ai_analysis_updated_at
  BEFORE UPDATE ON public.report_ai_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.touch_report_ai_analysis()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.report_ai_analysis (
    report_id,
    analysis_status,
    operational_score,
    score_bucket,
    recommended_action,
    summary,
    needs_recompute
  )
  VALUES (
    NEW.id,
    'pending',
    0,
    'low',
    'Awaiting AI analysis',
    'Awaiting AI analysis',
    true
  )
  ON CONFLICT (report_id)
  DO UPDATE SET
    analysis_status = CASE
      WHEN public.report_ai_analysis.analysis_status = 'processing'
        THEN public.report_ai_analysis.analysis_status
      ELSE 'pending'
    END,
    last_error = NULL,
    needs_recompute = true,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_report_ai_analysis_insert ON public.hazard_reports;
CREATE TRIGGER trg_touch_report_ai_analysis_insert
  AFTER INSERT ON public.hazard_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_report_ai_analysis();

DROP TRIGGER IF EXISTS trg_touch_report_ai_analysis_update ON public.hazard_reports;
CREATE TRIGGER trg_touch_report_ai_analysis_update
  AFTER UPDATE OF
    description,
    translated_english,
    translation_status,
    urgency_level,
    is_high_risk,
    people_at_risk,
    immediate_danger_status,
    affected_people_band,
    media_urls,
    upload_complete,
    event_time
  ON public.hazard_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_report_ai_analysis();

INSERT INTO public.report_ai_analysis (
  report_id,
  analysis_status,
  operational_score,
  score_bucket,
  recommended_action,
  summary,
  needs_recompute
)
SELECT
  hr.id,
  'pending',
  0,
  'low',
  'Awaiting AI analysis',
  'Awaiting AI analysis',
  true
FROM public.hazard_reports AS hr
ON CONFLICT (report_id) DO NOTHING;

INSERT INTO public.admin_audit_log (
  event_kind,
  entity_type,
  entity_id,
  action,
  actor_user_id,
  actor_email,
  metadata,
  changed_fields,
  created_at
)
SELECT
  'audit',
  'system',
  'report_ai_analysis_backfill',
  'created',
  NULL,
  'system/migration',
  jsonb_build_object('records_initialized', COUNT(*)),
  ARRAY['records_initialized']::TEXT[],
  NOW()
WHERE NOT EXISTS (
  SELECT 1
  FROM public.admin_audit_log
  WHERE entity_type = 'system'
    AND entity_id = 'report_ai_analysis_backfill'
    AND action = 'created'
);

-- END MIGRATION: 034_report_ai_scoring.sql
