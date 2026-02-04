-- Civil Alert System - Admin Portal RLS for hazard_reports
--
-- Problem:
-- - Migration 004 hardened hazard_reports so authenticated users can only SELECT their own reports.
-- - The admin web now uses real Supabase Auth (authenticated role), so it sees zero rows.
--
-- Fix:
-- - Add explicit admin policies that allow users marked in public.app_roles(role='admin')
--   to read and update all hazard reports.

ALTER TABLE public.hazard_reports ENABLE ROW LEVEL SECURITY;

-- Admins can read all reports
DROP POLICY IF EXISTS "Admins can view all reports" ON public.hazard_reports;
CREATE POLICY "Admins can view all reports"
  ON public.hazard_reports
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can update any report (verify/resolve)
DROP POLICY IF EXISTS "Admins can update any report" ON public.hazard_reports;
CREATE POLICY "Admins can update any report"
  ON public.hazard_reports
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
