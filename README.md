# Civil Alert System - Integrated Platform

**A Crowdsourced, AI-Enhanced Platform for Real-Time Coastal and Urban Flood Intelligence**

The Civil Alert System is a comprehensive, production-grade platform designed to bridge the gap between institutional early-warning models and ground-level realities during ocean and climate hazards (flooding, high waves, storm surges). 

This repository contains the complete full-stack solution, comprising a citizen-facing mobile application, an authority-facing web dashboard, and the unified serverless backend that powers both.

---

## 🏗️ Platform Architecture

The system is designed with three primary pillars:

### 1. Citizen Mobile Application (`/civil_alert_system`)
An offline-first, highly accessible mobile app built to capture ground-truth hazard reports from communities.
*   **Technologies:** Flutter (Dart), Riverpod (State Management), Hive (Offline queueing), Flutter Map.
*   **Key Features:**
    *   **Phone OTP Authentication:** Secure, frictionless login via Supabase Phone Auth.
    *   **Interactive Onboarding:** Guides new users through the app's purpose and usage.
    *   **Multi-Media Hazard Reporting:** Citizens submit GPS-tagged reports (High Waves, Tsunami, Storm, Flood) with up to 5 attachments — photos, videos, and audio recordings. Reports include urgency levels (Low/Medium/High) and a high-risk flag with estimated people at risk.
    *   **Two-Phase Upload with Progress Timeline:** Report data is submitted first, then media is uploaded separately for graceful partial-failure recovery. A live upload timeline overlay shows each step (report insert, media upload 1/N, finalization) with timestamps and percentage.
    *   **Offline-First Architecture:** Uses Hive to queue reports when offline. Auto-syncs when connectivity returns, with a visible pending-upload indicator and manual "Sync Now" button on the Profile screen.
    *   **Android Background Sync (WorkManager):** A periodic background task (every 15 min) auto-syncs any queued offline reports even when the app is closed or killed, with exponential backoff on failure.
    *   **Push Notifications (FCM):** Firebase Cloud Messaging delivers real-time push notifications to the phone for new advisories and report status changes — even when the app is in the background or terminated.
    *   **In-App Realtime Notifications:** Supabase Realtime subscriptions trigger local notifications when a new advisory is published or the user's own report status changes (e.g., "Your Flood report is now VERIFIED").
    *   **Report Feed (Community & Personal):** Citizens can view their own submitted reports and community reports from others nearby, filterable by time window (Now / This Week / This Month).
    *   **Official Advisories Feed:** Receive and view broadcast advisories pushed by authorities, color-coded by severity (Info / Watch / Warning), with region, date, and contact details.
    *   **Live Situational Map:** Interactive map displaying nearby hazard markers and advisory markers with marker clustering. Tapping a marker reveals a detail sheet with full description, media preview, location info, and a "Get Directions" link.
    *   **Profile & Sync Dashboard:** View personal submission history, sync status (online/offline), pending upload count, and trigger manual sync.
    *   **Multilingual Support (i18n):** English and Tamil.
    *   **Privacy Controls:** Options to reduce location precision on public maps.
    *   **Gamification:** Users earn points and badges for contributing verified, high-quality reports.

### 2. Authority & Analyst Dashboard (`/admin_web`)
A robust web-based command center designed for disaster management agencies and first responders to analyze incoming intelligence and coordinate responses.
*   **Technologies:** React (TypeScript), Vite, Material UI (MUI), Leaflet.js.
*   **Key Features:**
    *   **Secure Admin Authentication:** Email/password login via Supabase Auth with strict admin-only role enforcement — non-admin users are rejected at login. Protected routes block unauthenticated access.
    *   **Analytics Dashboard:** KPI cards showing Total Reports, Pending Review, High-Risk Alerts, Reports Today, Weekly Trend (%), Hotspot Clusters, False-Positive Rate, and Avg Verification Time. Breakdown charts by Hazard Type, Status, and Urgency Level.
    *   **Report Management:** Paginated, searchable, filterable table of all incoming reports. Filters include hazard type, urgency, status, date range (day/week picker), high-risk flag, has-media flag, and landmark proximity. Supports real-time auto-refresh via Supabase subscriptions.
    *   **Verification Workflow:** Detailed report dialog showing full description, all attached media (photo viewer, video player, audio player), GPS coordinates, user info (phone masked for privacy), and timestamp. Analysts set status: Pending → Verified → Rejected → Resolved.
    *   **Suspicious Report Flagging:** Automated flags for rapid submissions (3+ in 5 min), high hourly volume (8+/hour), repeated identical descriptions, and high-risk reports without media evidence.
    *   **AI-Generated Risk Zones:** Dedicated page for PostGIS DBSCAN-clustered hotspots. Each zone shows risk score, report count, verified count, radius, and last-seen timestamp. Analysts set zone status: Candidate → Verified → Suppressed → Locked (6-hour hold). One-click "Recompute Zones".
    *   **Live Map:** Leaflet-based map with hazard markers, advisory markers, risk zone overlays (color-coded by level), and user-drawn monitoring zones. Multiple basemap layers (street, satellite). Layer toggles for risk zones, candidate zones, suppressed zones, and monitoring zones.
    *   **Monitoring Zone Drawing:** Draw circle-based monitoring zones on the map with name, radius, and people count tracking. Zones are color-coded by population density (green → yellow → red → orange). Edit, resize, and delete zones with Supabase persistence.
    *   **Landmark Management:** Create and manage critical infrastructure landmarks (hospitals, shelters) with a radius. Filter all reports by proximity to a landmark.
    *   **Advisory Broadcasting:** Create and publish advisories with title, body, category (Food, Shelter, Medical, Rescue, Transport, Utilities, Evacuation), severity (Info/Watch/Warning), region, GPS, start/expiry dates, and emergency contact numbers. Pushed in real-time to the Citizen App.
    *   **CSV Export:** Export filtered report data as CSV for institutional reporting.

### 3. Unified Serverless Backend (`/supabase`)
A single, highly scalable backend that serves both frontends, ensuring data consistency, real-time updates, and stringent security.
*   **Technologies:** Supabase (PostgreSQL), PostGIS, Supabase Auth, Storage, Edge Functions.
*   **Key Features:**
    *   **Geospatial Mastery:** Heavily utilizes **PostGIS** for bounding-box queries, distance calculations, and DBSCAN clustering to generate risk zones directly in the database.
    *   **Intelligent Caching:** Cached risk zone tables with automated refresh to prevent expensive recalculations on every map pan/zoom.
    *   **Row Level Security (RLS):** Strict privacy controls ensure citizens can only access their own data, while analysts have restricted, role-based access for verifications.
    *   **Real-time Subscriptions:** Websocket channels push new reports, advisory changes, and zone updates to both frontends instantly.
    *   **Spam & Abuse Protection:** Database-level rate limiting (30-second minimum interval, hourly caps) and duplicate report deduplication logic.

---

## 🚀 Getting Started

To get the platform running locally, you need to set up the shared Supabase backend first, then launch the respective frontends.

### Step 1: Backend Setup (Supabase)
Both applications rely on a standardized Supabase database schema.
1. Create a [Supabase](https://supabase.com/) project.
2. Navigate to the SQL Editor in your Supabase dashboard.
3. Copy the contents of `combined_supabase_migrations.sql` found in the root of this repository.
4. Execute the SQL script. This will generate all necessary tables (reports, geofences, users, advisories), functions (PostGIS clustering), and security policies.
5. Note your **Project URL** and **Anon Key** from the project settings.

### Step 2: Citizen App Setup (Flutter)
1. Navigate to the mobile app directory:
   ```bash
   cd civil_alert_system
   ```
2. Install dependencies:
   ```bash
   flutter pub get
   ```
3. Configure environment variables (create a `.env` file):
   ```env
   SUPABASE_URL=your_project_url
   SUPABASE_ANON_KEY=your_anon_key
   ```
4. Run the app:
   ```bash
   flutter run
   ```
   *(For detailed app-specific documentation, see `civil_alert_system/README.md`)*

### Step 3: Admin Web Setup (React)
1. Navigate to the web app directory:
   ```bash
   cd admin_web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables (create a `.env.local` file):
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_GOOGLE_MAPS_API_KEY=your_optional_maps_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   *(For detailed web-specific documentation, see `admin_web/README.md`)*

---

## 🤝 Contributing

This platform is crucial for community safety during environmental events. Contributions to improve offline capabilities, enhance ML filtering, or optimize spatial queries are highly encouraged.

## 📄 License

[Insert License Details Here]
