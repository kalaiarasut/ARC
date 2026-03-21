# Civil Alert System — Feature Status Assessment

> A comprehensive audit of every implemented, partially implemented, and planned feature across the full-stack platform.

---

## ✅ Fully Completed Features

### Mobile App (Flutter)

| # | Feature | Status | Details |
|---|---------|--------|---------|
| 1 | Phone OTP Authentication | ✅ Complete | Supabase Phone Auth, full login/signup flow |
| 2 | Interactive Onboarding | ✅ Complete | Multi-step guide for new users |
| 3 | Multi-Media Hazard Reporting | ✅ Complete | Photo, video, audio capture (up to 5 attachments), hazard types (High Waves, Tsunami, Storm, Flood, Other), urgency levels (Low/Medium/High), high-risk flag, people-at-risk count |
| 4 | Two-Phase Upload | ✅ Complete | Report data submitted first, media uploaded separately; partial-failure recovery queues failed media for retry |
| 5 | Upload Progress Timeline | ✅ Complete | Visual overlay showing each upload step with timestamps, percentage, and completion/failure state |
| 6 | Offline-First Queueing (Hive) | ✅ Complete | Reports queued locally when offline, pending indicator visible, manual "Sync Now" button |
| 7 | Android Background Sync (WorkManager) | ✅ Complete | Periodic task every 15 min, exponential backoff, runs even when app is killed |
| 8 | Report Sync Service | ✅ Complete | Automatically syncs queued reports when connectivity returns |
| 9 | Report Feed (Community & Personal) | ✅ Complete | Toggle between "My Reports" and "Community" reports, filterable by Now/Week/Month |
| 10 | Official Advisories Feed | ✅ Complete | Color-coded by severity (Info/Watch/Warning), shows region, date, contact details |
| 11 | Live Situational Map | ✅ Complete | Flutter Map with hazard markers, advisory markers, risk zone overlays, marker clustering, detail bottom sheets with media preview and "Get Directions" |
| 12 | Risk Zones on Mobile Map | ✅ Complete | Fetches cached and on-demand DBSCAN risk zones from PostGIS, renders color-coded circle overlays (yellow/orange/red) |
| 13 | FCM Push Notifications | ✅ Complete | Firebase Cloud Messaging for new advisories and report status changes; background + foreground + terminated |
| 14 | In-App Realtime Notifications | ✅ Complete | Supabase Realtime subscriptions trigger local notifications for advisory inserts and report status updates |
| 15 | Profile & Sync Dashboard | ✅ Complete | Shows submission history, sync status, pending upload count, manual sync trigger, connectivity indicator |
| 16 | Multilingual Support (i18n) | ✅ Complete | English and Tamil with localized strings throughout all screens |
| 17 | Report Detail Screen | ✅ Complete | Full description, media viewer (photo/video/audio), GPS coordinates, timestamp, hazard type |
| 18 | Gamification System | ✅ Complete | Points, badges, leaderboard. Server-side triggers award points on report submit/verify/reject. 10 badge types. Achievements screen, leaderboard screen, profile stats card. Admin dashboard Top Citizens widget |
| 19 | Notifications Screen | ✅ Complete | Combined feed of advisory broadcasts and report status changes (verified/rejected), accessible from home header notification icon |
| 20 | Offline Map Tiles | ✅ Complete | FMTC auto-caches viewed tiles for offline use; dedicated Offline Maps screen to bulk-download regions by radius (5/10/25 km) with progress, manage/delete cached regions |

### Admin Dashboard (React)

| # | Feature | Status | Details |
|---|---------|--------|---------|
| 18 | Secure Admin Authentication | ✅ Complete | Email/password via Supabase Auth, admin-only role enforcement (`app_roles` table), non-admin users rejected at login |
| 19 | Protected Routes | ✅ Complete | Unauthenticated users redirected to login page |
| 20 | Analytics Dashboard | ✅ Complete | 8 KPI cards (Total, Pending, High-Risk, Today, Weekly Trend %, Hotspot Clusters, False-Positive Rate, Avg Verification Time), breakdown charts by Hazard/Status/Urgency |
| 21 | Report Management Table | ✅ Complete | Paginated, searchable, multi-filter (hazard type, urgency, status, date range, high-risk, has-media, landmark proximity), day/week picker, auto-refresh toggle |
| 22 | Verification Workflow | ✅ Complete | Full report detail dialog with photo viewer, video player, audio player, GPS, masked phone. Status flow: Pending → Verified → Rejected → Resolved |
| 23 | Suspicious Report Flagging | ✅ Complete | Automated flags: rapid submissions (3+ in 5 min), high hourly volume (8+/hour), repeated descriptions, high-risk without media |
| 24 | AI-Generated Risk Zones | ✅ Complete | PostGIS DBSCAN clustering, zone table with risk score/report count/radius/timestamp. Status: Candidate → Verified → Suppressed → Locked (6h hold). One-click recompute |
| 25 | Live Map (Leaflet) | ✅ Complete | Hazard markers, advisory markers, risk zone overlays, monitoring zones. Multiple basemaps (street/satellite). Layer toggles. Recentering. Report count display |
| 26 | Monitoring Zone Drawing | ✅ Complete | Draw circle zones with Leaflet Draw, name, radius, people count. Color-coded by population (green → yellow → red → orange). Edit/resize/delete with Supabase persistence |
| 27 | Landmark Management | ✅ Complete | Create/edit/delete landmarks with name, coordinates, radius. Filter reports by proximity |
| 28 | Advisory Broadcasting | ✅ Complete | Full form: title, body, 7 categories, 3 severities, region, GPS, start/expiry dates, emergency contacts (phone, WhatsApp, hotline). Pushed in real-time |
| 29 | CSV Export | ✅ Complete | Export filtered reports as timestamped CSV files |
| 30 | Realtime Updates | ✅ Complete | Supabase subscriptions auto-refresh report table on new incoming reports |
| 31 | Recent Reports Table | ✅ Complete | Dashboard widget showing latest 10 reports with quick navigation to full report view |

### Backend (Supabase)

| # | Feature | Status | Details |
|---|---------|--------|---------|
| 32 | PostGIS Spatial Queries | ✅ Complete | Bounding-box queries, distance calculations, DBSCAN clustering, coordinate-based filtering |
| 33 | Cached Risk Zone Tables | ✅ Complete | `get_cached_risk_zones` and `calculate_risk_zones_on_demand` functions for performance |
| 34 | Row Level Security (RLS) | ✅ Complete | Citizens see only own data, analysts get role-based access |
| 35 | Realtime Subscriptions | ✅ Complete | Websocket channels for reports, advisories, and zones to both frontends |
| 36 | Rate Limiting | ✅ Complete | 30-second minimum interval, hourly caps, database-level enforcement |
| 37 | Duplicate Deduplication | ✅ Complete | Backend-level dedupe logic that links duplicate submissions to existing reports |
| 38 | Supabase Storage | ✅ Complete | Media upload (photos, videos, audio) with per-report/per-user path structure |
| 39 | Push Token Management | ✅ Complete | FCM token upsert/disable via `push_tokens` table |

---

## 🟡 Partially Implemented Features

| # | Feature | Status | What Exists | What's Missing |
|---|---------|--------|-------------|----------------|
| 1 | **Privacy Controls** | 🟡 Not Needed | `privacy_provider.dart` with `reduceMapPrecision` toggle, `privacy_controls_screen.dart` UI with switch | The toggle stores a preference but coordinate fuzzing is **not applied** during report submission or map display. The setting is saved but has no downstream effect |
| 2 | **FCM Deep-Linking** | ✅ Complete | Implemented notification tap deep-links for foreground/background/terminated flows. Taps route to `ReportDetailsScreen` (`report_id`) or `AdvisoryDetailsScreen` (`advisory_id`) via app navigator and notification payload parsing |   |
| 3 | **Admin Quick Verify** | ✅ Complete | Added quick-verify action in `RecentReportsTable.tsx` wired to `hazardService.verifyReport` from Dashboard, with loading state and optimistic status updates |   |
| 4 | **Map Image/PDF Export** | ✅ Complete | Export button in Live Map toolbar — PNG (high-res via html2canvas) and A4 landscape PDF (jsPDF with header, timestamp, watermark) |
| 5 | **Geofencing Page** | 🟡 Partial | Monitoring zones can be drawn via `LeafletMapWithDraw` on the Live Map page | No dedicated "Geofencing" page exists. Geofences are only monitoring-zone circles — no polygon support, no automated alerting when citizens enter/exit zones |

---

## 🔵 Features That Can Be Improved

| # | Feature | Current State | Suggested Improvement |
|---|---------|--------------|----------------------|
| 1 | **Offline Queue Visibility** | ✅ Complete | Dedicated `QueuedReportsScreen` linked from Profile and Updates. Shows per-item queue status, retry count, attachments, error reason, next retry timing, and delete action for stuck reports | � |
| 2 | **Report Filtering** | ✅ Complete | Mobile app includes Hazard Type and Urgency drop-down filters alongside time windows. Admin has full multi-filter |
| 3 | **Advisory Targeting** | ✅ Complete | Advisories can be targeted by GPS radius. Mobile app drops targeted notifications if user is out of bounds |
| 4 | **Map Performance** | ✅ Complete | Admin Live Map now debounces viewport-driven risk-zone refreshes and uses client-side tile/viewport caching with invalidation on refresh and zone mutations | � |
| 5 | **Media Compression** | Photos/videos uploaded at original resolution | Add client-side compression (image resize, video transcode) before upload to reduce bandwidth and storage costs |
| 6 | **Report Detail on Admin** | Full-page dialog with all media inline | Add image zoom/lightbox, video seek preview, and audio waveform visualization for better evidence review |
| 7 | **Notification Granularity** | All-or-nothing notification toggle | Let users choose: advisory notifications only, report status only, or both. Per-severity filtering (e.g., only Warning-level advisories) |
| 8 | **Admin Dashboard Trends** | Weekly trend percentage only | Add time-series charts (reports per day/week over last month), geographic distribution heatmap on dashboard |
| 9 | **Multilingual Coverage** | English and Tamil | Add Hindi, Malayalam, Telugu, Kannada, and other regional languages for broader coastal India coverage |
| 10 | **Download/Share Reports** | Citizens can view their reports | Allow citizens to download or share their submitted reports as PDF or shareable link |
| 11 | **Monitoring Zone Alerts** | Zones drawn with people count | Add automated alerts when report density exceeds a threshold within a monitoring zone |
| 12 | **Admin Audit Trail** | Report status changes happen instantly | Log who changed what status and when, for accountability and dispute resolution |

---

## 🔴 New Features to Implement

| # | Feature | Priority | Description |
|---|---------|----------|-------------|
| 1 | **AI/NLP Report Triage** | 🔴 High | Automated severity scoring of report descriptions using NLP. Spam/noise filtering using lightweight ML models (Scikit-learn, HuggingFace). Zero code exists — part of Phase 1 roadmap |
| 2 | **Python Processing Pipeline** | 🔴 High | Dedicated backend pipeline for asynchronous report analysis, classification, and enrichment. Part of Phase 1 roadmap |
| 3 | **Institutional Weather API Integration** | 🟠 Medium | Ingest meteorological data feeds (IMD, OpenWeatherMap) to enrich risk zones with weather context. Part of Phase 2 roadmap |
| 4 | **Dark Mode** | 🟠 Medium | No dark mode implementation exists. Add theme toggle for both mobile (Flutter ThemeMode) and admin web (MUI dark theme) |
| 5 | **Citizen-to-Citizen Messaging** | 🟡 Low | Allow citizens in the same area to communicate during active events. Could use Supabase Realtime channels |
| 6 | **iOS Push Notifications** | 🟠 Medium | FCM code only runs on Android (`if (!Platform.isAndroid) return`). APNs integration needed for iOS |
| 7 | **Geofence Entry/Exit Alerts** | 🟠 Medium | Alert citizens when they enter a high-risk geofenced zone. Requires background location tracking on mobile |
| 8 | **Report Comments/Threads** | 🟡 Low | Allow analysts to add notes/comments to reports. Citizens could see status update reasons |
| 9 | **Multi-Tenant / Multi-District** | 🟡 Low | Support multiple districts/agencies with data isolation. Currently single-tenant |
| 10 | **Photo AI Analysis** | 🟠 Medium | Auto-classify uploaded photos to detect flood water levels, infrastructure damage, etc. using computer vision |
| 11 | **Accessibility (a11y)** | 🟠 Medium | Screen reader support, high-contrast mode, and semantic labels throughout the mobile app |
| 12 | **Export API for Institutions** | 🟡 Low | REST/GraphQL API for external systems (government dashboards, GIS tools) to pull report data |
| 13 | **User Account Deletion** | 🟠 Medium | GDPR/compliance: allow citizens to delete their account and all associated data |

---

## Summary

| Category | Count |
|----------|-------|
| ✅ Fully Completed | 44 features |
| 🟡 Partially Implemented | 3 features |
| 🔵 Can Be Improved | 10 features |
| 🔴 New to Implement | 12 features |


