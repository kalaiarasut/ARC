-- ============================================
-- Civil Alert System - Database Schema
-- ============================================
-- Project: Ocean Hazard Reporting System
-- Database: PostgreSQL with PostGIS
-- Last Updated: 2026-01-30

-- ============================================
-- EXTENSIONS
-- ============================================

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PostGIS for spatial/geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- TABLES
-- ============================================

-- ---------------------------------------------
-- Table: hazard_reports
-- Purpose: Store citizen-reported ocean hazards
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS hazard_reports (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Idempotency (prevents duplicate submissions)
  client_id UUID UNIQUE NOT NULL,
  
  -- User Information
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_phone TEXT NOT NULL,
  user_name TEXT,
  
  -- Hazard Details
  hazard_type TEXT NOT NULL 
    CHECK (hazard_type IN ('High Waves', 'Tsunami', 'Storm', 'Flood', 'Other')),
  description TEXT NOT NULL,
  
  -- Location (PostGIS)
  location GEOGRAPHY(Point, 4326) NOT NULL,  -- WGS84 coordinate system
  latitude DOUBLE PRECISION NOT NULL,         -- Denormalized for easy access
  longitude DOUBLE PRECISION NOT NULL,        -- Denormalized for easy access
  
  -- Risk Assessment
  is_high_risk BOOLEAN DEFAULT FALSE,
  people_at_risk INTEGER,
  urgency_level TEXT CHECK (urgency_level IN ('Low', 'Medium', 'High')),
  
  -- Media
  media_urls TEXT[],                          -- Array of cloud storage URLs
  upload_complete BOOLEAN DEFAULT FALSE,      -- Track media upload status
  
  -- Status
  status TEXT CHECK (status IN ('pending', 'verified', 'resolved')) DEFAULT 'pending',
  
  -- Timestamps
  event_time TIMESTAMPTZ DEFAULT NOW(),       -- When hazard occurred
  created_at TIMESTAMPTZ DEFAULT NOW()        -- When report was created in DB
);

-- ============================================
-- INDEXES
-- ============================================

-- Spatial index for location-based queries (radius search)
CREATE INDEX IF NOT EXISTS idx_hazard_location 
  ON hazard_reports 
  USING GIST (location);

-- Time-based queries (recent reports)
CREATE INDEX IF NOT EXISTS idx_hazard_created_at 
  ON hazard_reports (created_at DESC);

-- User-based queries
CREATE INDEX IF NOT EXISTS idx_hazard_user_id 
  ON hazard_reports (user_id);

-- Idempotency lookups (fast duplicate detection)
CREATE INDEX IF NOT EXISTS idx_hazard_client_id 
  ON hazard_reports (client_id);

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_hazard_status 
  ON hazard_reports (status);

-- High-risk filtering
CREATE INDEX IF NOT EXISTS idx_hazard_high_risk 
  ON hazard_reports (is_high_risk) 
  WHERE is_high_risk = TRUE;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE hazard_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (for idempotency)
DROP POLICY IF EXISTS "Users can insert own reports" ON hazard_reports;
DROP POLICY IF EXISTS "Anyone authenticated can view reports" ON hazard_reports;
DROP POLICY IF EXISTS "Users can update own reports" ON hazard_reports;

-- Policy 1: Users can insert their own reports
CREATE POLICY "Users can insert own reports" 
  ON hazard_reports 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy 2: Anyone authenticated can view all reports (public safety data)
CREATE POLICY "Anyone authenticated can view reports" 
  ON hazard_reports 
  FOR SELECT 
  USING (true);

-- Policy 3: Users can update only their own reports
CREATE POLICY "Users can update own reports" 
  ON hazard_reports 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create hazard-media bucket for photos/videos/audio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hazard-media',
  'hazard-media',
  true,                                        -- Public read access
  10485760,                                    -- 10MB limit
  ARRAY['image/*', 'video/*', 'audio/*']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FUNCTIONS & TRIGGERS (Optional)
-- ============================================

-- Function to get reports near a location (radius search)
CREATE OR REPLACE FUNCTION get_reports_near_location(
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION,
  result_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  hazard_type TEXT,
  description TEXT,
  is_high_risk BOOLEAN,
  distance_meters DOUBLE PRECISION,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hr.id,
    hr.hazard_type,
    hr.description,
    hr.is_high_risk,
    ST_Distance(
      hr.location,
      ST_MakePoint(lon, lat)::geography
    ) AS distance_meters,
    hr.created_at
  FROM hazard_reports hr
  WHERE ST_DWithin(
    hr.location,
    ST_MakePoint(lon, lat)::geography,
    radius_meters
  )
  ORDER BY distance_meters
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE QUERIES
-- ============================================

-- Query 1: Get recent high-risk reports
-- SELECT hazard_type, description, people_at_risk, urgency_level, created_at
-- FROM hazard_reports
-- WHERE is_high_risk = TRUE
-- ORDER BY created_at DESC
-- LIMIT 10;

-- Query 2: Find reports within 10km of a location
-- SELECT * FROM get_reports_near_location(12.9716, 77.5946, 10000, 20);

-- Query 3: Count reports by type
-- SELECT hazard_type, COUNT(*) as count
-- FROM hazard_reports
-- GROUP BY hazard_type
-- ORDER BY count DESC;

-- Query 4: Reports with incomplete uploads
-- SELECT id, hazard_type, description, upload_complete
-- FROM hazard_reports
-- WHERE upload_complete = FALSE;

-- ============================================
-- NOTES
-- ============================================

-- 1. PostGIS Geography vs Geometry:
--    - Using GEOGRAPHY for accurate distance calculations in meters
--    - SRID 4326 = WGS84 (standard GPS coordinate system)

-- 2. Idempotency:
--    - client_id is generated on client and sent with each request
--    - Prevents duplicate reports during offline sync/retries
--    - UNIQUE constraint ensures one report per client_id

-- 3. Location Storage:
--    - location: PostGIS geography (efficient for radius queries)
--    - lat/lon: Denormalized for easy display in UI

-- 4. RLS Security:
--    - Users can only insert/update their own reports
--    - All authenticated users can view all reports (public safety)

-- 5. Storage Bucket:
--    - Public read access for transparency
--    - 10MB file size limit enforced
--    - Folder structure: {user_id}/{report_id}/filename.ext
