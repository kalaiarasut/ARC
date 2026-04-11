-- ============================================================================
-- Civil Alert System - Current Schema Reference
-- Regenerated from combined migrations (cleaner reference version)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 1. TABLES
-- ============================================

-- 1.1 App Roles
CREATE TABLE IF NOT EXISTS public.app_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.2 Hazard Reports
CREATE TABLE IF NOT EXISTS public.hazard_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_phone TEXT NOT NULL,
  user_name TEXT,
  hazard_type TEXT NOT NULL CHECK (hazard_type IN ('High Waves', 'Tsunami', 'Storm', 'Flood', 'Other')),
  description TEXT NOT NULL,
  detected_language TEXT,
  translated_english TEXT,
  translation_status TEXT NOT NULL DEFAULT 'pending' CHECK (translation_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  translation_attempts INTEGER NOT NULL DEFAULT 0,
  translation_last_error TEXT,
  translation_last_attempt_at TIMESTAMPTZ,
  translation_next_retry_at TIMESTAMPTZ,
  translation_provider TEXT,
  translation_model TEXT,
  translated_at TIMESTAMPTZ,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_high_risk BOOLEAN DEFAULT FALSE,
  people_at_risk INTEGER,
  urgency_level TEXT CHECK (urgency_level IN ('Low', 'Medium', 'High')),
  immediate_danger_status TEXT NOT NULL DEFAULT 'no' CHECK (immediate_danger_status IN ('yes', 'no', 'not_sure')),
  affected_people_band TEXT CHECK (affected_people_band IN ('unknown', '1_5', '6_20', '21_50', '50_plus')),
  media_urls TEXT[],
  upload_complete BOOLEAN DEFAULT FALSE,
  status TEXT CHECK (status IN ('pending', 'verified', 'rejected', 'resolved')) DEFAULT 'pending',
  event_time TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  device_id TEXT
);

-- 1.3 Risk Zones Cached
CREATE TABLE IF NOT EXISTS public.risk_zones_cached (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_lat DOUBLE PRECISION NOT NULL,
  center_lon DOUBLE PRECISION NOT NULL,
  radius_meters DOUBLE PRECISION NOT NULL,
  intensity TEXT CHECK (intensity IN ('low', 'medium', 'high')),
  report_count INTEGER NOT NULL,
  intensity_score DOUBLE PRECISION NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 Zone Settings
CREATE TABLE IF NOT EXISTS public.zone_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  report_weight DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  urgency_high_weight DOUBLE PRECISION NOT NULL DEFAULT 2.0,
  urgency_medium_weight DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  urgency_low_weight DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  verified_bonus DOUBLE PRECISION NOT NULL DEFAULT 2.0,
  media_bonus DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  high_risk_bonus DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  window_minutes INTEGER NOT NULL DEFAULT 1440,
  active_minutes INTEGER NOT NULL DEFAULT 360,
  decay_half_life_minutes INTEGER NOT NULL DEFAULT 360,
  eps_meters DOUBLE PRECISION NOT NULL DEFAULT 600.0,
  min_points INTEGER NOT NULL DEFAULT 3,
  search_radius_km DOUBLE PRECISION NOT NULL DEFAULT 10.0,
  info_threshold DOUBLE PRECISION NOT NULL DEFAULT 10.0,
  caution_threshold DOUBLE PRECISION NOT NULL DEFAULT 25.0,
  high_threshold DOUBLE PRECISION NOT NULL DEFAULT 50.0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO public.zone_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 1.5 Risk Zones
CREATE TABLE IF NOT EXISTS public.risk_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_key TEXT NOT NULL UNIQUE,
  center_lat DOUBLE PRECISION NOT NULL,
  center_lon DOUBLE PRECISION NOT NULL,
  radius_meters DOUBLE PRECISION NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('informational', 'caution', 'high_risk')),
  status TEXT NOT NULL CHECK (status IN ('candidate', 'verified', 'suppressed', 'locked')) DEFAULT 'candidate',
  score DOUBLE PRECISION NOT NULL,
  report_count INTEGER NOT NULL,
  verified_count INTEGER NOT NULL,
  high_count INTEGER NOT NULL,
  medium_count INTEGER NOT NULL,
  low_count INTEGER NOT NULL,
  media_count INTEGER NOT NULL,
  high_risk_count INTEGER NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active_until TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  locked_until TIMESTAMPTZ,
  contributing_report_ids UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.6 Official Advisories (017_advisory_radius included here)
CREATE TABLE IF NOT EXISTS public.official_advisories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  region TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'watch', 'warning')) DEFAULT 'info',
  category TEXT NOT NULL DEFAULT 'warning' CHECK (category IN ('food', 'shelter', 'medical', 'rescue', 'roadblock', 'warning', 'evacuation')),
  location GEOGRAPHY(Point, 4326),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  radius_km DOUBLE PRECISION,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  contact_phone TEXT,
  contact_whatsapp TEXT,
  contact_hotline TEXT,
  source_language TEXT NOT NULL DEFAULT 'en' CHECK (source_language IN ('en', 'bn', 'gu', 'hi', 'kn', 'ml', 'mr', 'or', 'ta', 'te')),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT official_advisories_validity_window_check CHECK (expires_at IS NULL OR starts_at IS NULL OR expires_at > starts_at),
  CONSTRAINT official_advisories_lat_lng_pair_check CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL))
);
COMMENT ON COLUMN public.official_advisories.radius_km IS 'Radius in kilometers for GPS-targeted advisories. Null means broadcast to everyone.';

-- 1.7 Official Advisory Translations
CREATE TABLE IF NOT EXISTS public.official_advisory_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisory_id UUID NOT NULL REFERENCES public.official_advisories(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL CHECK (language_code IN ('en', 'bn', 'gu', 'hi', 'kn', 'ml', 'mr', 'or', 'ta', 'te')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  region TEXT,
  translation_status TEXT NOT NULL DEFAULT 'generated' CHECK (translation_status IN ('generated', 'reviewed', 'failed')),
  provider TEXT,
  model TEXT,
  translated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (advisory_id, language_code)
);

-- 1.8 Push Tokens
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'android',
  token TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  language_code TEXT NOT NULL DEFAULT 'en' CHECK (language_code IN ('en', 'bn', 'gu', 'hi', 'kn', 'ml', 'mr', 'or', 'ta', 'te')),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- 1.9 Notification Outbox
CREATE TABLE IF NOT EXISTS public.notification_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  push_token_id UUID REFERENCES public.push_tokens(id) ON DELETE SET NULL,
  user_id UUID,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- 1.10 Badge Definitions
CREATE TABLE IF NOT EXISTS public.badge_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    points_threshold INT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO public.badge_definitions (id, name, description, icon, category, points_threshold, sort_order) VALUES
    ('first_wave', 'First Wave', 'Submit your first hazard report', 'water_drop', 'milestone', NULL, 1),
    ('active_sensor', 'Active Sensor', 'Submit 10 hazard reports', 'sensors', 'milestone', NULL, 2),
    ('verified_guardian', 'Verified Guardian', 'Get 5 reports verified by analysts', 'verified_user', 'quality', NULL, 3),
    ('evidence_collector', 'Evidence Collector', 'Submit 10 reports with photo/video evidence', 'camera_alt', 'quality', NULL, 4),
    ('rapid_responder', 'Rapid Responder', 'Submit 3 reports in a single day', 'bolt', 'consistency', NULL, 5),
    ('community_champion', 'Community Champion', 'Earn 500 total points', 'emoji_events', 'milestone', 500, 6),
    ('elite_reporter', 'Elite Reporter', 'Earn 1000 total points', 'star', 'milestone', 1000, 7),
    ('precision_scout', 'Precision Scout', '80%+ verification rate (min 10 reports)', 'gps_fixed', 'quality', NULL, 8),
    ('streak_master', 'Streak Master', 'Report on 7 consecutive days', 'local_fire_department', 'consistency', NULL, 9),
    ('area_expert', 'Area Expert', 'Submit from 5+ distinct locations (>1km apart)', 'explore', 'consistency', NULL, 10)
ON CONFLICT (id) DO NOTHING;

-- 1.11 Citizen Points
CREATE TABLE IF NOT EXISTS public.citizen_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    report_id UUID REFERENCES public.hazard_reports(id) ON DELETE SET NULL,
    points INT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.12 Citizen Badges
CREATE TABLE IF NOT EXISTS public.citizen_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    badge_id TEXT NOT NULL REFERENCES public.badge_definitions(id),
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- 1.13 Report Status Audit
CREATE TABLE IF NOT EXISTS public.report_status_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.hazard_reports(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id),
  admin_email TEXT NOT NULL,
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.14 Monitoring Zones
CREATE TABLE IF NOT EXISTS public.monitoring_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Monitoring Zone',
  description TEXT NOT NULL DEFAULT '',
  shape TEXT NOT NULL DEFAULT 'circle' CHECK (shape IN ('circle', 'polygon')),
  polygon_points JSONB CHECK ((shape = 'circle' AND (polygon_points IS NULL OR jsonb_typeof(polygon_points) = 'array')) OR (shape = 'polygon' AND polygon_points IS NOT NULL AND jsonb_typeof(polygon_points) = 'array' AND jsonb_array_length(polygon_points) >= 3)),
  people_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_hazard_location ON public.hazard_reports USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_hazard_created_at ON public.hazard_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hazard_user_id ON public.hazard_reports (user_id);
CREATE INDEX IF NOT EXISTS idx_hazard_client_id ON public.hazard_reports (client_id);
CREATE INDEX IF NOT EXISTS idx_hazard_device_id ON public.hazard_reports (device_id);
CREATE INDEX IF NOT EXISTS idx_hazard_reports_detected_language ON public.hazard_reports (detected_language);
CREATE INDEX IF NOT EXISTS idx_hazard_reports_translation_status ON public.hazard_reports (translation_status);
CREATE INDEX IF NOT EXISTS idx_hazard_reports_translation_retry ON public.hazard_reports (translation_status, translation_next_retry_at, translation_attempts);

CREATE INDEX IF NOT EXISTS idx_risk_zones_location ON public.risk_zones_cached USING GIST (CAST(ST_MakePoint(center_lon, center_lat) AS geography));
CREATE INDEX IF NOT EXISTS idx_risk_zones_calculated_at ON public.risk_zones_cached (calculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_official_advisories_published_at ON public.official_advisories (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_official_advisories_category_published_at ON public.official_advisories (category, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_official_advisories_validity ON public.official_advisories (starts_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_official_advisories_location ON public.official_advisories USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_risk_zones_gen_loc ON public.risk_zones USING GIST (CAST(ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326) AS geography));
CREATE INDEX IF NOT EXISTS idx_risk_zones_status_active ON public.risk_zones (status, active_until DESC);
CREATE INDEX IF NOT EXISTS idx_risk_zones_level_score ON public.risk_zones (level, score DESC);

CREATE INDEX IF NOT EXISTS idx_official_advisory_translations_advisory ON public.official_advisory_translations (advisory_id);
CREATE INDEX IF NOT EXISTS idx_official_advisory_translations_lang ON public.official_advisory_translations (language_code);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_enabled ON public.push_tokens (user_id, enabled);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_pending ON public.notification_outbox (status, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_push_token ON public.notification_outbox (push_token_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_citizen_points_user ON public.citizen_points(user_id);
CREATE INDEX IF NOT EXISTS idx_citizen_points_created ON public.citizen_points(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_citizen_badges_user ON public.citizen_badges(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_report_id ON public.report_status_audit(report_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON public.report_status_audit(changed_at DESC);


-- ============================================
-- 3. FUNCTIONS & TRIGGERS
-- ============================================

-- Base function for RLS checks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_roles r
    WHERE r.user_id = auth.uid() AND r.role = 'admin'
  );
$$;

-- RLS Enforcement
ALTER TABLE public.app_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own role" ON public.app_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role manages roles" ON public.app_roles FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.hazard_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own reports" ON public.hazard_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own reports" ON public.hazard_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own reports" ON public.hazard_reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all reports" ON public.hazard_reports FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can update any report" ON public.hazard_reports FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.zone_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read zone settings" ON public.zone_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update zone settings" ON public.zone_settings FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.risk_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read verified active zones" ON public.risk_zones FOR SELECT TO authenticated USING (status = 'verified' AND active_until >= NOW());
CREATE POLICY "Admins read all zones" ON public.risk_zones FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins update zones" ON public.risk_zones FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.official_advisories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read advisories" ON public.official_advisories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated can publish advisories" ON public.official_advisories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete advisories" ON public.official_advisories FOR DELETE TO authenticated USING (public.is_admin());

ALTER TABLE public.official_advisory_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read advisory translations" ON public.official_advisory_translations FOR SELECT TO authenticated USING (public.is_admin());

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own push tokens" ON public.push_tokens FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct access" ON public.notification_outbox FOR ALL USING (false) WITH CHECK (false);

ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view badge definitions" ON public.badge_definitions FOR SELECT USING (true);

ALTER TABLE public.citizen_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own points" ON public.citizen_points FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.citizen_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own badges" ON public.citizen_badges FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.report_status_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON public.report_status_audit FOR SELECT USING (public.is_admin());

ALTER TABLE public.monitoring_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read monitoring zones" ON public.monitoring_zones FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins insert monitoring zones" ON public.monitoring_zones FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins update monitoring zones" ON public.monitoring_zones FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins delete monitoring zones" ON public.monitoring_zones FOR DELETE TO authenticated USING (public.is_admin());


-- Timestamp trigger logic
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_risk_zones_updated_at BEFORE UPDATE ON public.risk_zones FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_zone_settings_updated_at BEFORE UPDATE ON public.zone_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Map and report functionalities
CREATE OR REPLACE FUNCTION public.get_verified_reports_in_bounds(
  min_lat DOUBLE PRECISION, max_lat DOUBLE PRECISION, min_lon DOUBLE PRECISION, max_lon DOUBLE PRECISION, requested_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID, hazard_type TEXT, urgency_level TEXT, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
  is_high_risk BOOLEAN, description TEXT, media_urls TEXT[], event_time TIMESTAMPTZ, created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY SELECT r.id, r.hazard_type, COALESCE(r.urgency_level, 'Low') as urgency_level,
    ROUND(r.latitude::numeric, 3)::double precision as latitude, ROUND(r.longitude::numeric, 3)::double precision as longitude,
    r.is_high_risk, r.description,
    CASE WHEN COALESCE(r.upload_complete, false) THEN COALESCE(r.media_urls, ARRAY[]::text[]) ELSE ARRAY[]::text[] END as media_urls,
    r.event_time, r.created_at
  FROM public.hazard_reports r
  WHERE r.status = 'verified' AND r.latitude BETWEEN min_lat AND max_lat AND r.longitude BETWEEN min_lon AND max_lon
  ORDER BY r.created_at DESC LIMIT LEAST(requested_limit, 200);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.get_cached_risk_zones(
  min_lat DOUBLE PRECISION, max_lat DOUBLE PRECISION, min_lon DOUBLE PRECISION, max_lon DOUBLE PRECISION
)
RETURNS TABLE (
  center_lat DOUBLE PRECISION, center_lon DOUBLE PRECISION, radius_meters DOUBLE PRECISION,
  intensity TEXT, report_count INTEGER, intensity_score DOUBLE PRECISION, calculated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY SELECT
    rz.center_lat, rz.center_lon, rz.radius_meters,
    CASE rz.level WHEN 'high_risk' THEN 'high' WHEN 'caution' THEN 'medium' ELSE 'low' END AS intensity,
    rz.report_count, rz.score AS intensity_score, rz.calculated_at
  FROM public.risk_zones rz
  WHERE rz.status = 'verified' AND rz.active_until >= NOW()
    AND rz.center_lat BETWEEN min_lat AND max_lat AND rz.center_lon BETWEEN min_lon AND max_lon
  ORDER BY rz.score DESC LIMIT 100;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.calculate_risk_zones_on_demand(
  p_center_lat DOUBLE PRECISION, p_center_lon DOUBLE PRECISION, zoom_level INTEGER
)
RETURNS TABLE (
  center_lat DOUBLE PRECISION, center_lon DOUBLE PRECISION, radius_meters DOUBLE PRECISION,
  intensity TEXT, report_count INTEGER, intensity_score DOUBLE PRECISION
) AS $$
DECLARE
  search_radius_km DOUBLE PRECISION;
  cluster_distance_meters DOUBLE PRECISION;
BEGIN
  search_radius_km := CASE WHEN zoom_level BETWEEN 10 AND 12 THEN 10.0 WHEN zoom_level BETWEEN 13 AND 15 THEN 5.0 WHEN zoom_level BETWEEN 16 AND 18 THEN 2.0 ELSE 5.0 END;
  cluster_distance_meters := (search_radius_km * 1000.0) / 4.0;
  RETURN QUERY WITH nearby_reports AS (
    SELECT r.latitude, r.longitude, r.urgency_level, r.location FROM public.hazard_reports r
    WHERE r.status = 'verified' AND ST_DWithin(r.location, ST_SetSRID(ST_MakePoint(p_center_lon, p_center_lat), 4326)::geography, search_radius_km * 1000)
  ), clustered AS (
    SELECT latitude, longitude, urgency_level, ST_ClusterDBSCAN(location::geometry, eps := cluster_distance_meters, minpoints := 3) OVER () as cluster_id FROM nearby_reports
  ), zone_stats AS (
    SELECT cluster_id, AVG(latitude) as avg_lat, AVG(longitude) as avg_lon, COUNT(*) as report_count,
      COUNT(*) FILTER (WHERE urgency_level = 'High') as high_count, COUNT(*) FILTER (WHERE urgency_level = 'Medium') as medium_count, COUNT(*) FILTER (WHERE urgency_level = 'Low') as low_count,
      MAX(ST_Distance(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography, ST_SetSRID(ST_MakePoint(AVG(longitude), AVG(latitude)), 4326)::geography)) as max_distance_m
    FROM clustered WHERE cluster_id IS NOT NULL GROUP BY cluster_id HAVING COUNT(*) >= 3
  )
  SELECT z.avg_lat::double precision, z.avg_lon::double precision, GREATEST(z.max_distance_m, 100.0)::double precision as radius_meters,
    CASE WHEN ((z.high_count * 3 + z.medium_count * 2 + z.low_count * 1) * (z.report_count::float / (3.14159 * POWER(GREATEST(z.max_distance_m, 100.0) / 1000.0, 2)))) >= 25.0 THEN 'high'
         WHEN ((z.high_count * 3 + z.medium_count * 2 + z.low_count * 1) * (z.report_count::float / (3.14159 * POWER(GREATEST(z.max_distance_m, 100.0) / 1000.0, 2)))) >= 10.0 THEN 'medium'
         ELSE 'low' END as intensity,
    z.report_count::integer,
    ((z.high_count * 3 + z.medium_count * 2 + z.low_count * 1) * (z.report_count::float / (3.14159 * POWER(GREATEST(z.max_distance_m, 100.0) / 1000.0, 2))))::double precision as intensity_score
  FROM zone_stats z ORDER BY intensity_score DESC LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.get_user_reports_on_map(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  id UUID, hazard_type TEXT, urgency_level TEXT, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
  is_high_risk BOOLEAN, status TEXT, event_time TIMESTAMPTZ, created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF auth.uid() != user_uuid THEN RAISE EXCEPTION 'Unauthorized: Can only view own reports'; END IF;
  RETURN QUERY SELECT r.id, r.hazard_type, COALESCE(r.urgency_level, 'Low') as urgency_level, r.latitude, r.longitude, r.is_high_risk, r.status, r.event_time, r.created_at
  FROM hazard_reports r WHERE r.user_id = user_uuid AND r.created_at >= NOW() - (days_back || ' days')::INTERVAL ORDER BY r.created_at DESC LIMIT 200;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.get_verified_report_details(report_uuid UUID)
RETURNS TABLE (
  id UUID, hazard_type TEXT, urgency_level TEXT, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
  is_high_risk BOOLEAN, status TEXT, description TEXT, media_urls TEXT[], event_time TIMESTAMPTZ, created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY SELECT r.id, r.hazard_type, COALESCE(r.urgency_level, 'Low') as urgency_level, ROUND(r.latitude::numeric, 3)::double precision as latitude,
    ROUND(r.longitude::numeric, 3)::double precision as longitude, r.is_high_risk, r.status, r.description, r.media_urls, r.event_time, r.created_at
  FROM hazard_reports r WHERE r.id = report_uuid AND r.status = 'verified' LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.create_hazard_report(
  p_client_id uuid, p_user_phone text, p_user_name text, p_hazard_type text, p_description text,
  p_latitude double precision, p_longitude double precision, p_is_high_risk boolean DEFAULT false,
  p_people_at_risk integer DEFAULT null, p_urgency_level text DEFAULT null,
  p_immediate_danger_status text DEFAULT 'no', p_affected_people_band text DEFAULT null,
  p_event_time timestamptz DEFAULT now(), p_device_id text DEFAULT null
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_user_id uuid; v_existing_id uuid; v_recent_count integer; v_last_created timestamptz;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001'; END IF;
  SELECT id INTO v_existing_id FROM public.hazard_reports WHERE user_id = v_user_id AND hazard_type = p_hazard_type AND created_at > now() - interval '10 minutes' AND ST_DWithin(location, ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography, 50) ORDER BY created_at DESC LIMIT 1;
  IF v_existing_id IS NOT NULL THEN RETURN v_existing_id; END IF;
  SELECT created_at INTO v_last_created FROM public.hazard_reports WHERE user_id = v_user_id ORDER BY created_at DESC LIMIT 1;
  IF v_last_created IS NOT NULL AND v_last_created > now() - interval '30 seconds' THEN RAISE EXCEPTION 'rate_limited_min_interval' USING ERRCODE = 'P0001'; END IF;
  SELECT count(*)::int INTO v_recent_count FROM public.hazard_reports WHERE user_id = v_user_id AND created_at > now() - interval '1 hour';
  IF v_recent_count >= 20 THEN RAISE EXCEPTION 'rate_limited_hourly' USING ERRCODE = 'P0001'; END IF;

  INSERT INTO public.hazard_reports(client_id, user_id, user_phone, user_name, hazard_type, description, location, latitude, longitude, is_high_risk, people_at_risk, urgency_level, immediate_danger_status, affected_people_band, status, event_time, device_id)
  VALUES (
    p_client_id,
    v_user_id,
    p_user_phone,
    NULLIF(p_user_name, ''),
    p_hazard_type,
    p_description,
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
    p_latitude,
    p_longitude,
    COALESCE(p_is_high_risk, false),
    p_people_at_risk,
    p_urgency_level,
    COALESCE(NULLIF(p_immediate_danger_status, ''), 'no'),
    CASE
      WHEN COALESCE(NULLIF(p_immediate_danger_status, ''), 'no') = 'yes'
        THEN COALESCE(NULLIF(p_affected_people_band, ''), 'unknown')
      ELSE NULL
    END,
    'pending',
    COALESCE(p_event_time, now()),
    p_device_id
  ) RETURNING id INTO v_existing_id;
  RETURN v_existing_id;
END;
$$;


CREATE OR REPLACE FUNCTION public.enqueue_report_status_push() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_new_status text; v_old_status text; v_title text; v_body text;
BEGIN
  v_new_status := coalesce(NEW.status, '');
  v_old_status := coalesce(OLD.status, '');
  IF v_new_status = v_old_status THEN RETURN NEW; END IF;
  v_title := 'Report update';
  v_body := coalesce(NEW.hazard_type, 'Report') || ' is now ' || upper(v_new_status);
  INSERT INTO public.notification_outbox(user_id, type, title, body, data) VALUES (NEW.user_id, 'report_status', v_title, v_body, jsonb_build_object('report_id', NEW.id, 'status', v_new_status));
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_hazard_reports_status_push AFTER UPDATE OF status ON public.hazard_reports FOR EACH ROW EXECUTE FUNCTION public.enqueue_report_status_push();


CREATE OR REPLACE FUNCTION public.log_report_status_change() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_admin_email TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_admin_email := current_setting('request.jwt.claims', true)::json->>'email';
    IF v_admin_email IS NULL THEN v_admin_email := 'system/unknown'; END IF;
    INSERT INTO public.report_status_audit (report_id, admin_id, admin_email, old_status, new_status) VALUES (NEW.id, auth.uid(), v_admin_email, COALESCE(OLD.status, 'pending'), NEW.status);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trigger_log_report_status_change AFTER UPDATE OF status ON public.hazard_reports FOR EACH ROW EXECUTE FUNCTION public.log_report_status_change();


-- Gamification Triggers
CREATE OR REPLACE FUNCTION public.fn_check_and_award_badges(p_user_id UUID) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE _total_reports INT; _verified_count INT; _media_count INT; _total_points INT; _today_count INT;
BEGIN
    SELECT COUNT(*) INTO _total_reports FROM public.hazard_reports WHERE user_id = p_user_id;
    SELECT COUNT(*) INTO _verified_count FROM public.hazard_reports WHERE user_id = p_user_id AND status = 'verified';
    SELECT COUNT(*) INTO _media_count FROM public.hazard_reports WHERE user_id = p_user_id AND media_urls IS NOT NULL AND array_length(media_urls, 1) > 0;
    SELECT COALESCE(SUM(points), 0) INTO _total_points FROM public.citizen_points WHERE user_id = p_user_id;
    SELECT COUNT(*) INTO _today_count FROM public.hazard_reports WHERE user_id = p_user_id AND created_at >= (NOW() - INTERVAL '24 hours');

    IF _total_reports >= 1 THEN INSERT INTO public.citizen_badges (user_id, badge_id) VALUES (p_user_id, 'first_wave') ON CONFLICT DO NOTHING; END IF;
    IF _total_reports >= 10 THEN INSERT INTO public.citizen_badges (user_id, badge_id) VALUES (p_user_id, 'active_sensor') ON CONFLICT DO NOTHING; END IF;
    IF _verified_count >= 5 THEN INSERT INTO public.citizen_badges (user_id, badge_id) VALUES (p_user_id, 'verified_guardian') ON CONFLICT DO NOTHING; END IF;
    IF _media_count >= 10 THEN INSERT INTO public.citizen_badges (user_id, badge_id) VALUES (p_user_id, 'evidence_collector') ON CONFLICT DO NOTHING; END IF;
    IF _today_count >= 3 THEN INSERT INTO public.citizen_badges (user_id, badge_id) VALUES (p_user_id, 'rapid_responder') ON CONFLICT DO NOTHING; END IF;
    IF _total_points >= 500 THEN INSERT INTO public.citizen_badges (user_id, badge_id) VALUES (p_user_id, 'community_champion') ON CONFLICT DO NOTHING; END IF;
    IF _total_points >= 1000 THEN INSERT INTO public.citizen_badges (user_id, badge_id) VALUES (p_user_id, 'elite_reporter') ON CONFLICT DO NOTHING; END IF;
    IF _total_reports >= 10 AND (_verified_count::FLOAT / _total_reports) >= 0.8 THEN INSERT INTO public.citizen_badges (user_id, badge_id) VALUES (p_user_id, 'precision_scout') ON CONFLICT DO NOTHING; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_gamification_on_insert() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE _points INT := 10; _has_media BOOLEAN;
BEGIN
    _has_media := (NEW.media_urls IS NOT NULL AND array_length(NEW.media_urls, 1) > 0);
    IF _has_media THEN _points := _points + 5; END IF;
    INSERT INTO public.citizen_points (user_id, report_id, points, reason) VALUES (NEW.user_id, NEW.id, _points, 'report_submitted');
    PERFORM public.fn_check_and_award_badges(NEW.user_id);
    RETURN NEW;
END;
$$;
CREATE TRIGGER trg_gamification_insert AFTER INSERT ON public.hazard_reports FOR EACH ROW EXECUTE FUNCTION public.fn_gamification_on_insert();

CREATE OR REPLACE FUNCTION public.fn_gamification_on_status_change() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE _points INT := 0; _reason TEXT;
BEGIN
    IF OLD.status = NEW.status THEN RETURN NEW; END IF;
    IF NEW.status = 'verified' AND OLD.status = 'pending' THEN
        _points := 25; _reason := 'report_verified';
        IF NEW.is_high_risk THEN _points := _points + 15; _reason := 'high_risk_verified'; END IF;
    ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
        _points := -5; _reason := 'report_rejected';
    END IF;

    IF _points != 0 THEN INSERT INTO public.citizen_points (user_id, report_id, points, reason) VALUES (NEW.user_id, NEW.id, _points, _reason); END IF;
    PERFORM public.fn_check_and_award_badges(NEW.user_id);
    RETURN NEW;
END;
$$;
CREATE TRIGGER trg_gamification_status AFTER UPDATE ON public.hazard_reports FOR EACH ROW EXECUTE FUNCTION public.fn_gamification_on_status_change();


-- Assign Permissions and finalize
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_verified_reports_in_bounds(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_cached_risk_zones(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.calculate_risk_zones_on_demand TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_reports_on_map TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_verified_report_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_hazard_report TO authenticated;

-- Storage
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) VALUES ('hazard-media', 'hazard-media', true) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "hazard media: insert own" ON storage.objects;
  DROP POLICY IF EXISTS "hazard media: update own" ON storage.objects;
  DROP POLICY IF EXISTS "hazard media: select own" ON storage.objects;
  DROP POLICY IF EXISTS "hazard media: delete own" ON storage.objects;
  CREATE POLICY "hazard media: insert own" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'hazard-media' AND name LIKE (auth.uid()::text || '/%'));
  CREATE POLICY "hazard media: update own" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'hazard-media' AND name LIKE (auth.uid()::text || '/%')) WITH CHECK (bucket_id = 'hazard-media' AND name LIKE (auth.uid()::text || '/%'));
  CREATE POLICY "hazard media: select own" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'hazard-media' AND name LIKE (auth.uid()::text || '/%'));
  CREATE POLICY "hazard media: delete own" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'hazard-media' AND name LIKE (auth.uid()::text || '/%'));
EXCEPTION
  WHEN insufficient_privilege THEN RAISE NOTICE 'Skipping storage SQL.';
  WHEN undefined_table THEN RAISE NOTICE 'Skipping storage SQL.';
END
$$;

-- ============================================================================
-- BEGIN MIGRATION: 027_mobile_monitoring_zone_read.sql
-- ============================================================================

ALTER TABLE public.monitoring_zones ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.monitoring_zones TO authenticated;

DROP POLICY IF EXISTS "Authenticated read monitoring zones" ON public.monitoring_zones;
CREATE POLICY "Authenticated read monitoring zones"
  ON public.monitoring_zones
  FOR SELECT
  TO authenticated
  USING (true);

-- END MIGRATION: 027_mobile_monitoring_zone_read.sql

-- ============================================================================
-- BEGIN MIGRATION: 029_monitoring_zone_description.sql
-- ============================================================================

ALTER TABLE public.monitoring_zones
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';

-- END MIGRATION: 029_monitoring_zone_description.sql

-- ============================================================================
-- BEGIN MIGRATION: 028_monitoring_zone_entry_exit_detection.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.device_zone_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES public.monitoring_zones(id) ON DELETE CASCADE,
  is_inside BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_transition_at TIMESTAMPTZ,
  last_latitude DOUBLE PRECISION,
  last_longitude DOUBLE PRECISION,
  source TEXT NOT NULL DEFAULT 'foreground' CHECK (source IN ('foreground', 'background')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (device_id, zone_id)
);

CREATE TABLE IF NOT EXISTS public.zone_transition_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES public.monitoring_zones(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('entered', 'exited')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('foreground', 'background')),
  notification_outbox_id UUID REFERENCES public.notification_outbox(id) ON DELETE SET NULL,
  delivery_status TEXT NOT NULL DEFAULT 'queued' CHECK (delivery_status IN ('queued', 'sent', 'failed', 'skipped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_zone_presence_zone_active
  ON public.device_zone_presence (zone_id, is_inside, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_zone_presence_device
  ON public.device_zone_presence (device_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_zone_presence_user
  ON public.device_zone_presence (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_zone_transition_events_zone_time
  ON public.zone_transition_events (zone_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_zone_transition_events_user_time
  ON public.zone_transition_events (user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_zone_transition_events_device_time
  ON public.zone_transition_events (device_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_zone_transition_events_delivery
  ON public.zone_transition_events (delivery_status, occurred_at DESC);

ALTER TABLE public.device_zone_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_transition_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct device zone presence access" ON public.device_zone_presence;
CREATE POLICY "No direct device zone presence access"
  ON public.device_zone_presence FOR ALL
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Admins read zone transition events" ON public.zone_transition_events;
CREATE POLICY "Admins read zone transition events"
  ON public.zone_transition_events FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "No direct zone transition event writes" ON public.zone_transition_events;
CREATE POLICY "No direct zone transition event writes"
  ON public.zone_transition_events FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS trg_device_zone_presence_updated_at ON public.device_zone_presence;
CREATE TRIGGER trg_device_zone_presence_updated_at
  BEFORE UPDATE ON public.device_zone_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.refresh_monitoring_zone_people_counts(
  p_zone_ids UUID[] DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.monitoring_zones AS mz
  SET people_count = COALESCE(src.people_count, 0)
  FROM (
    SELECT zone_id, COUNT(DISTINCT device_id)::INTEGER AS people_count
    FROM public.device_zone_presence
    WHERE is_inside = true
      AND last_seen_at >= NOW() - INTERVAL '30 minutes'
      AND (p_zone_ids IS NULL OR zone_id = ANY(p_zone_ids))
    GROUP BY zone_id
  ) AS src
  WHERE mz.id = src.zone_id;

  UPDATE public.monitoring_zones AS mz
  SET people_count = 0
  WHERE (p_zone_ids IS NULL OR mz.id = ANY(p_zone_ids))
    AND NOT EXISTS (
      SELECT 1
      FROM public.device_zone_presence AS dzp
      WHERE dzp.zone_id = mz.id
        AND dzp.is_inside = true
        AND dzp.last_seen_at >= NOW() - INTERVAL '30 minutes'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_monitoring_zones()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  shape TEXT,
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION,
  polygon_points JSONB,
  people_count INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin_only' USING ERRCODE = '42501';
  END IF;

  BEGIN
    PERFORM public.refresh_monitoring_zone_people_counts(NULL);
  EXCEPTION
    WHEN SQLSTATE '25006' THEN
      NULL;
  END;

  RETURN QUERY
  SELECT
    mz.id,
    mz.name,
    mz.description,
    mz.shape,
    mz.center_lat,
    mz.center_lng,
    mz.radius_meters,
    mz.polygon_points,
    mz.people_count,
    mz.created_at
  FROM public.monitoring_zones AS mz
  ORDER BY mz.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_zone_transition_events(
  p_limit INTEGER DEFAULT 50,
  p_zone_id UUID DEFAULT NULL,
  p_event_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  zone_id UUID,
  zone_name TEXT,
  user_id UUID,
  device_id TEXT,
  event_type TEXT,
  occurred_at TIMESTAMPTZ,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  source TEXT,
  delivery_status TEXT,
  notification_outbox_id UUID
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin_only' USING ERRCODE = '42501';
  END IF;

  BEGIN
    PERFORM public.refresh_monitoring_zone_people_counts(NULL);
  EXCEPTION
    WHEN SQLSTATE '25006' THEN
      NULL;
  END;

  RETURN QUERY
  SELECT
    zte.id,
    zte.zone_id,
    mz.name AS zone_name,
    zte.user_id,
    zte.device_id,
    zte.event_type,
    zte.occurred_at,
    zte.latitude,
    zte.longitude,
    zte.source,
    zte.delivery_status,
    zte.notification_outbox_id
  FROM public.zone_transition_events AS zte
  JOIN public.monitoring_zones AS mz ON mz.id = zte.zone_id
  WHERE (p_zone_id IS NULL OR zte.zone_id = p_zone_id)
    AND (p_event_type IS NULL OR zte.event_type = p_event_type)
  ORDER BY zte.occurred_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200));
END;
$$;

CREATE OR REPLACE FUNCTION public.process_zone_heartbeat_state(
  p_device_id TEXT,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_accuracy_meters DOUBLE PRECISION DEFAULT NULL,
  p_observed_at TIMESTAMPTZ DEFAULT NOW(),
  p_source TEXT DEFAULT 'foreground',
  p_inside_zone_ids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS TABLE (
  event_id UUID,
  zone_id UUID,
  zone_name TEXT,
  event_type TEXT,
  occurred_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_now TIMESTAMPTZ := COALESCE(p_observed_at, NOW());
  v_zone_id UUID;
  v_zone_name TEXT;
  v_last_transition_at TIMESTAMPTZ;
  v_was_inside BOOLEAN;
  v_event_id UUID;
  v_changed_zone_ids UUID[] := ARRAY[]::UUID[];
  v_zone_row RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '28000';
  END IF;

  IF p_device_id IS NULL OR btrim(p_device_id) = '' THEN
    RAISE EXCEPTION 'device_id_required' USING ERRCODE = '22023';
  END IF;

  IF p_source NOT IN ('foreground', 'background') THEN
    RAISE EXCEPTION 'invalid_source' USING ERRCODE = '22023';
  END IF;

  p_inside_zone_ids := COALESCE(
    ARRAY(
      SELECT DISTINCT inside_zone_id
      FROM unnest(COALESCE(p_inside_zone_ids, ARRAY[]::UUID[])) AS inside_zone_id
      WHERE inside_zone_id IS NOT NULL
    ),
    ARRAY[]::UUID[]
  );

  FOREACH v_zone_id IN ARRAY p_inside_zone_ids LOOP
    SELECT mz.name INTO v_zone_name
    FROM public.monitoring_zones AS mz
    WHERE mz.id = v_zone_id;

    IF v_zone_name IS NULL THEN
      CONTINUE;
    END IF;

    SELECT dzp.is_inside, dzp.last_transition_at
    INTO v_was_inside, v_last_transition_at
    FROM public.device_zone_presence AS dzp
    WHERE dzp.device_id = p_device_id
      AND dzp.zone_id = v_zone_id
    FOR UPDATE;

    IF NOT FOUND THEN
      v_was_inside := false;
      v_last_transition_at := NULL;

      INSERT INTO public.device_zone_presence (
        device_id,
        user_id,
        zone_id,
        is_inside,
        last_seen_at,
        last_latitude,
        last_longitude,
        source
      )
      VALUES (
        p_device_id,
        v_user_id,
        v_zone_id,
        true,
        v_now,
        p_latitude,
        p_longitude,
        p_source
      );
    ELSE
      UPDATE public.device_zone_presence
      SET user_id = v_user_id,
          is_inside = true,
          last_seen_at = v_now,
          last_latitude = p_latitude,
          last_longitude = p_longitude,
          source = p_source
      WHERE public.device_zone_presence.device_id = p_device_id
        AND public.device_zone_presence.zone_id = v_zone_id;
    END IF;

    v_changed_zone_ids := array_append(v_changed_zone_ids, v_zone_id);

    IF v_was_inside IS DISTINCT FROM true
      AND (v_last_transition_at IS NULL OR v_last_transition_at <= v_now - INTERVAL '5 minutes')
    THEN
      INSERT INTO public.zone_transition_events (
        device_id,
        user_id,
        zone_id,
        event_type,
        occurred_at,
        latitude,
        longitude,
        source,
        delivery_status
      )
      VALUES (
        p_device_id,
        v_user_id,
        v_zone_id,
        'entered',
        v_now,
        p_latitude,
        p_longitude,
        p_source,
        'queued'
      )
      RETURNING id INTO v_event_id;

      UPDATE public.device_zone_presence
      SET last_transition_at = v_now
      WHERE public.device_zone_presence.device_id = p_device_id
        AND public.device_zone_presence.zone_id = v_zone_id;

      event_id := v_event_id;
      zone_id := v_zone_id;
      zone_name := v_zone_name;
      event_type := 'entered';
      occurred_at := v_now;
      RETURN NEXT;
    END IF;
  END LOOP;

  FOR v_zone_row IN
    SELECT dzp.zone_id, dzp.is_inside, dzp.last_transition_at, mz.name
    FROM public.device_zone_presence AS dzp
    JOIN public.monitoring_zones AS mz ON mz.id = dzp.zone_id
    WHERE dzp.device_id = p_device_id
      AND dzp.user_id = v_user_id
      AND NOT (dzp.zone_id = ANY(p_inside_zone_ids))
    FOR UPDATE OF dzp
  LOOP
    UPDATE public.device_zone_presence
    SET is_inside = false,
        last_seen_at = v_now,
        last_latitude = p_latitude,
        last_longitude = p_longitude,
        source = p_source,
        user_id = v_user_id
    WHERE public.device_zone_presence.device_id = p_device_id
      AND public.device_zone_presence.zone_id = v_zone_row.zone_id;

    v_changed_zone_ids := array_append(v_changed_zone_ids, v_zone_row.zone_id);

    IF v_zone_row.is_inside IS TRUE
      AND (v_zone_row.last_transition_at IS NULL OR v_zone_row.last_transition_at <= v_now - INTERVAL '5 minutes')
    THEN
      INSERT INTO public.zone_transition_events (
        device_id,
        user_id,
        zone_id,
        event_type,
        occurred_at,
        latitude,
        longitude,
        source,
        delivery_status
      )
      VALUES (
        p_device_id,
        v_user_id,
        v_zone_row.zone_id,
        'exited',
        v_now,
        p_latitude,
        p_longitude,
        p_source,
        'queued'
      )
      RETURNING id INTO v_event_id;

      UPDATE public.device_zone_presence
      SET last_transition_at = v_now
      WHERE public.device_zone_presence.device_id = p_device_id
        AND public.device_zone_presence.zone_id = v_zone_row.zone_id;

      event_id := v_event_id;
      zone_id := v_zone_row.zone_id;
      zone_name := v_zone_row.name;
      event_type := 'exited';
      occurred_at := v_now;
      RETURN NEXT;
    END IF;
  END LOOP;

  PERFORM public.refresh_monitoring_zone_people_counts(
    COALESCE(
      ARRAY(
        SELECT DISTINCT changed_zone_id
        FROM unnest(COALESCE(v_changed_zone_ids, ARRAY[]::UUID[])) AS changed_zone_id
        WHERE changed_zone_id IS NOT NULL
      ),
      ARRAY[]::UUID[]
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_monitoring_zone_people_counts(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_monitoring_zones() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_zone_transition_events(INTEGER, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_zone_heartbeat_state(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TIMESTAMPTZ, TEXT, UUID[]) TO authenticated;

-- END MIGRATION: 028_monitoring_zone_entry_exit_detection.sql

-- ============================================================================
-- BEGIN MIGRATION: 031_fix_zone_heartbeat_state_ambiguous_zone_id.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_zone_heartbeat_state(
  p_device_id TEXT,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_accuracy_meters DOUBLE PRECISION DEFAULT NULL,
  p_observed_at TIMESTAMPTZ DEFAULT NOW(),
  p_source TEXT DEFAULT 'foreground',
  p_inside_zone_ids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS TABLE (
  event_id UUID,
  zone_id UUID,
  zone_name TEXT,
  event_type TEXT,
  occurred_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_now TIMESTAMPTZ := COALESCE(p_observed_at, NOW());
  v_zone_id UUID;
  v_zone_name TEXT;
  v_last_transition_at TIMESTAMPTZ;
  v_was_inside BOOLEAN;
  v_event_id UUID;
  v_changed_zone_ids UUID[] := ARRAY[]::UUID[];
  v_zone_row RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '28000';
  END IF;

  IF p_device_id IS NULL OR btrim(p_device_id) = '' THEN
    RAISE EXCEPTION 'device_id_required' USING ERRCODE = '22023';
  END IF;

  IF p_source NOT IN ('foreground', 'background') THEN
    RAISE EXCEPTION 'invalid_source' USING ERRCODE = '22023';
  END IF;

  p_inside_zone_ids := COALESCE(
    ARRAY(
      SELECT DISTINCT inside_zone_id
      FROM unnest(COALESCE(p_inside_zone_ids, ARRAY[]::UUID[])) AS inside_zone_id
      WHERE inside_zone_id IS NOT NULL
    ),
    ARRAY[]::UUID[]
  );

  FOREACH v_zone_id IN ARRAY p_inside_zone_ids LOOP
    SELECT mz.name INTO v_zone_name
    FROM public.monitoring_zones AS mz
    WHERE mz.id = v_zone_id;

    IF v_zone_name IS NULL THEN
      CONTINUE;
    END IF;

    SELECT dzp.is_inside, dzp.last_transition_at
    INTO v_was_inside, v_last_transition_at
    FROM public.device_zone_presence AS dzp
    WHERE dzp.device_id = p_device_id
      AND dzp.zone_id = v_zone_id
    FOR UPDATE;

    IF NOT FOUND THEN
      v_was_inside := false;
      v_last_transition_at := NULL;

      INSERT INTO public.device_zone_presence (
        device_id,
        user_id,
        zone_id,
        is_inside,
        last_seen_at,
        last_latitude,
        last_longitude,
        source
      )
      VALUES (
        p_device_id,
        v_user_id,
        v_zone_id,
        true,
        v_now,
        p_latitude,
        p_longitude,
        p_source
      );
    ELSE
      UPDATE public.device_zone_presence
      SET user_id = v_user_id,
          is_inside = true,
          last_seen_at = v_now,
          last_latitude = p_latitude,
          last_longitude = p_longitude,
          source = p_source
      WHERE public.device_zone_presence.device_id = p_device_id
        AND public.device_zone_presence.zone_id = v_zone_id;
    END IF;

    v_changed_zone_ids := array_append(v_changed_zone_ids, v_zone_id);

    IF v_was_inside IS DISTINCT FROM true
      AND (v_last_transition_at IS NULL OR v_last_transition_at <= v_now - INTERVAL '5 minutes')
    THEN
      INSERT INTO public.zone_transition_events (
        device_id,
        user_id,
        zone_id,
        event_type,
        occurred_at,
        latitude,
        longitude,
        source,
        delivery_status
      )
      VALUES (
        p_device_id,
        v_user_id,
        v_zone_id,
        'entered',
        v_now,
        p_latitude,
        p_longitude,
        p_source,
        'queued'
      )
      RETURNING id INTO v_event_id;

      UPDATE public.device_zone_presence
      SET last_transition_at = v_now
      WHERE public.device_zone_presence.device_id = p_device_id
        AND public.device_zone_presence.zone_id = v_zone_id;

      event_id := v_event_id;
      zone_id := v_zone_id;
      zone_name := v_zone_name;
      event_type := 'entered';
      occurred_at := v_now;
      RETURN NEXT;
    END IF;
  END LOOP;

  FOR v_zone_row IN
    SELECT dzp.zone_id, dzp.is_inside, dzp.last_transition_at, mz.name
    FROM public.device_zone_presence AS dzp
    JOIN public.monitoring_zones AS mz ON mz.id = dzp.zone_id
    WHERE dzp.device_id = p_device_id
      AND dzp.user_id = v_user_id
      AND NOT (dzp.zone_id = ANY(p_inside_zone_ids))
    FOR UPDATE OF dzp
  LOOP
    UPDATE public.device_zone_presence
    SET is_inside = false,
        last_seen_at = v_now,
        last_latitude = p_latitude,
        last_longitude = p_longitude,
        source = p_source,
        user_id = v_user_id
    WHERE public.device_zone_presence.device_id = p_device_id
      AND public.device_zone_presence.zone_id = v_zone_row.zone_id;

    v_changed_zone_ids := array_append(v_changed_zone_ids, v_zone_row.zone_id);

    IF v_zone_row.is_inside IS TRUE
      AND (v_zone_row.last_transition_at IS NULL OR v_zone_row.last_transition_at <= v_now - INTERVAL '5 minutes')
    THEN
      INSERT INTO public.zone_transition_events (
        device_id,
        user_id,
        zone_id,
        event_type,
        occurred_at,
        latitude,
        longitude,
        source,
        delivery_status
      )
      VALUES (
        p_device_id,
        v_user_id,
        v_zone_row.zone_id,
        'exited',
        v_now,
        p_latitude,
        p_longitude,
        p_source,
        'queued'
      )
      RETURNING id INTO v_event_id;

      UPDATE public.device_zone_presence
      SET last_transition_at = v_now
      WHERE public.device_zone_presence.device_id = p_device_id
        AND public.device_zone_presence.zone_id = v_zone_row.zone_id;

      event_id := v_event_id;
      zone_id := v_zone_row.zone_id;
      zone_name := v_zone_row.name;
      event_type := 'exited';
      occurred_at := v_now;
      RETURN NEXT;
    END IF;
  END LOOP;

  PERFORM public.refresh_monitoring_zone_people_counts(
    COALESCE(
      ARRAY(
        SELECT DISTINCT changed_zone_id
        FROM unnest(COALESCE(v_changed_zone_ids, ARRAY[]::UUID[])) AS changed_zone_id
        WHERE changed_zone_id IS NOT NULL
      ),
      ARRAY[]::UUID[]
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_zone_heartbeat_state(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TIMESTAMPTZ, TEXT, UUID[]) TO authenticated;

-- END MIGRATION: 031_fix_zone_heartbeat_state_ambiguous_zone_id.sql

-- ============================================================================
-- BEGIN MIGRATION: 030_admin_live_presence.sql
-- ============================================================================

ALTER TABLE public.push_tokens
  ADD COLUMN IF NOT EXISTS zone_monitoring_opt_in BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.admin_feature_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_code TEXT NOT NULL,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, permission_code)
);

CREATE TABLE IF NOT EXISTS public.device_location_heartbeats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy_meters DOUBLE PRECISION,
  source TEXT NOT NULL CHECK (source IN ('foreground', 'background')),
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  zone_monitoring_opt_in_snapshot BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.live_location_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  incident_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'expired')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.live_location_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  session_id UUID REFERENCES public.live_location_sessions(id) ON DELETE SET NULL,
  incident_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_feature_permissions_lookup
  ON public.admin_feature_permissions (user_id, permission_code);
CREATE INDEX IF NOT EXISTS idx_device_location_heartbeats_recent
  ON public.device_location_heartbeats (observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_location_heartbeats_device_time
  ON public.device_location_heartbeats (device_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_location_heartbeats_user_time
  ON public.device_location_heartbeats (user_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_location_heartbeats_opt_in_recent
  ON public.device_location_heartbeats (zone_monitoring_opt_in_snapshot, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_location_sessions_status_expiry
  ON public.live_location_sessions (status, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_location_audit_logs_time
  ON public.live_location_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_location_audit_logs_actor
  ON public.live_location_audit_logs (actor_user_id, created_at DESC);

ALTER TABLE public.admin_feature_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_location_heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_location_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_location_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage feature permissions" ON public.admin_feature_permissions;
CREATE POLICY "Admins manage feature permissions"
  ON public.admin_feature_permissions FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "No direct heartbeat access" ON public.device_location_heartbeats;
CREATE POLICY "No direct heartbeat access"
  ON public.device_location_heartbeats FOR ALL
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Admins read live location sessions" ON public.live_location_sessions;
CREATE POLICY "Admins read live location sessions"
  ON public.live_location_sessions FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "No direct live location session writes" ON public.live_location_sessions;
CREATE POLICY "No direct live location session writes"
  ON public.live_location_sessions FOR INSERT TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "Admins read live location audit logs" ON public.live_location_audit_logs;
CREATE POLICY "Admins read live location audit logs"
  ON public.live_location_audit_logs FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "No direct live location audit writes" ON public.live_location_audit_logs;
CREATE POLICY "No direct live location audit writes"
  ON public.live_location_audit_logs FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.has_admin_permission(p_permission_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    public.is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.admin_feature_permissions AS afp
      WHERE afp.user_id = auth.uid()
        AND afp.permission_code = p_permission_code
    );
$$;

CREATE OR REPLACE FUNCTION public.expire_live_location_sessions()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.live_location_sessions
  SET
    status = 'expired',
    ended_at = COALESCE(ended_at, NOW())
  WHERE status = 'active'
    AND expires_at <= NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_live_location_data()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.expire_live_location_sessions();

  DELETE FROM public.device_location_heartbeats
  WHERE observed_at < NOW() - INTERVAL '24 hours';

  DELETE FROM public.live_location_sessions
  WHERE status IN ('ended', 'expired')
    AND COALESCE(ended_at, expires_at) < NOW() - INTERVAL '30 days';

  DELETE FROM public.live_location_audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_live_presence_anonymized(
  p_min_lat DOUBLE PRECISION DEFAULT NULL,
  p_max_lat DOUBLE PRECISION DEFAULT NULL,
  p_min_lon DOUBLE PRECISION DEFAULT NULL,
  p_max_lon DOUBLE PRECISION DEFAULT NULL,
  p_zoom INTEGER DEFAULT 10,
  p_minutes INTEGER DEFAULT 15
)
RETURNS TABLE (
  cell_key TEXT,
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  people_count INTEGER,
  latest_observed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_minutes INTEGER := GREATEST(1, LEAST(COALESCE(p_minutes, 15), 60));
  v_zoom INTEGER := GREATEST(1, LEAST(COALESCE(p_zoom, 10), 20));
  v_grid_size DOUBLE PRECISION;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin_only' USING ERRCODE = '42501';
  END IF;

  v_grid_size := CASE
    WHEN v_zoom >= 14 THEN 0.0025
    WHEN v_zoom >= 12 THEN 0.005
    WHEN v_zoom >= 10 THEN 0.01
    WHEN v_zoom >= 8 THEN 0.02
    ELSE 0.05
  END;

  RETURN QUERY
  WITH latest_points AS (
    SELECT DISTINCT ON (dlh.device_id)
      dlh.device_id,
      dlh.latitude,
      dlh.longitude,
      dlh.observed_at
    FROM public.device_location_heartbeats AS dlh
    WHERE dlh.zone_monitoring_opt_in_snapshot = true
      AND dlh.observed_at >= NOW() - make_interval(mins => v_minutes)
      AND (p_min_lat IS NULL OR dlh.latitude >= p_min_lat)
      AND (p_max_lat IS NULL OR dlh.latitude <= p_max_lat)
      AND (p_min_lon IS NULL OR dlh.longitude >= p_min_lon)
      AND (p_max_lon IS NULL OR dlh.longitude <= p_max_lon)
    ORDER BY dlh.device_id, dlh.observed_at DESC
  ),
  bucketed AS (
    SELECT
      floor(latitude / v_grid_size) * v_grid_size AS lat_bucket,
      floor(longitude / v_grid_size) * v_grid_size AS lon_bucket,
      AVG(latitude)::DOUBLE PRECISION AS avg_lat,
      AVG(longitude)::DOUBLE PRECISION AS avg_lng,
      COUNT(*)::INTEGER AS total_people,
      MAX(observed_at) AS max_observed_at
    FROM latest_points
    GROUP BY 1, 2
  )
  SELECT
    md5(lat_bucket::TEXT || ':' || lon_bucket::TEXT) AS cell_key,
    avg_lat AS center_lat,
    avg_lng AS center_lng,
    total_people AS people_count,
    max_observed_at AS latest_observed_at
  FROM bucketed
  ORDER BY total_people DESC, max_observed_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_active_live_location_session()
RETURNS TABLE (
  id UUID,
  started_by UUID,
  incident_id TEXT,
  reason TEXT,
  status TEXT,
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin_only' USING ERRCODE = '42501';
  END IF;

  PERFORM public.expire_live_location_sessions();

  RETURN QUERY
  SELECT
    lls.id,
    lls.started_by,
    lls.incident_id,
    lls.reason,
    lls.status,
    lls.started_at,
    lls.expires_at,
    lls.ended_at
  FROM public.live_location_sessions AS lls
  WHERE lls.status = 'active'
    AND lls.expires_at > NOW()
  ORDER BY lls.started_at DESC
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_start_live_location_session(
  p_incident_id TEXT,
  p_reason TEXT
)
RETURNS TABLE (
  id UUID,
  started_by UUID,
  incident_id TEXT,
  reason TEXT,
  status TEXT,
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  IF NOT public.has_admin_permission('live_location_exact_view') THEN
    RAISE EXCEPTION 'exact_location_permission_required' USING ERRCODE = '42501';
  END IF;

  IF COALESCE(btrim(p_incident_id), '') = '' THEN
    RAISE EXCEPTION 'incident_id_required' USING ERRCODE = '22023';
  END IF;

  IF COALESCE(btrim(p_reason), '') = '' THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE = '22023';
  END IF;

  PERFORM public.expire_live_location_sessions();

  INSERT INTO public.live_location_sessions (
    started_by,
    incident_id,
    reason,
    status,
    started_at,
    expires_at
  )
  VALUES (
    v_user_id,
    btrim(p_incident_id),
    btrim(p_reason),
    'active',
    NOW(),
    NOW() + INTERVAL '30 minutes'
  )
  RETURNING live_location_sessions.id INTO v_session_id;

  INSERT INTO public.live_location_audit_logs (
    actor_user_id,
    action,
    session_id,
    incident_id,
    details
  )
  VALUES (
    v_user_id,
    'session_started',
    v_session_id,
    btrim(p_incident_id),
    jsonb_build_object('reason', btrim(p_reason))
  );

  RETURN QUERY
  SELECT
    lls.id,
    lls.started_by,
    lls.incident_id,
    lls.reason,
    lls.status,
    lls.started_at,
    lls.expires_at,
    lls.ended_at
  FROM public.live_location_sessions AS lls
  WHERE lls.id = v_session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_stop_live_location_session(
  p_session_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_incident_id TEXT;
BEGIN
  IF NOT public.has_admin_permission('live_location_exact_view') THEN
    RAISE EXCEPTION 'exact_location_permission_required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.live_location_sessions
  SET
    status = 'ended',
    ended_at = NOW()
  WHERE id = p_session_id
    AND status = 'active'
  RETURNING incident_id INTO v_incident_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.live_location_audit_logs (
    actor_user_id,
    action,
    session_id,
    incident_id,
    details
  )
  VALUES (
    auth.uid(),
    'session_stopped',
    p_session_id,
    v_incident_id,
    '{}'::JSONB
  );

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_live_exact_pins(
  p_session_id UUID,
  p_min_lat DOUBLE PRECISION DEFAULT NULL,
  p_max_lat DOUBLE PRECISION DEFAULT NULL,
  p_min_lon DOUBLE PRECISION DEFAULT NULL,
  p_max_lon DOUBLE PRECISION DEFAULT NULL,
  p_minutes INTEGER DEFAULT 15
)
RETURNS TABLE (
  device_id TEXT,
  user_id UUID,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  observed_at TIMESTAMPTZ,
  source TEXT,
  accuracy_meters DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_minutes INTEGER := GREATEST(1, LEAST(COALESCE(p_minutes, 15), 15));
  v_incident_id TEXT;
  v_status TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  IF NOT public.has_admin_permission('live_location_exact_view') THEN
    RAISE EXCEPTION 'exact_location_permission_required' USING ERRCODE = '42501';
  END IF;

  PERFORM public.expire_live_location_sessions();

  SELECT incident_id, status, expires_at
  INTO v_incident_id, v_status, v_expires_at
  FROM public.live_location_sessions
  WHERE id = p_session_id;

  IF NOT FOUND OR v_status <> 'active' OR v_expires_at <= NOW() THEN
    RAISE EXCEPTION 'live_location_session_inactive' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.live_location_audit_logs (
    actor_user_id,
    action,
    session_id,
    incident_id,
    details
  )
  VALUES (
    v_user_id,
    'exact_pins_read',
    p_session_id,
    v_incident_id,
    jsonb_build_object(
      'minutes', v_minutes,
      'bounds', jsonb_build_object(
        'min_lat', p_min_lat,
        'max_lat', p_max_lat,
        'min_lon', p_min_lon,
        'max_lon', p_max_lon
      )
    )
  );

  RETURN QUERY
  WITH latest_points AS (
    SELECT DISTINCT ON (dlh.device_id)
      dlh.device_id,
      dlh.user_id,
      dlh.latitude,
      dlh.longitude,
      dlh.observed_at,
      dlh.source,
      dlh.accuracy_meters
    FROM public.device_location_heartbeats AS dlh
    WHERE dlh.zone_monitoring_opt_in_snapshot = true
      AND dlh.observed_at >= NOW() - make_interval(mins => v_minutes)
      AND (p_min_lat IS NULL OR dlh.latitude >= p_min_lat)
      AND (p_max_lat IS NULL OR dlh.latitude <= p_max_lat)
      AND (p_min_lon IS NULL OR dlh.longitude >= p_min_lon)
      AND (p_max_lon IS NULL OR dlh.longitude <= p_max_lon)
    ORDER BY dlh.device_id, dlh.observed_at DESC
  )
  SELECT
    latest_points.device_id,
    latest_points.user_id,
    latest_points.latitude,
    latest_points.longitude,
    latest_points.observed_at,
    latest_points.source,
    latest_points.accuracy_meters
  FROM latest_points
  ORDER BY latest_points.observed_at DESC;
END;
$$;

INSERT INTO public.admin_feature_permissions (user_id, permission_code, granted_by)
SELECT ar.user_id, 'live_location_exact_view', NULL
FROM public.app_roles AS ar
WHERE ar.role = 'admin'
ON CONFLICT (user_id, permission_code) DO NOTHING;

GRANT EXECUTE ON FUNCTION public.has_admin_permission(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_live_location_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_live_location_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_live_presence_anonymized(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_active_live_location_session() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_start_live_location_session(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_stop_live_location_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_live_exact_pins(UUID, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, INTEGER) TO authenticated;

-- END MIGRATION: 030_admin_live_presence.sql

-- ============================================================================
-- BEGIN MIGRATION: 031_admin_audit_trail.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_kind TEXT NOT NULL DEFAULT 'audit' CHECK (event_kind IN ('audit', 'activity')),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  reason TEXT,
  old_data JSONB,
  new_data JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  changed_fields TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at
  ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_entity
  ON public.admin_audit_log (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_kind_created
  ON public.admin_audit_log (event_kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor
  ON public.admin_audit_log (actor_user_id, created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read admin audit log" ON public.admin_audit_log;
CREATE POLICY "Admins read admin audit log"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "No direct admin audit writes" ON public.admin_audit_log;
CREATE POLICY "No direct admin audit writes"
  ON public.admin_audit_log FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.audit_changed_fields(
  p_old JSONB,
  p_new JSONB
)
RETURNS TEXT[]
LANGUAGE sql
IMMUTABLE
AS $$
  WITH keys AS (
    SELECT key
    FROM jsonb_object_keys(COALESCE(p_old, '{}'::JSONB)) AS key
    UNION
    SELECT key
    FROM jsonb_object_keys(COALESCE(p_new, '{}'::JSONB)) AS key
  )
  SELECT COALESCE(array_agg(key ORDER BY key), ARRAY[]::TEXT[])
  FROM keys
  WHERE COALESCE(p_old -> key, 'null'::JSONB) IS DISTINCT FROM COALESCE(p_new -> key, 'null'::JSONB);
$$;

CREATE OR REPLACE FUNCTION public.current_request_actor_email()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_claims TEXT := current_setting('request.jwt.claims', true);
BEGIN
  IF v_claims IS NULL OR btrim(v_claims) = '' THEN
    RETURN 'system/unknown';
  END IF;

  RETURN COALESCE(NULLIF((v_claims::JSONB ->> 'email'), ''), 'system/unknown');
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'system/unknown';
END;
$$;

CREATE OR REPLACE FUNCTION public.lookup_auth_user_email(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT u.email
  FROM auth.users AS u
  WHERE u.id = p_user_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.trg_sync_report_status_audit_to_admin_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.admin_audit_log (
    event_kind,
    entity_type,
    entity_id,
    action,
    actor_user_id,
    actor_email,
    old_data,
    new_data,
    changed_fields,
    created_at
  )
  VALUES (
    'audit',
    'report',
    NEW.report_id::TEXT,
    'status_changed',
    NEW.admin_id,
    NEW.admin_email,
    jsonb_build_object('status', NEW.old_status),
    jsonb_build_object('status', NEW.new_status),
    ARRAY['status']::TEXT[],
    NEW.changed_at
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_report_status_audit_to_admin_audit_log ON public.report_status_audit;
CREATE TRIGGER trg_sync_report_status_audit_to_admin_audit_log
  AFTER INSERT ON public.report_status_audit
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_report_status_audit_to_admin_audit_log();

CREATE OR REPLACE FUNCTION public.trg_audit_monitoring_zone_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old JSONB;
  v_new JSONB;
  v_action TEXT;
  v_entity_id TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
    v_entity_id := NEW.id::TEXT;
    v_old := NULL;
    v_new := to_jsonb(NEW) - ARRAY['created_at', 'updated_at'];
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'updated';
    v_entity_id := NEW.id::TEXT;
    v_old := to_jsonb(OLD) - ARRAY['created_at', 'updated_at'];
    v_new := to_jsonb(NEW) - ARRAY['created_at', 'updated_at'];

    IF v_old IS NOT DISTINCT FROM v_new THEN
      RETURN NEW;
    END IF;
  ELSE
    v_action := 'deleted';
    v_entity_id := OLD.id::TEXT;
    v_old := to_jsonb(OLD) - ARRAY['created_at', 'updated_at'];
    v_new := NULL;
  END IF;

  INSERT INTO public.admin_audit_log (
    event_kind,
    entity_type,
    entity_id,
    action,
    actor_user_id,
    actor_email,
    old_data,
    new_data,
    changed_fields
  )
  VALUES (
    'audit',
    'monitoring_zone',
    v_entity_id,
    v_action,
    auth.uid(),
    public.current_request_actor_email(),
    v_old,
    v_new,
    public.audit_changed_fields(v_old, v_new)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_monitoring_zone_changes ON public.monitoring_zones;
CREATE TRIGGER trg_audit_monitoring_zone_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.monitoring_zones
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_audit_monitoring_zone_changes();

CREATE OR REPLACE FUNCTION public.trg_sync_live_location_audit_to_admin_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor_email TEXT;
BEGIN
  v_actor_email := COALESCE(public.lookup_auth_user_email(NEW.actor_user_id), 'system/unknown');

  INSERT INTO public.admin_audit_log (
    event_kind,
    entity_type,
    entity_id,
    action,
    actor_user_id,
    actor_email,
    reason,
    metadata,
    changed_fields,
    created_at
  )
  VALUES (
    'audit',
    'live_location_session',
    COALESCE(NEW.session_id::TEXT, COALESCE(NEW.incident_id, NEW.id::TEXT)),
    NEW.action,
    NEW.actor_user_id,
    v_actor_email,
    NULLIF(NEW.details ->> 'reason', ''),
    jsonb_build_object(
      'session_id', NEW.session_id,
      'incident_id', NEW.incident_id,
      'details', COALESCE(NEW.details, '{}'::JSONB)
    ),
    ARRAY[]::TEXT[],
    NEW.created_at
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_live_location_audit_to_admin_audit_log ON public.live_location_audit_logs;
CREATE TRIGGER trg_sync_live_location_audit_to_admin_audit_log
  AFTER INSERT ON public.live_location_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_live_location_audit_to_admin_audit_log();

CREATE OR REPLACE FUNCTION public.trg_sync_zone_transition_event_to_admin_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_zone_name TEXT;
BEGIN
  SELECT mz.name
  INTO v_zone_name
  FROM public.monitoring_zones AS mz
  WHERE mz.id = NEW.zone_id;

  INSERT INTO public.admin_audit_log (
    event_kind,
    entity_type,
    entity_id,
    action,
    actor_user_id,
    actor_email,
    metadata,
    changed_fields,
    created_at
  )
  VALUES (
    'activity',
    'zone_transition',
    NEW.zone_id::TEXT,
    NEW.event_type,
    NULL,
    'system/zone-monitor',
    jsonb_build_object(
      'zone_name', v_zone_name,
      'user_id', NEW.user_id,
      'device_id', NEW.device_id,
      'latitude', NEW.latitude,
      'longitude', NEW.longitude,
      'source', NEW.source,
      'delivery_status', NEW.delivery_status,
      'notification_outbox_id', NEW.notification_outbox_id
    ),
    ARRAY[]::TEXT[],
    NEW.created_at
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_zone_transition_event_to_admin_audit_log ON public.zone_transition_events;
CREATE TRIGGER trg_sync_zone_transition_event_to_admin_audit_log
  AFTER INSERT ON public.zone_transition_events
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_zone_transition_event_to_admin_audit_log();

INSERT INTO public.admin_audit_log (
  event_kind,
  entity_type,
  entity_id,
  action,
  actor_user_id,
  actor_email,
  old_data,
  new_data,
  changed_fields,
  created_at
)
SELECT
  'audit',
  'report',
  rsa.report_id::TEXT,
  'status_changed',
  rsa.admin_id,
  rsa.admin_email,
  jsonb_build_object('status', rsa.old_status),
  jsonb_build_object('status', rsa.new_status),
  ARRAY['status']::TEXT[],
  rsa.changed_at
FROM public.report_status_audit AS rsa
WHERE NOT EXISTS (
  SELECT 1
  FROM public.admin_audit_log AS aal
  WHERE aal.entity_type = 'report'
    AND aal.entity_id = rsa.report_id::TEXT
    AND aal.action = 'status_changed'
    AND aal.created_at = rsa.changed_at
    AND COALESCE(aal.actor_email, '') = COALESCE(rsa.admin_email, '')
);

INSERT INTO public.admin_audit_log (
  event_kind,
  entity_type,
  entity_id,
  action,
  actor_user_id,
  actor_email,
  reason,
  metadata,
  changed_fields,
  created_at
)
SELECT
  'audit',
  'live_location_session',
  COALESCE(lla.session_id::TEXT, COALESCE(lla.incident_id, lla.id::TEXT)),
  lla.action,
  lla.actor_user_id,
  COALESCE(public.lookup_auth_user_email(lla.actor_user_id), 'system/unknown'),
  NULLIF(lla.details ->> 'reason', ''),
  jsonb_build_object(
    'session_id', lla.session_id,
    'incident_id', lla.incident_id,
    'details', COALESCE(lla.details, '{}'::JSONB)
  ),
  ARRAY[]::TEXT[],
  lla.created_at
FROM public.live_location_audit_logs AS lla
WHERE NOT EXISTS (
  SELECT 1
  FROM public.admin_audit_log AS aal
  WHERE aal.entity_type = 'live_location_session'
    AND aal.entity_id = COALESCE(lla.session_id::TEXT, COALESCE(lla.incident_id, lla.id::TEXT))
    AND aal.action = lla.action
    AND aal.created_at = lla.created_at
);

INSERT INTO public.admin_audit_log (
  event_kind,
  entity_type,
  entity_id,
  action,
  actor_user_id,
  actor_email,
  metadata,
  changed_fields,
  created_at
)
SELECT
  'activity',
  'zone_transition',
  zte.zone_id::TEXT,
  zte.event_type,
  NULL,
  'system/zone-monitor',
  jsonb_build_object(
    'zone_name', mz.name,
    'user_id', zte.user_id,
    'device_id', zte.device_id,
    'latitude', zte.latitude,
    'longitude', zte.longitude,
    'source', zte.source,
    'delivery_status', zte.delivery_status,
    'notification_outbox_id', zte.notification_outbox_id
  ),
  ARRAY[]::TEXT[],
  zte.created_at
FROM public.zone_transition_events AS zte
LEFT JOIN public.monitoring_zones AS mz ON mz.id = zte.zone_id
WHERE NOT EXISTS (
  SELECT 1
  FROM public.admin_audit_log AS aal
  WHERE aal.entity_type = 'zone_transition'
    AND aal.entity_id = zte.zone_id::TEXT
    AND aal.action = zte.event_type
    AND aal.created_at = zte.created_at
);

CREATE OR REPLACE FUNCTION public.admin_list_audit_events(
  p_limit INTEGER DEFAULT 250,
  p_offset INTEGER DEFAULT 0,
  p_search TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_action TEXT DEFAULT NULL,
  p_event_kind TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  event_kind TEXT,
  entity_type TEXT,
  entity_id TEXT,
  action TEXT,
  actor_user_id UUID,
  actor_email TEXT,
  reason TEXT,
  old_data JSONB,
  new_data JSONB,
  metadata JSONB,
  changed_fields TEXT[],
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin_only' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    aal.id,
    aal.event_kind,
    aal.entity_type,
    aal.entity_id,
    aal.action,
    aal.actor_user_id,
    aal.actor_email,
    aal.reason,
    aal.old_data,
    aal.new_data,
    aal.metadata,
    aal.changed_fields,
    aal.created_at
  FROM public.admin_audit_log AS aal
  WHERE (p_entity_type IS NULL OR p_entity_type = '' OR aal.entity_type = p_entity_type)
    AND (p_action IS NULL OR p_action = '' OR aal.action = p_action)
    AND (p_event_kind IS NULL OR p_event_kind = '' OR aal.event_kind = p_event_kind)
    AND (
      p_search IS NULL
      OR p_search = ''
      OR aal.entity_id ILIKE '%' || p_search || '%'
      OR aal.entity_type ILIKE '%' || p_search || '%'
      OR aal.action ILIKE '%' || p_search || '%'
      OR COALESCE(aal.actor_email, '') ILIKE '%' || p_search || '%'
      OR COALESCE(aal.reason, '') ILIKE '%' || p_search || '%'
      OR COALESCE(aal.metadata ->> 'entity_label', '') ILIKE '%' || p_search || '%'
      OR COALESCE(aal.metadata ->> 'zone_name', '') ILIKE '%' || p_search || '%'
      OR COALESCE(aal.metadata ->> 'incident_id', '') ILIKE '%' || p_search || '%'
    )
  ORDER BY aal.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 250), 1000))
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_entity_audit_history(
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  event_kind TEXT,
  entity_type TEXT,
  entity_id TEXT,
  action TEXT,
  actor_user_id UUID,
  actor_email TEXT,
  reason TEXT,
  old_data JSONB,
  new_data JSONB,
  metadata JSONB,
  changed_fields TEXT[],
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin_only' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    aal.id,
    aal.event_kind,
    aal.entity_type,
    aal.entity_id,
    aal.action,
    aal.actor_user_id,
    aal.actor_email,
    aal.reason,
    aal.old_data,
    aal.new_data,
    aal.metadata,
    aal.changed_fields,
    aal.created_at
  FROM public.admin_audit_log AS aal
  WHERE aal.entity_type = p_entity_type
    AND aal.entity_id = p_entity_id
  ORDER BY aal.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 100), 500));
END;
$$;

GRANT EXECUTE ON FUNCTION public.audit_changed_fields(JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_request_actor_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_auth_user_email(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_audit_events(INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_entity_audit_history(TEXT, TEXT, INTEGER) TO authenticated;

-- END MIGRATION: 031_admin_audit_trail.sql

-- ============================================================================
-- BEGIN MIGRATION: 032_immediate_danger_report_metadata.sql
-- ============================================================================

ALTER TABLE public.hazard_reports
  ADD COLUMN IF NOT EXISTS immediate_danger_status TEXT NOT NULL DEFAULT 'no',
  ADD COLUMN IF NOT EXISTS affected_people_band TEXT;

ALTER TABLE public.hazard_reports
  DROP CONSTRAINT IF EXISTS hazard_reports_immediate_danger_status_check;

ALTER TABLE public.hazard_reports
  ADD CONSTRAINT hazard_reports_immediate_danger_status_check
  CHECK (immediate_danger_status IN ('yes', 'no', 'not_sure'));

ALTER TABLE public.hazard_reports
  DROP CONSTRAINT IF EXISTS hazard_reports_affected_people_band_check;

ALTER TABLE public.hazard_reports
  ADD CONSTRAINT hazard_reports_affected_people_band_check
  CHECK (
    affected_people_band IS NULL
    OR affected_people_band IN ('unknown', '1_5', '6_20', '21_50', '50_plus')
  );

DROP FUNCTION IF EXISTS public.create_hazard_report(
  uuid, text, text, text, text, double precision, double precision, boolean, integer, text, timestamptz, text
);

DROP FUNCTION IF EXISTS public.create_hazard_report(
  uuid, text, text, text, text, double precision, double precision, boolean, integer, text, text, text, timestamptz, text
);

CREATE FUNCTION public.create_hazard_report(
  p_client_id uuid, p_user_phone text, p_user_name text, p_hazard_type text, p_description text,
  p_latitude double precision, p_longitude double precision, p_is_high_risk boolean DEFAULT false,
  p_people_at_risk integer DEFAULT null, p_urgency_level text DEFAULT null,
  p_immediate_danger_status text DEFAULT 'no', p_affected_people_band text DEFAULT null,
  p_event_time timestamptz DEFAULT now(), p_device_id text DEFAULT null
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_user_id uuid; v_existing_id uuid; v_recent_count integer; v_last_created timestamptz;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001'; END IF;

  SELECT id
  INTO v_existing_id
  FROM public.hazard_reports
  WHERE user_id = v_user_id
    AND hazard_type = p_hazard_type
    AND created_at > now() - interval '10 minutes'
    AND ST_DWithin(location, ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography, 50)
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN RETURN v_existing_id; END IF;

  SELECT created_at INTO v_last_created
  FROM public.hazard_reports
  WHERE user_id = v_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_last_created IS NOT NULL AND v_last_created > now() - interval '30 seconds' THEN
    RAISE EXCEPTION 'rate_limited_min_interval' USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*)::int INTO v_recent_count
  FROM public.hazard_reports
  WHERE user_id = v_user_id
    AND created_at > now() - interval '1 hour';

  IF v_recent_count >= 20 THEN
    RAISE EXCEPTION 'rate_limited_hourly' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.hazard_reports(
    client_id, user_id, user_phone, user_name, hazard_type, description,
    location, latitude, longitude, is_high_risk, people_at_risk, urgency_level,
    immediate_danger_status, affected_people_band, status, event_time, device_id
  )
  VALUES (
    p_client_id,
    v_user_id,
    p_user_phone,
    NULLIF(p_user_name, ''),
    p_hazard_type,
    p_description,
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
    p_latitude,
    p_longitude,
    COALESCE(p_is_high_risk, false),
    p_people_at_risk,
    p_urgency_level,
    COALESCE(NULLIF(p_immediate_danger_status, ''), 'no'),
    CASE
      WHEN COALESCE(NULLIF(p_immediate_danger_status, ''), 'no') = 'yes'
        THEN COALESCE(NULLIF(p_affected_people_band, ''), 'unknown')
      ELSE NULL
    END,
    'pending',
    COALESCE(p_event_time, now()),
    p_device_id
  )
  RETURNING id INTO v_existing_id;

  RETURN v_existing_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_hazard_report TO authenticated;

-- END MIGRATION: 032_immediate_danger_report_metadata.sql

-- ============================================================================
-- BEGIN MIGRATION: 034_report_ai_scoring.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.report_ai_analysis (
  report_id UUID PRIMARY KEY REFERENCES public.hazard_reports(id) ON DELETE CASCADE,
  analysis_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (analysis_status IN ('pending', 'processing', 'completed', 'partial', 'failed')),
  operational_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  score_bucket TEXT NOT NULL DEFAULT 'low'
    CHECK (score_bucket IN ('critical', 'high', 'medium', 'low')),
  text_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  image_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  audio_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  video_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  metadata_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  confidence_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  recommended_action TEXT,
  recommended_status TEXT
    CHECK (recommended_status IS NULL OR recommended_status IN ('pending', 'verified', 'rejected', 'resolved')),
  summary TEXT,
  extracted_signals_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  scoring_reasons_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  media_evidence_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_modalities_json JSONB NOT NULL DEFAULT jsonb_build_object(
    'metadata', false,
    'text', false,
    'image', false,
    'audio', false,
    'video', false
  ),
  provider_primary TEXT,
  model_primary TEXT,
  provider_fallback TEXT,
  model_fallback TEXT,
  analysis_attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  needs_recompute BOOLEAN NOT NULL DEFAULT true,
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.report_ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.hazard_reports(id) ON DELETE CASCADE,
  run_kind TEXT NOT NULL
    CHECK (run_kind IN ('base', 'media', 'manual_retry', 'scheduled')),
  status TEXT NOT NULL
    CHECK (status IN ('started', 'completed', 'partial', 'failed')),
  provider_primary TEXT,
  model_primary TEXT,
  provider_fallback TEXT,
  model_fallback TEXT,
  prompt_version TEXT,
  summary TEXT,
  error_text TEXT,
  score_snapshot DOUBLE PRECISION,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.report_ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.hazard_reports(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  score_helpful BOOLEAN,
  recommendation_helpful BOOLEAN,
  summary_helpful BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_ai_analysis_status
  ON public.report_ai_analysis (analysis_status, needs_recompute, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_report_ai_analysis_score
  ON public.report_ai_analysis (operational_score DESC, score_bucket, analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_ai_runs_report_created
  ON public.report_ai_runs (report_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_ai_feedback_report_created
  ON public.report_ai_feedback (report_id, created_at DESC);

ALTER TABLE public.report_ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_ai_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read report ai analysis" ON public.report_ai_analysis;
CREATE POLICY "Admins can read report ai analysis"
  ON public.report_ai_analysis FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "No direct report ai analysis writes" ON public.report_ai_analysis;
CREATE POLICY "No direct report ai analysis writes"
  ON public.report_ai_analysis FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Admins can read report ai runs" ON public.report_ai_runs;
CREATE POLICY "Admins can read report ai runs"
  ON public.report_ai_runs FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "No direct report ai run writes" ON public.report_ai_runs;
CREATE POLICY "No direct report ai run writes"
  ON public.report_ai_runs FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Admins can read report ai feedback" ON public.report_ai_feedback;
CREATE POLICY "Admins can read report ai feedback"
  ON public.report_ai_feedback FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert report ai feedback" ON public.report_ai_feedback;
CREATE POLICY "Admins can insert report ai feedback"
  ON public.report_ai_feedback FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS trg_report_ai_analysis_updated_at ON public.report_ai_analysis;
CREATE TRIGGER trg_report_ai_analysis_updated_at
  BEFORE UPDATE ON public.report_ai_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.touch_report_ai_analysis()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.report_ai_analysis (
    report_id,
    analysis_status,
    operational_score,
    score_bucket,
    recommended_action,
    summary,
    needs_recompute
  )
  VALUES (
    NEW.id,
    'pending',
    0,
    'low',
    'Awaiting AI analysis',
    'Awaiting AI analysis',
    true
  )
  ON CONFLICT (report_id)
  DO UPDATE SET
    analysis_status = CASE
      WHEN public.report_ai_analysis.analysis_status = 'processing'
        THEN public.report_ai_analysis.analysis_status
      ELSE 'pending'
    END,
    last_error = NULL,
    needs_recompute = true,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_report_ai_analysis_insert ON public.hazard_reports;
CREATE TRIGGER trg_touch_report_ai_analysis_insert
  AFTER INSERT ON public.hazard_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_report_ai_analysis();

DROP TRIGGER IF EXISTS trg_touch_report_ai_analysis_update ON public.hazard_reports;
CREATE TRIGGER trg_touch_report_ai_analysis_update
  AFTER UPDATE OF
    description,
    translated_english,
    translation_status,
    urgency_level,
    is_high_risk,
    people_at_risk,
    immediate_danger_status,
    affected_people_band,
    media_urls,
    upload_complete,
    event_time
  ON public.hazard_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_report_ai_analysis();

INSERT INTO public.report_ai_analysis (
  report_id,
  analysis_status,
  operational_score,
  score_bucket,
  recommended_action,
  summary,
  needs_recompute
)
SELECT
  hr.id,
  'pending',
  0,
  'low',
  'Awaiting AI analysis',
  'Awaiting AI analysis',
  true
FROM public.hazard_reports AS hr
ON CONFLICT (report_id) DO NOTHING;

INSERT INTO public.admin_audit_log (
  event_kind,
  entity_type,
  entity_id,
  action,
  actor_user_id,
  actor_email,
  metadata,
  changed_fields,
  created_at
)
SELECT
  'audit',
  'system',
  'report_ai_analysis_backfill',
  'created',
  NULL,
  'system/migration',
  jsonb_build_object('records_initialized', COUNT(*)),
  ARRAY['records_initialized']::TEXT[],
  NOW()
WHERE NOT EXISTS (
  SELECT 1
  FROM public.admin_audit_log
  WHERE entity_type = 'system'
    AND entity_id = 'report_ai_analysis_backfill'
    AND action = 'created'
);

-- END MIGRATION: 034_report_ai_scoring.sql

-- ============================================================================
-- BEGIN MIGRATION: 036_report_ai_scheduler.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS vault;

CREATE OR REPLACE FUNCTION public.invoke_report_ai_worker(
  batch_limit integer DEFAULT 10,
  batch_concurrency integer DEFAULT 2
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_url text;
  worker_secret text;
  request_id bigint;
BEGIN
  SELECT decrypted_secret
  INTO project_url
  FROM vault.decrypted_secrets
  WHERE name = 'project_url'
  LIMIT 1;

  SELECT decrypted_secret
  INTO worker_secret
  FROM vault.decrypted_secrets
  WHERE name = 'report_ai_worker_secret'
  LIMIT 1;

  IF coalesce(project_url, '') = '' THEN
    RAISE EXCEPTION 'Missing vault secret: project_url';
  END IF;

  IF coalesce(worker_secret, '') = '' THEN
    RAISE EXCEPTION 'Missing vault secret: report_ai_worker_secret';
  END IF;

  SELECT net.http_post(
    url := rtrim(project_url, '/') || '/functions/v1/process_pending_report_ai',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-worker-secret', worker_secret
    ),
    body := jsonb_build_object(
      'limit', greatest(1, least(coalesce(batch_limit, 10), 30)),
      'concurrency', greatest(1, least(coalesce(batch_concurrency, 2), 4))
    )
  )
  INTO request_id;

  RETURN request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.invoke_report_ai_worker(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invoke_report_ai_worker(integer, integer) TO postgres;

CREATE OR REPLACE FUNCTION public.schedule_report_ai_worker(
  cron_expression text DEFAULT '*/5 * * * *',
  batch_limit integer DEFAULT 10,
  batch_concurrency integer DEFAULT 2
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'report-ai-worker-every-5-minutes'
  ) THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'report-ai-worker-every-5-minutes';
  END IF;

  PERFORM cron.schedule(
    'report-ai-worker-every-5-minutes',
    cron_expression,
    format(
      'select public.invoke_report_ai_worker(%s, %s);',
      greatest(1, least(coalesce(batch_limit, 10), 30)),
      greatest(1, least(coalesce(batch_concurrency, 2), 4))
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.schedule_report_ai_worker(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.schedule_report_ai_worker(text, integer, integer) TO postgres;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_extension
    WHERE extname = 'vault'
  )
  AND EXISTS (
    SELECT 1
    FROM vault.decrypted_secrets
    WHERE name = 'project_url'
  )
  AND EXISTS (
    SELECT 1
    FROM vault.decrypted_secrets
    WHERE name = 'report_ai_worker_secret'
  ) THEN
    PERFORM public.schedule_report_ai_worker('*/5 * * * *', 10, 2);
  END IF;
END;
$$;

-- END MIGRATION: 036_report_ai_scheduler.sql

-- ============================================================================
-- BEGIN MIGRATION: 035_report_fraud_hardening.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.report_submission_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.hazard_reports(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  device_id TEXT,
  client_id UUID,
  event_type TEXT NOT NULL CHECK (event_type IN ('accepted', 'blocked', 'duplicate_linked')),
  result_code TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_submission_events_report_created
  ON public.report_submission_events (report_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_submission_events_user_created
  ON public.report_submission_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_submission_events_device_created
  ON public.report_submission_events (device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_submission_events_result_created
  ON public.report_submission_events (result_code, created_at DESC);

ALTER TABLE public.report_submission_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read report submission events" ON public.report_submission_events;
CREATE POLICY "Admins read report submission events"
  ON public.report_submission_events FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.report_integrity_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.hazard_reports(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  source TEXT NOT NULL DEFAULT 'system' CHECK (source IN ('system', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'resolved')),
  details_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_integrity_signals_report_status
  ON public.report_integrity_signals (report_id, status, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_integrity_signals_signal_status
  ON public.report_integrity_signals (signal_type, status, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_integrity_signals_severity_status
  ON public.report_integrity_signals (severity, status, detected_at DESC);

ALTER TABLE public.report_integrity_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read report integrity signals" ON public.report_integrity_signals;
CREATE POLICY "Admins read report integrity signals"
  ON public.report_integrity_signals FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins update report integrity signals" ON public.report_integrity_signals;
CREATE POLICY "Admins update report integrity signals"
  ON public.report_integrity_signals FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.report_duplicate_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_reason TEXT NOT NULL,
  last_report_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_duplicate_clusters_last_report
  ON public.report_duplicate_clusters (last_report_at DESC NULLS LAST, created_at DESC);

ALTER TABLE public.report_duplicate_clusters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read report duplicate clusters" ON public.report_duplicate_clusters;
CREATE POLICY "Admins read report duplicate clusters"
  ON public.report_duplicate_clusters FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.report_duplicate_cluster_members (
  cluster_id UUID NOT NULL REFERENCES public.report_duplicate_clusters(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES public.hazard_reports(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cluster_id, report_id),
  UNIQUE (report_id)
);

CREATE INDEX IF NOT EXISTS idx_report_duplicate_cluster_members_cluster
  ON public.report_duplicate_cluster_members (cluster_id, joined_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_duplicate_cluster_members_report
  ON public.report_duplicate_cluster_members (report_id, joined_at DESC);

ALTER TABLE public.report_duplicate_cluster_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read report duplicate cluster members" ON public.report_duplicate_cluster_members;
CREATE POLICY "Admins read report duplicate cluster members"
  ON public.report_duplicate_cluster_members FOR SELECT TO authenticated
  USING (public.is_admin());

DROP TRIGGER IF EXISTS trg_report_integrity_signals_updated_at ON public.report_integrity_signals;
CREATE TRIGGER trg_report_integrity_signals_updated_at
  BEFORE UPDATE ON public.report_integrity_signals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_report_duplicate_clusters_updated_at ON public.report_duplicate_clusters;
CREATE TRIGGER trg_report_duplicate_clusters_updated_at
  BEFORE UPDATE ON public.report_duplicate_clusters
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.insert_admin_audit_event(
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_action TEXT,
  p_reason TEXT DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_event_kind TEXT DEFAULT 'audit',
  p_actor_user_id UUID DEFAULT auth.uid(),
  p_actor_email TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.admin_audit_log (
    event_kind,
    entity_type,
    entity_id,
    action,
    actor_user_id,
    actor_email,
    reason,
    old_data,
    new_data,
    metadata,
    changed_fields
  )
  VALUES (
    COALESCE(NULLIF(p_event_kind, ''), 'audit'),
    p_entity_type,
    p_entity_id,
    p_action,
    p_actor_user_id,
    COALESCE(NULLIF(p_actor_email, ''), public.current_request_actor_email()),
    p_reason,
    p_old_data,
    p_new_data,
    COALESCE(p_metadata, '{}'::JSONB),
    public.audit_changed_fields(p_old_data, p_new_data)
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_report_submission_event(
  p_report_id UUID,
  p_user_id UUID,
  p_device_id TEXT,
  p_client_id UUID,
  p_event_type TEXT,
  p_result_code TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.report_submission_events (
    report_id,
    user_id,
    device_id,
    client_id,
    event_type,
    result_code,
    metadata
  )
  VALUES (
    p_report_id,
    p_user_id,
    NULLIF(BTRIM(COALESCE(p_device_id, '')), ''),
    p_client_id,
    p_event_type,
    p_result_code,
    COALESCE(p_metadata, '{}'::JSONB)
  )
  RETURNING id INTO v_event_id;

  IF p_event_type <> 'accepted' THEN
    PERFORM public.insert_admin_audit_event(
      'hazard_report_submission',
      COALESCE(p_report_id::TEXT, p_client_id::TEXT, v_event_id::TEXT),
      p_event_type || ':' || p_result_code,
      NULL,
      NULL,
      NULL,
      jsonb_build_object(
        'submission_event_id', v_event_id,
        'report_id', p_report_id,
        'user_id', p_user_id,
        'device_id', NULLIF(BTRIM(COALESCE(p_device_id, '')), ''),
        'client_id', p_client_id,
        'metadata', COALESCE(p_metadata, '{}'::JSONB)
      ),
      'activity',
      p_user_id,
      NULL
    );
  END IF;

  RETURN v_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_report_description(p_description TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(regexp_replace(lower(COALESCE(p_description, '')), '\s+', ' ', 'g'), '');
$$;

CREATE OR REPLACE FUNCTION public.merge_report_duplicate_clusters(
  p_primary_cluster_id UUID,
  p_secondary_cluster_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_primary_cluster_id IS NULL THEN
    RETURN p_secondary_cluster_id;
  END IF;

  IF p_secondary_cluster_id IS NULL OR p_secondary_cluster_id = p_primary_cluster_id THEN
    RETURN p_primary_cluster_id;
  END IF;

  UPDATE public.report_duplicate_cluster_members
  SET cluster_id = p_primary_cluster_id
  WHERE cluster_id = p_secondary_cluster_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.report_duplicate_cluster_members AS existing_member
      WHERE existing_member.cluster_id = p_primary_cluster_id
        AND existing_member.report_id = public.report_duplicate_cluster_members.report_id
    );

  DELETE FROM public.report_duplicate_cluster_members
  WHERE cluster_id = p_secondary_cluster_id;

  UPDATE public.report_duplicate_clusters AS target_cluster
  SET last_report_at = GREATEST(
    COALESCE(target_cluster.last_report_at, '-infinity'::TIMESTAMPTZ),
    COALESCE(source_cluster.last_report_at, '-infinity'::TIMESTAMPTZ)
  )
  FROM public.report_duplicate_clusters AS source_cluster
  WHERE target_cluster.id = p_primary_cluster_id
    AND source_cluster.id = p_secondary_cluster_id;

  DELETE FROM public.report_duplicate_clusters
  WHERE id = p_secondary_cluster_id;

  RETURN p_primary_cluster_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_empty_report_duplicate_clusters()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.report_duplicate_clusters AS cluster
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.report_duplicate_cluster_members AS member
    WHERE member.cluster_id = cluster.id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_report_duplicate_cluster(p_report_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_report RECORD;
  v_target_cluster_id UUID;
  v_existing_cluster_id UUID;
  v_has_related BOOLEAN := FALSE;
BEGIN
  SELECT
    report.id,
    report.hazard_type,
    report.created_at,
    report.location,
    public.normalize_report_description(COALESCE(report.translated_english, report.description)) AS normalized_description
  INTO v_report
  FROM public.hazard_reports AS report
  WHERE report.id = p_report_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  DELETE FROM public.report_duplicate_cluster_members
  WHERE report_id = p_report_id;

  IF v_report.normalized_description IS NULL THEN
    PERFORM public.cleanup_empty_report_duplicate_clusters();
    RETURN NULL;
  END IF;

  FOR v_existing_cluster_id IN
    SELECT DISTINCT member.cluster_id
    FROM public.hazard_reports AS related
    JOIN public.report_duplicate_cluster_members AS member
      ON member.report_id = related.id
    WHERE related.id <> p_report_id
      AND related.hazard_type = v_report.hazard_type
      AND related.created_at BETWEEN v_report.created_at - INTERVAL '60 minutes' AND v_report.created_at + INTERVAL '60 minutes'
      AND ST_DWithin(related.location, v_report.location, 250)
      AND public.normalize_report_description(COALESCE(related.translated_english, related.description)) = v_report.normalized_description
  LOOP
    v_has_related := TRUE;
    IF v_target_cluster_id IS NULL THEN
      v_target_cluster_id := v_existing_cluster_id;
    ELSE
      v_target_cluster_id := public.merge_report_duplicate_clusters(v_target_cluster_id, v_existing_cluster_id);
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM public.hazard_reports AS related
    WHERE related.id <> p_report_id
      AND related.hazard_type = v_report.hazard_type
      AND related.created_at BETWEEN v_report.created_at - INTERVAL '60 minutes' AND v_report.created_at + INTERVAL '60 minutes'
      AND ST_DWithin(related.location, v_report.location, 250)
      AND public.normalize_report_description(COALESCE(related.translated_english, related.description)) = v_report.normalized_description
  ) THEN
    v_has_related := TRUE;
  END IF;

  IF NOT v_has_related THEN
    PERFORM public.cleanup_empty_report_duplicate_clusters();
    RETURN NULL;
  END IF;

  IF v_target_cluster_id IS NULL THEN
    INSERT INTO public.report_duplicate_clusters (
      cluster_reason,
      last_report_at
    )
    VALUES (
      'exact_text_recent_nearby',
      v_report.created_at
    )
    RETURNING id INTO v_target_cluster_id;
  END IF;

  INSERT INTO public.report_duplicate_cluster_members (cluster_id, report_id)
  SELECT v_target_cluster_id, related.id
  FROM public.hazard_reports AS related
  WHERE related.id <> p_report_id
    AND related.hazard_type = v_report.hazard_type
    AND related.created_at BETWEEN v_report.created_at - INTERVAL '60 minutes' AND v_report.created_at + INTERVAL '60 minutes'
    AND ST_DWithin(related.location, v_report.location, 250)
    AND public.normalize_report_description(COALESCE(related.translated_english, related.description)) = v_report.normalized_description
  ON CONFLICT DO NOTHING;

  INSERT INTO public.report_duplicate_cluster_members (cluster_id, report_id)
  VALUES (v_target_cluster_id, p_report_id)
  ON CONFLICT DO NOTHING;

  UPDATE public.report_duplicate_clusters
  SET last_report_at = GREATEST(COALESCE(last_report_at, v_report.created_at), v_report.created_at)
  WHERE id = v_target_cluster_id;

  PERFORM public.cleanup_empty_report_duplicate_clusters();
  RETURN v_target_cluster_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_report_integrity_for_report(p_report_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_report RECORD;
  v_user_5m_count INTEGER := 0;
  v_user_hour_count INTEGER := 0;
  v_device_5m_count INTEGER := 0;
  v_device_15m_count INTEGER := 0;
  v_device_hour_count INTEGER := 0;
  v_device_distinct_users INTEGER := 0;
  v_exact_text_count INTEGER := 0;
  v_nearby_recent_count INTEGER := 0;
  v_cluster_id UUID;
  v_cluster_size INTEGER := 0;
BEGIN
  SELECT
    report.id,
    report.user_id,
    NULLIF(BTRIM(COALESCE(report.device_id, '')), '') AS device_id,
    report.hazard_type,
    report.created_at,
    report.location,
    public.normalize_report_description(COALESCE(report.translated_english, report.description)) AS normalized_description
  INTO v_report
  FROM public.hazard_reports AS report
  WHERE report.id = p_report_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  DELETE FROM public.report_integrity_signals
  WHERE report_id = p_report_id
    AND source = 'system'
    AND status = 'active';

  SELECT COUNT(*)::INTEGER
  INTO v_user_5m_count
  FROM public.hazard_reports AS report
  WHERE report.user_id = v_report.user_id
    AND report.created_at BETWEEN v_report.created_at - INTERVAL '5 minutes' AND v_report.created_at + INTERVAL '5 minutes';

  IF v_user_5m_count >= 3 THEN
    INSERT INTO public.report_integrity_signals (report_id, signal_type, severity, score, details_json)
    VALUES (
      p_report_id,
      'rapid_submissions_user',
      'high',
      60,
      jsonb_build_object('count', v_user_5m_count, 'window', '5 minutes')
    );
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO v_user_hour_count
  FROM public.hazard_reports AS report
  WHERE report.user_id = v_report.user_id
    AND report.created_at BETWEEN v_report.created_at - INTERVAL '1 hour' AND v_report.created_at + INTERVAL '1 hour';

  IF v_user_hour_count >= 8 THEN
    INSERT INTO public.report_integrity_signals (report_id, signal_type, severity, score, details_json)
    VALUES (
      p_report_id,
      'high_hourly_volume_user',
      'medium',
      40,
      jsonb_build_object('count', v_user_hour_count, 'window', '1 hour')
    );
  END IF;

  IF v_report.device_id IS NOT NULL THEN
    SELECT COUNT(*)::INTEGER
    INTO v_device_5m_count
    FROM public.hazard_reports AS report
    WHERE report.device_id = v_report.device_id
      AND report.created_at BETWEEN v_report.created_at - INTERVAL '5 minutes' AND v_report.created_at + INTERVAL '5 minutes';

    IF v_device_5m_count >= 3 THEN
      INSERT INTO public.report_integrity_signals (report_id, signal_type, severity, score, details_json)
      VALUES (
        p_report_id,
        'rapid_submissions_device',
        'critical',
        85,
        jsonb_build_object('count', v_device_5m_count, 'window', '5 minutes')
      );
    END IF;

    SELECT COUNT(*)::INTEGER
    INTO v_device_15m_count
    FROM public.hazard_reports AS report
    WHERE report.device_id = v_report.device_id
      AND report.created_at BETWEEN v_report.created_at - INTERVAL '15 minutes' AND v_report.created_at + INTERVAL '15 minutes';

    IF v_device_15m_count >= 6 THEN
      INSERT INTO public.report_integrity_signals (report_id, signal_type, severity, score, details_json)
      VALUES (
        p_report_id,
        'device_submission_burst',
        'critical',
        90,
        jsonb_build_object('count', v_device_15m_count, 'window', '15 minutes')
      );
    END IF;

    SELECT COUNT(*)::INTEGER
    INTO v_device_hour_count
    FROM public.hazard_reports AS report
    WHERE report.device_id = v_report.device_id
      AND report.created_at BETWEEN v_report.created_at - INTERVAL '1 hour' AND v_report.created_at + INTERVAL '1 hour';

    IF v_device_hour_count >= 8 THEN
      INSERT INTO public.report_integrity_signals (report_id, signal_type, severity, score, details_json)
      VALUES (
        p_report_id,
        'high_hourly_volume_device',
        'high',
        70,
        jsonb_build_object('count', v_device_hour_count, 'window', '1 hour')
      );
    END IF;

    SELECT COUNT(DISTINCT report.user_id)::INTEGER
    INTO v_device_distinct_users
    FROM public.hazard_reports AS report
    WHERE report.device_id = v_report.device_id
      AND report.created_at > NOW() - INTERVAL '7 days';

    IF v_device_distinct_users >= 2 THEN
      INSERT INTO public.report_integrity_signals (report_id, signal_type, severity, score, details_json)
      VALUES (
        p_report_id,
        'multi_account_same_device',
        'high',
        75,
        jsonb_build_object('distinct_users', v_device_distinct_users, 'window', '7 days')
      );
    END IF;
  END IF;

  IF v_report.normalized_description IS NOT NULL THEN
    SELECT COUNT(*)::INTEGER
    INTO v_exact_text_count
    FROM public.hazard_reports AS report
    WHERE report.id <> p_report_id
      AND report.hazard_type = v_report.hazard_type
      AND report.created_at BETWEEN v_report.created_at - INTERVAL '60 minutes' AND v_report.created_at + INTERVAL '60 minutes'
      AND ST_DWithin(report.location, v_report.location, 250)
      AND public.normalize_report_description(COALESCE(report.translated_english, report.description)) = v_report.normalized_description;

    IF v_exact_text_count >= 1 THEN
      INSERT INTO public.report_integrity_signals (report_id, signal_type, severity, score, details_json)
      VALUES (
        p_report_id,
        'duplicate_exact_text',
        'high',
        65,
        jsonb_build_object('matches', v_exact_text_count, 'window', '60 minutes', 'radius_meters', 250)
      );
    END IF;
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO v_nearby_recent_count
  FROM public.hazard_reports AS report
  WHERE report.id <> p_report_id
    AND report.hazard_type = v_report.hazard_type
    AND report.created_at BETWEEN v_report.created_at - INTERVAL '10 minutes' AND v_report.created_at + INTERVAL '10 minutes'
    AND ST_DWithin(report.location, v_report.location, 75);

  IF v_nearby_recent_count >= 1 THEN
    INSERT INTO public.report_integrity_signals (report_id, signal_type, severity, score, details_json)
    VALUES (
      p_report_id,
      'duplicate_nearby_recent',
      'medium',
      45,
      jsonb_build_object('matches', v_nearby_recent_count, 'window', '10 minutes', 'radius_meters', 75)
    );
  END IF;

  SELECT member.cluster_id, COUNT(*)::INTEGER
  INTO v_cluster_id, v_cluster_size
  FROM public.report_duplicate_cluster_members AS member
  WHERE member.cluster_id = (
    SELECT cluster_id
    FROM public.report_duplicate_cluster_members
    WHERE report_id = p_report_id
    LIMIT 1
  )
  GROUP BY member.cluster_id;

  IF v_cluster_id IS NOT NULL AND COALESCE(v_cluster_size, 0) > 1 THEN
    INSERT INTO public.report_integrity_signals (report_id, signal_type, severity, score, details_json)
    VALUES (
      p_report_id,
      'duplicate_cluster_member',
      'medium',
      35,
      jsonb_build_object('cluster_id', v_cluster_id, 'cluster_size', v_cluster_size)
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_refresh_report_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_impacted_report_id UUID;
  v_cluster_id UUID;
BEGIN
  PERFORM public.upsert_report_duplicate_cluster(NEW.id);
  PERFORM public.refresh_report_integrity_for_report(NEW.id);

  SELECT cluster_id
  INTO v_cluster_id
  FROM public.report_duplicate_cluster_members
  WHERE report_id = NEW.id
  LIMIT 1;

  FOR v_impacted_report_id IN
    SELECT DISTINCT impacted.report_id
    FROM (
      SELECT report.id AS report_id
      FROM public.hazard_reports AS report
      WHERE report.id <> NEW.id
        AND (
          report.user_id = NEW.user_id
          OR (
            NULLIF(BTRIM(COALESCE(report.device_id, '')), '') IS NOT NULL
            AND report.device_id = NULLIF(BTRIM(COALESCE(NEW.device_id, '')), '')
          )
          OR (
            report.hazard_type = NEW.hazard_type
            AND report.created_at BETWEEN NEW.created_at - INTERVAL '60 minutes' AND NEW.created_at + INTERVAL '60 minutes'
            AND ST_DWithin(report.location, NEW.location, 250)
          )
        )
      UNION
      SELECT member.report_id
      FROM public.report_duplicate_cluster_members AS member
      WHERE member.cluster_id = v_cluster_id
    ) AS impacted
    WHERE impacted.report_id IS NOT NULL
  LOOP
    PERFORM public.upsert_report_duplicate_cluster(v_impacted_report_id);
    PERFORM public.refresh_report_integrity_for_report(v_impacted_report_id);
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_report_integrity ON public.hazard_reports;
CREATE TRIGGER trg_refresh_report_integrity
  AFTER INSERT OR UPDATE OF description, translated_english, hazard_type, location, created_at, user_id, device_id
  ON public.hazard_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_refresh_report_integrity();

CREATE OR REPLACE FUNCTION public.trg_cleanup_empty_duplicate_cluster()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.cleanup_empty_report_duplicate_clusters();
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_empty_duplicate_cluster ON public.report_duplicate_cluster_members;
CREATE TRIGGER trg_cleanup_empty_duplicate_cluster
  AFTER DELETE ON public.report_duplicate_cluster_members
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_cleanup_empty_duplicate_cluster();

CREATE OR REPLACE FUNCTION public.admin_get_report_integrity_snapshots(
  p_report_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  report_id UUID,
  integrity_severity TEXT,
  integrity_score INTEGER,
  active_signal_count INTEGER,
  active_signal_types TEXT[],
  duplicate_cluster_id UUID,
  duplicate_cluster_size INTEGER,
  latest_submission_event_type TEXT,
  latest_submission_result_code TEXT,
  latest_submission_at TIMESTAMPTZ
)
LANGUAGE sql
AS $$
  WITH selected_reports AS (
    SELECT report.id AS report_id
    FROM public.hazard_reports AS report
    WHERE p_report_ids IS NULL OR report.id = ANY(p_report_ids)
  ),
  active_signals AS (
    SELECT
      signal.report_id,
      COALESCE(SUM(signal.score), 0)::INTEGER AS score_total,
      COALESCE(COUNT(*), 0)::INTEGER AS signal_count,
      COALESCE(array_agg(signal.signal_type ORDER BY signal.score DESC, signal.detected_at DESC), ARRAY[]::TEXT[]) AS signal_types,
      MAX(
        CASE signal.severity
          WHEN 'critical' THEN 4
          WHEN 'high' THEN 3
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 1
          ELSE 0
        END
      ) AS severity_rank
    FROM public.report_integrity_signals AS signal
    WHERE signal.status = 'active'
      AND (p_report_ids IS NULL OR signal.report_id = ANY(p_report_ids))
    GROUP BY signal.report_id
  ),
  cluster_rollup AS (
    SELECT
      member.report_id,
      member.cluster_id,
      cluster_sizes.cluster_size
    FROM public.report_duplicate_cluster_members AS member
    JOIN (
      SELECT cluster_id, COUNT(*)::INTEGER AS cluster_size
      FROM public.report_duplicate_cluster_members
      GROUP BY cluster_id
    ) AS cluster_sizes
      ON cluster_sizes.cluster_id = member.cluster_id
  ),
  latest_events AS (
    SELECT DISTINCT ON (event.report_id)
      event.report_id,
      event.event_type,
      event.result_code,
      event.created_at
    FROM public.report_submission_events AS event
    WHERE event.report_id IS NOT NULL
      AND (p_report_ids IS NULL OR event.report_id = ANY(p_report_ids))
    ORDER BY event.report_id, event.created_at DESC
  )
  SELECT
    report.report_id,
    CASE COALESCE(signal.severity_rank, 0)
      WHEN 4 THEN 'critical'
      WHEN 3 THEN 'high'
      WHEN 2 THEN 'medium'
      WHEN 1 THEN 'low'
      ELSE 'none'
    END AS integrity_severity,
    LEAST(COALESCE(signal.score_total, 0), 100) AS integrity_score,
    COALESCE(signal.signal_count, 0) AS active_signal_count,
    COALESCE(signal.signal_types, ARRAY[]::TEXT[]) AS active_signal_types,
    cluster.cluster_id AS duplicate_cluster_id,
    COALESCE(cluster.cluster_size, 0) AS duplicate_cluster_size,
    latest.event_type AS latest_submission_event_type,
    latest.result_code AS latest_submission_result_code,
    latest.created_at AS latest_submission_at
  FROM selected_reports AS report
  LEFT JOIN active_signals AS signal
    ON signal.report_id = report.report_id
  LEFT JOIN cluster_rollup AS cluster
    ON cluster.report_id = report.report_id
  LEFT JOIN latest_events AS latest
    ON latest.report_id = report.report_id;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_report_duplicate_cluster_members(
  p_report_id UUID
)
RETURNS TABLE (
  cluster_id UUID,
  report_id UUID,
  user_id UUID,
  user_name TEXT,
  hazard_type TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  description TEXT,
  translated_english TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_cluster_id UUID;
BEGIN
  SELECT member.cluster_id
  INTO v_cluster_id
  FROM public.report_duplicate_cluster_members AS member
  WHERE member.report_id = p_report_id
  LIMIT 1;

  IF v_cluster_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    v_cluster_id,
    report.id,
    report.user_id,
    report.user_name,
    report.hazard_type,
    report.status,
    report.created_at,
    report.description,
    report.translated_english
  FROM public.report_duplicate_cluster_members AS member
  JOIN public.hazard_reports AS report
    ON report.id = member.report_id
  WHERE member.cluster_id = v_cluster_id
  ORDER BY report.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_report_submission_events(
  p_report_id UUID,
  p_limit INTEGER DEFAULT 25
)
RETURNS TABLE (
  id UUID,
  report_id UUID,
  user_id UUID,
  device_id TEXT,
  client_id UUID,
  event_type TEXT,
  result_code TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
AS $$
  SELECT
    event.id,
    event.report_id,
    event.user_id,
    event.device_id,
    event.client_id,
    event.event_type,
    event.result_code,
    event.metadata,
    event.created_at
  FROM public.report_submission_events AS event
  WHERE event.report_id = p_report_id
  ORDER BY event.created_at DESC
  LIMIT GREATEST(COALESCE(p_limit, 25), 1);
$$;

GRANT EXECUTE ON FUNCTION public.insert_admin_audit_event(TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_report_submission_event(UUID, UUID, TEXT, UUID, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_report_integrity_snapshots(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_report_duplicate_cluster_members(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_report_submission_events(UUID, INTEGER) TO authenticated;

DROP FUNCTION IF EXISTS public.create_hazard_report(
  uuid, text, text, text, text, double precision, double precision, boolean, integer, text, timestamptz, text
);

DROP FUNCTION IF EXISTS public.create_hazard_report(
  uuid, text, text, text, text, double precision, double precision, boolean, integer, text, text, text, timestamptz, text
);

CREATE FUNCTION public.create_hazard_report(
  p_client_id uuid, p_user_phone text, p_user_name text, p_hazard_type text, p_description text,
  p_latitude double precision, p_longitude double precision, p_is_high_risk boolean DEFAULT false,
  p_people_at_risk integer DEFAULT null, p_urgency_level text DEFAULT null,
  p_immediate_danger_status text DEFAULT 'no', p_affected_people_band text DEFAULT null,
  p_event_time timestamptz DEFAULT now(), p_device_id text DEFAULT null
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid;
  v_existing_id uuid;
  v_recent_count integer;
  v_last_created timestamptz;
  v_device_last_created timestamptz;
  v_device_recent_count integer;
  v_device_hour_count integer;
  v_device_id text;
  v_report_location geography;
  v_metadata jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;

  v_device_id := NULLIF(BTRIM(COALESCE(p_device_id, '')), '');
  v_report_location := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;
  v_metadata := jsonb_build_object(
    'hazard_type', p_hazard_type,
    'latitude', p_latitude,
    'longitude', p_longitude
  );

  IF v_device_id IS NULL THEN
    PERFORM public.log_report_submission_event(
      NULL,
      v_user_id,
      NULL,
      p_client_id,
      'blocked',
      'device_id_required',
      v_metadata
    );
    RAISE EXCEPTION 'device_id_required' USING ERRCODE = '22023';
  END IF;

  SELECT id
  INTO v_existing_id
  FROM public.hazard_reports
  WHERE user_id = v_user_id
    AND hazard_type = p_hazard_type
    AND created_at > now() - interval '10 minutes'
    AND ST_DWithin(location, v_report_location, 50)
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    PERFORM public.log_report_submission_event(
      v_existing_id,
      v_user_id,
      v_device_id,
      p_client_id,
      'duplicate_linked',
      'duplicate_nearby_recent',
      v_metadata
    );
    RETURN v_existing_id;
  END IF;

  SELECT created_at INTO v_last_created
  FROM public.hazard_reports
  WHERE user_id = v_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_last_created IS NOT NULL AND v_last_created > now() - interval '30 seconds' THEN
    PERFORM public.log_report_submission_event(
      NULL,
      v_user_id,
      v_device_id,
      p_client_id,
      'blocked',
      'rate_limited_min_interval',
      jsonb_build_object('last_created_at', v_last_created) || v_metadata
    );
    RAISE EXCEPTION 'rate_limited_min_interval' USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*)::int INTO v_recent_count
  FROM public.hazard_reports
  WHERE user_id = v_user_id
    AND created_at > now() - interval '1 hour';

  IF v_recent_count >= 20 THEN
    PERFORM public.log_report_submission_event(
      NULL,
      v_user_id,
      v_device_id,
      p_client_id,
      'blocked',
      'rate_limited_hourly',
      jsonb_build_object('hourly_count', v_recent_count) || v_metadata
    );
    RAISE EXCEPTION 'rate_limited_hourly' USING ERRCODE = 'P0001';
  END IF;

  SELECT created_at INTO v_device_last_created
  FROM public.hazard_reports
  WHERE device_id = v_device_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_device_last_created IS NOT NULL AND v_device_last_created > now() - interval '20 seconds' THEN
    PERFORM public.log_report_submission_event(
      NULL,
      v_user_id,
      v_device_id,
      p_client_id,
      'blocked',
      'rate_limited_device_min_interval',
      jsonb_build_object('last_created_at', v_device_last_created) || v_metadata
    );
    RAISE EXCEPTION 'rate_limited_device_min_interval' USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*)::int INTO v_device_recent_count
  FROM public.hazard_reports
  WHERE device_id = v_device_id
    AND created_at > now() - interval '15 minutes';

  IF v_device_recent_count >= 6 THEN
    PERFORM public.log_report_submission_event(
      NULL,
      v_user_id,
      v_device_id,
      p_client_id,
      'blocked',
      'rate_limited_device_burst',
      jsonb_build_object('device_count_15m', v_device_recent_count) || v_metadata
    );
    RAISE EXCEPTION 'rate_limited_device_burst' USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*)::int INTO v_device_hour_count
  FROM public.hazard_reports
  WHERE device_id = v_device_id
    AND created_at > now() - interval '1 hour';

  IF v_device_hour_count >= 12 THEN
    PERFORM public.log_report_submission_event(
      NULL,
      v_user_id,
      v_device_id,
      p_client_id,
      'blocked',
      'rate_limited_device_hourly',
      jsonb_build_object('device_count_hourly', v_device_hour_count) || v_metadata
    );
    RAISE EXCEPTION 'rate_limited_device_hourly' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.hazard_reports(
    client_id, user_id, user_phone, user_name, hazard_type, description,
    location, latitude, longitude, is_high_risk, people_at_risk, urgency_level,
    immediate_danger_status, affected_people_band, status, event_time, device_id
  )
  VALUES (
    p_client_id,
    v_user_id,
    p_user_phone,
    NULLIF(p_user_name, ''),
    p_hazard_type,
    p_description,
    v_report_location,
    p_latitude,
    p_longitude,
    COALESCE(p_is_high_risk, false),
    p_people_at_risk,
    p_urgency_level,
    COALESCE(NULLIF(p_immediate_danger_status, ''), 'no'),
    CASE
      WHEN COALESCE(NULLIF(p_immediate_danger_status, ''), 'no') = 'yes'
        THEN COALESCE(NULLIF(p_affected_people_band, ''), 'unknown')
      ELSE NULL
    END,
    'pending',
    COALESCE(p_event_time, now()),
    v_device_id
  )
  RETURNING id INTO v_existing_id;

  PERFORM public.log_report_submission_event(
    v_existing_id,
    v_user_id,
    v_device_id,
    p_client_id,
    'accepted',
    'accepted',
    v_metadata
  );

  RETURN v_existing_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_hazard_report TO authenticated;

-- END MIGRATION: 035_report_fraud_hardening.sql
