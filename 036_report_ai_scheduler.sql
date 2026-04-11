-- ============================================================================
-- BEGIN MIGRATION: 036_report_ai_scheduler.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS vault;

CREATE OR REPLACE FUNCTION public.invoke_report_ai_worker(
  batch_limit integer DEFAULT 10,
  batch_concurrency integer DEFAULT 2
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_url text;
  worker_secret text;
  request_id bigint;
BEGIN
  SELECT decrypted_secret
  INTO project_url
  FROM vault.decrypted_secrets
  WHERE name = 'project_url'
  LIMIT 1;

  SELECT decrypted_secret
  INTO worker_secret
  FROM vault.decrypted_secrets
  WHERE name = 'report_ai_worker_secret'
  LIMIT 1;

  IF coalesce(project_url, '') = '' THEN
    RAISE EXCEPTION 'Missing vault secret: project_url';
  END IF;

  IF coalesce(worker_secret, '') = '' THEN
    RAISE EXCEPTION 'Missing vault secret: report_ai_worker_secret';
  END IF;

  SELECT net.http_post(
    url := rtrim(project_url, '/') || '/functions/v1/process_pending_report_ai',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-worker-secret', worker_secret
    ),
    body := jsonb_build_object(
      'limit', greatest(1, least(coalesce(batch_limit, 10), 30)),
      'concurrency', greatest(1, least(coalesce(batch_concurrency, 2), 4))
    )
  )
  INTO request_id;

  RETURN request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.invoke_report_ai_worker(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invoke_report_ai_worker(integer, integer) TO postgres;

CREATE OR REPLACE FUNCTION public.schedule_report_ai_worker(
  cron_expression text DEFAULT '*/5 * * * *',
  batch_limit integer DEFAULT 10,
  batch_concurrency integer DEFAULT 2
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'report-ai-worker-every-5-minutes'
  ) THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'report-ai-worker-every-5-minutes';
  END IF;

  PERFORM cron.schedule(
    'report-ai-worker-every-5-minutes',
    cron_expression,
    format(
      'select public.invoke_report_ai_worker(%s, %s);',
      greatest(1, least(coalesce(batch_limit, 10), 30)),
      greatest(1, least(coalesce(batch_concurrency, 2), 4))
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.schedule_report_ai_worker(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.schedule_report_ai_worker(text, integer, integer) TO postgres;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_extension
    WHERE extname = 'vault'
  )
  AND EXISTS (
    SELECT 1
    FROM vault.decrypted_secrets
    WHERE name = 'project_url'
  )
  AND EXISTS (
    SELECT 1
    FROM vault.decrypted_secrets
    WHERE name = 'report_ai_worker_secret'
  ) THEN
    PERFORM public.schedule_report_ai_worker('*/5 * * * *', 10, 2);
  END IF;
END;
$$;

-- END MIGRATION: 036_report_ai_scheduler.sql
