-- Allow anonymous clients (mobile/public) to fetch citizen-safe cached risk zones.
-- The RPC itself returns ONLY verified + active zones.

GRANT EXECUTE ON FUNCTION public.get_cached_risk_zones(
  double precision,
  double precision,
  double precision,
  double precision
) TO anon;
