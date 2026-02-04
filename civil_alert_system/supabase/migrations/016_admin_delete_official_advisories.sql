-- Allow admins to delete official advisories (official updates)
--
-- The admin web app needs to delete records from `public.official_advisories`.
-- Deletion should be restricted to admin users only.

ALTER TABLE public.official_advisories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can delete advisories" ON public.official_advisories;

CREATE POLICY "Admins can delete advisories"
  ON public.official_advisories
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
