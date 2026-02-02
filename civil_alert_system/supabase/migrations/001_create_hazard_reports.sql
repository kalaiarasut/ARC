-- Civil Alert System - Hazard Reports Schema
-- Run this migration in your Supabase SQL Editor:
-- https://app.supabase.com/project/zaimfwpaloadjrljgdzd/sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create hazard_reports table
CREATE TABLE IF NOT EXISTS hazard_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_phone TEXT NOT NULL,
  user_name TEXT,
  hazard_type TEXT NOT NULL CHECK (hazard_type IN ('High Waves', 'Tsunami', 'Storm', 'Flood', 'Other')),
  description TEXT NOT NULL,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_high_risk BOOLEAN DEFAULT FALSE,
  people_at_risk INTEGER,
  urgency_level TEXT CHECK (urgency_level IN ('Low', 'Medium', 'High')),
  media_urls TEXT[],
  upload_complete BOOLEAN DEFAULT FALSE,
  status TEXT CHECK (status IN ('pending', 'verified', 'resolved')) DEFAULT 'pending',
  event_time TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_hazard_location ON hazard_reports USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_hazard_created_at ON hazard_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hazard_user_id ON hazard_reports (user_id);
CREATE INDEX IF NOT EXISTS idx_hazard_client_id ON hazard_reports (client_id);

-- Enable RLS
ALTER TABLE hazard_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (for idempotency)
DROP POLICY IF EXISTS "Users can insert own reports" ON hazard_reports;
DROP POLICY IF EXISTS "Anyone authenticated can view reports" ON hazard_reports;
DROP POLICY IF EXISTS "Users can update own reports" ON hazard_reports;

-- Create RLS policies
CREATE POLICY "Users can insert own reports" 
  ON hazard_reports 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone authenticated can view reports" 
  ON hazard_reports 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own reports" 
  ON hazard_reports 
  FOR UPDATE 
  USING (auth.uid() = user_id);
