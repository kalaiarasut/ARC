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
