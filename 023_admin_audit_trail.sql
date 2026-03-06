-- ============================================================================
-- BEGIN MIGRATION: 023_admin_audit_trail.sql
-- ============================================================================

-- Diagnostic: Check current schema and search path
-- SHOW search_path;
-- SELECT nspname FROM pg_catalog.pg_namespace;

CREATE TABLE IF NOT EXISTS report_status_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES hazard_reports(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id),
  admin_email TEXT NOT NULL,
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_report_id ON report_status_audit(report_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON report_status_audit(changed_at DESC);

ALTER TABLE report_status_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON report_status_audit;
CREATE POLICY "Admins can view audit logs" 
  ON report_status_audit 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM app_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Database Trigger to log status changes automatically
CREATE OR REPLACE FUNCTION log_report_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_email TEXT;
BEGIN
  -- Only log if the status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Extract email from JWT if available, else fallback
    v_admin_email := current_setting('request.jwt.claims', true)::json->>'email';
    IF v_admin_email IS NULL THEN
      v_admin_email := 'system/unknown';
    END IF;
    -- Log the change even if auth.uid() is missing (fallback to 'system')
    INSERT INTO report_status_audit (
      report_id,
      admin_id,
      admin_email,
      old_status,
      new_status
    ) VALUES (
      NEW.id,
      auth.uid(),
      v_admin_email,
      COALESCE(OLD.status, 'pending'),
      NEW.status
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_report_status_change ON hazard_reports;
CREATE TRIGGER trigger_log_report_status_change
  AFTER UPDATE OF status ON hazard_reports
  FOR EACH ROW
  EXECUTE FUNCTION log_report_status_change();

-- END MIGRATION: 023_admin_audit_trail.sql
