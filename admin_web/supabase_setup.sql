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
CREATE POLICY "Allow public read access"
ON public.monitoring_zones
FOR SELECT
TO anon
USING (true);

-- Create Policy: Allow Insert Access for everyone (for demo purposes)
-- In production, you might want to restrict this to authenticated users
CREATE POLICY "Allow public insert access"
ON public.monitoring_zones
FOR INSERT
TO anon
WITH CHECK (true);

-- Create Policy: Allow Delete Access for everyone
CREATE POLICY "Allow public delete access"
ON public.monitoring_zones
FOR DELETE
TO anon
USING (true);

-- Grant permissions to the anon role (critical for API access)
GRANT ALL ON TABLE public.monitoring_zones TO anon;
GRANT ALL ON TABLE public.monitoring_zones TO authenticated;
GRANT ALL ON TABLE public.monitoring_zones TO service_role;

COMMENT ON TABLE public.monitoring_zones IS 'Stores circular geofencing zones for the dashboard.';
