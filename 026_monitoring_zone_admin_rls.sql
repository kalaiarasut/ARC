-- Restrict monitoring-zone access to authenticated admins.
-- The admin web app uses Supabase auth, so old anon-only policies block inserts/updates.

ALTER TABLE IF EXISTS public.monitoring_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.monitoring_zones;
DROP POLICY IF EXISTS "Allow public insert access" ON public.monitoring_zones;
DROP POLICY IF EXISTS "Allow public delete access" ON public.monitoring_zones;
DROP POLICY IF EXISTS "Admins read monitoring zones" ON public.monitoring_zones;
DROP POLICY IF EXISTS "Admins insert monitoring zones" ON public.monitoring_zones;
DROP POLICY IF EXISTS "Admins update monitoring zones" ON public.monitoring_zones;
DROP POLICY IF EXISTS "Admins delete monitoring zones" ON public.monitoring_zones;

CREATE POLICY "Admins read monitoring zones"
  ON public.monitoring_zones
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins insert monitoring zones"
  ON public.monitoring_zones
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins update monitoring zones"
  ON public.monitoring_zones
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins delete monitoring zones"
  ON public.monitoring_zones
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
