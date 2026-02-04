-- Create the table for storing geofence zones
CREATE TABLE IF NOT EXISTS public.monitoring_zones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    center_lat DOUBLE PRECISION NOT NULL,
    center_lng DOUBLE PRECISION NOT NULL,
    radius_meters DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.monitoring_zones ENABLE ROW LEVEL SECURITY;

-- Create Policy: Allow Read Access for everyone (since we use anon key)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
            AND tablename = 'monitoring_zones'
            AND policyname = 'Allow public read access'
    ) THEN
        CREATE POLICY "Allow public read access"
        ON public.monitoring_zones
        FOR SELECT
        TO anon
        USING (true);
    END IF;
END $$;

-- Create Policy: Allow Insert Access for everyone (for demo purposes)
-- In production, you might want to restrict this to authenticated users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
            AND tablename = 'monitoring_zones'
            AND policyname = 'Allow public insert access'
    ) THEN
        CREATE POLICY "Allow public insert access"
        ON public.monitoring_zones
        FOR INSERT
        TO anon
        WITH CHECK (true);
    END IF;
END $$;

-- Create Policy: Allow Delete Access for everyone
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
            AND tablename = 'monitoring_zones'
            AND policyname = 'Allow public delete access'
    ) THEN
        CREATE POLICY "Allow public delete access"
        ON public.monitoring_zones
        FOR DELETE
        TO anon
        USING (true);
    END IF;
END $$;

-- Grant permissions to the anon role (critical for API access)
GRANT ALL ON TABLE public.monitoring_zones TO anon;
GRANT ALL ON TABLE public.monitoring_zones TO authenticated;
GRANT ALL ON TABLE public.monitoring_zones TO service_role;

COMMENT ON TABLE public.monitoring_zones IS 'Stores circular geofencing zones for the dashboard.';

-- ------------------------------------------------------------
-- Hazard Reports (admin_web reads from public.hazard_reports)
--
-- If RLS is enabled and there is no SELECT policy for the anon role,
-- Supabase will respond with 200 + [] (no visible rows) even though
-- records exist in the table.
--
-- SECURITY NOTE:
-- This grants READ access to anon for demo/dev. For production,
-- consider restricting to authenticated or a dedicated role.
-- ------------------------------------------------------------

ALTER TABLE IF EXISTS public.hazard_reports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
            AND tablename = 'hazard_reports'
            AND policyname = 'Allow public read hazard reports'
    ) THEN
        CREATE POLICY "Allow public read hazard reports"
        ON public.hazard_reports
        FOR SELECT
        TO anon
        USING (true);
    END IF;
END $$;

GRANT SELECT ON TABLE public.hazard_reports TO anon;
GRANT SELECT ON TABLE public.hazard_reports TO authenticated;
GRANT ALL ON TABLE public.hazard_reports TO service_role;
