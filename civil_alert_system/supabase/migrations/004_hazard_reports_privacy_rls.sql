-- Civil Alert System - Privacy hardening for hazard_reports
-- Goal: citizens can read ONLY their own full reports; public map uses safe RPCs.

ALTER TABLE hazard_reports ENABLE ROW LEVEL SECURITY;

-- Replace overly-broad SELECT policy
DROP POLICY IF EXISTS "Anyone authenticated can view reports" ON hazard_reports;
DROP POLICY IF EXISTS "Users can view own reports" ON hazard_reports;

CREATE POLICY "Users can view own reports"
  ON hazard_reports
  FOR SELECT
  USING (auth.uid() = user_id);

-- Note: public viewing should happen via RPCs like get_verified_reports_in_bounds
-- which already returns reduced precision + safe columns.
