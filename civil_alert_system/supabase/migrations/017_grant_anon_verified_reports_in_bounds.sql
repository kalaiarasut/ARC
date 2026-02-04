-- Allow anon users to fetch privacy-safe verified reports for map/home feeds.
--
-- The RPC returns reduced-precision coordinates (~100m) and only verified reports,
-- so granting EXECUTE to anon is acceptable for public viewing.

GRANT EXECUTE ON FUNCTION public.get_verified_reports_in_bounds(
  double precision,
  double precision,
  double precision,
  double precision,
  integer
) TO anon;
