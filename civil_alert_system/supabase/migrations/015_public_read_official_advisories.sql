-- Allow mobile map (including anon users) to read official advisories
--
-- Problem:
-- - official_advisories RLS originally allowed SELECT only for authenticated.
-- - Many mobile users may not be signed in, so advisories (official updates) never appear on the map.
--
-- Fix:
-- - Add a SELECT policy for anon + authenticated.

ALTER TABLE public.official_advisories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read advisories" ON public.official_advisories;
DROP POLICY IF EXISTS "Public can read advisories" ON public.official_advisories;

CREATE POLICY "Public can read advisories"
  ON public.official_advisories
  FOR SELECT
  TO anon, authenticated
  USING (true);
