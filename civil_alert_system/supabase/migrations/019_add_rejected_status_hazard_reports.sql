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
