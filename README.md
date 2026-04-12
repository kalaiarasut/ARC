# Civil Alert System (ARC)

Citizen hazard reporting, official advisory publishing, spatial risk analysis, and admin operations on a shared Supabase backend.

This repository contains three main parts:

- `mobile_app/`: a Flutter citizen app branded as `ARC` for onboarding, phone OTP sign-in, geotagged hazard reporting, advisories, maps, offline queueing, and gamification.
- `admin_web/`: a React + Vite admin console for report review, advisories, zones, map operations, user and organization management, and verification workflows.
- `combined_supabase_migrations.sql` plus `mobile_app/supabase/functions/`: the database schema, RLS policies, RPCs, triggers, and Supabase Edge Functions that power both clients.

This README describes the checked-in code as it exists in this repository. Where the repo has gaps, mismatches, or manual steps, they are called out explicitly.

## Repository Overview

| Path | Purpose |
| --- | --- |
| `mobile_app/` | Flutter citizen application |
| `admin_web/` | React 19 + TypeScript + Vite admin dashboard |
| `combined_supabase_migrations.sql` | Canonical all-in-one database bootstrap script |
| `030_admin_live_presence.sql` | Standalone copy of the live-presence migration already embedded in `combined_supabase_migrations.sql` |
| `mobile_app/supabase/functions/` | Supabase Edge Functions used for push delivery, translation, zone heartbeats, advisory publishing, and seed data |
| `Guide.md` | Product vision document |
| `Feature_Status_Assessment.md` | Internal feature/status planning note |

## What Is Implemented

### Citizen Mobile App

The Flutter app in `mobile_app/` is the citizen-facing client. The runtime entrypoint is `mobile_app/lib/main.dart`, and the first-run flow is:

`Splash -> Onboarding -> Login -> OTP -> User details -> Home`

Implemented user-facing areas include:

- Phone OTP sign-in through Supabase Auth, with India-specific `+91` number handling.
- A bottom-navigation home shell with Home, Map, Updates, and Profile, plus a center FAB for hazard reporting.
- Hazard reporting with hazard type, description, GPS capture, urgency, high-risk flag, people-at-risk count, and up to 5 media attachments.
- Media compression before upload, plus a 10 MB post-compression upload limit.
- Offline report queueing with local persistence, retry/backoff, manual sync, foreground auto-sync, and Android WorkManager periodic sync.
- Situational map views for verified reports, risk zones, monitoring zones, and localized advisories.
- Advisory feed and detail views with filtering and localization.
- Profile/settings screens for queued reports, sync controls, achievements, leaderboard, privacy controls, language, theme, offline maps, notification settings, and zone monitoring.
- Gamification backed by points, badges, leaderboard, and achievement screens.
- Offline map tile caching using `flutter_map_tile_caching`.

Supported Flutter targets exist for Android, iOS, web, Windows, Linux, and macOS, but the codebase is practically mobile-first and especially Android-first. Shared app code imports `dart:io` directly, and Android-only logic gates WorkManager, FCM startup, and zone monitoring, so web and desktop should currently be treated as incomplete.

Localization coverage is broader than the previous README claimed. The app declares 10 supported locales:

- `bn`
- `en`
- `gu`
- `hi`
- `kn`
- `ml`
- `mr`
- `or`
- `ta`
- `te`

### Admin Dashboard

The admin dashboard in `admin_web/` is a React 19 + TypeScript + Vite + MUI SPA backed by Supabase.

Routes currently wired in `admin_web/src/App.tsx`:

- `/` and `/login`: admin sign-in
- `/dashboard`: KPI dashboard, recent reports, top citizens, quick verification
- `/reports`: report queue, filtering, media review, status updates, audit history, CSV export, translation actions
- `/map`: live Leaflet map, monitoring-zone CRUD, generated zone overlays, curated seed actions, live presence layers, map export
- `/advisories`: create, edit, delete, translate, and publish official advisories
- `/generated-zones`: recompute and moderate generated risk zones, plus monitoring-zone entry/exit activity
- `/users`, `/users/create`, `/users/:id`, `/users/:id/edit`: user management
- `/organizations`: organization management
- `/verifications`, `/verifications/:caseId`: verification queue and case review
- `/audit-logs`: audit workspace UI
- `/api-reference`: hand-authored API/reference page

Access is strictly admin-only. The dashboard uses Supabase email/password auth, but login succeeds only when the authenticated user also has `app_roles.role = 'admin'`.

### Supabase Backend

The backend is centered on Supabase Postgres with `postgis`, `pgcrypto`, and `uuid-ossp` enabled. The checked-in schema in `combined_supabase_migrations.sql` includes:

- `app_roles` for admin role gating
- `hazard_reports` for citizen reports
- `official_advisories` and `official_advisory_translations`
- `risk_zones`, `risk_zones_cached`, and `zone_settings`
- `monitoring_zones`, `device_zone_presence`, and `zone_transition_events`
- `push_tokens` and `notification_outbox`
- `citizen_points`, `citizen_badges`, and `badge_definitions`
- `report_status_audit`
- live presence and exact-location access tables such as `device_location_heartbeats`, `live_location_sessions`, and `live_location_audit_logs`

Backend behavior implemented in SQL includes:

- RLS policies for citizen/admin access separation
- `SECURITY DEFINER` helper functions such as `is_admin()` and permission checks
- report creation with duplicate suppression and rate limiting through `create_hazard_report(...)`
- viewport and detail RPCs such as `get_verified_reports_in_bounds`, `get_cached_risk_zones`, `get_user_reports_on_map`, and `get_verified_report_details`
- database-side risk-zone generation and moderation support
- push notification enqueueing on report status changes
- report status audit logging
- gamification triggers for points and badges
- monitoring-zone occupancy and transition processing
- anonymized and exact live-presence admin workflows

The SQL bootstrap also attempts to create the `hazard-media` storage bucket and related storage policies.

## Technology Stack

### Mobile

- Flutter / Dart (`sdk: ^3.10.4`)
- Riverpod
- Supabase Flutter
- Hive
- `flutter_map`
- `flutter_map_tile_caching`
- WorkManager
- Firebase Messaging

### Admin Web

- React 19
- TypeScript
- Vite
- Material UI
- Leaflet
- Supabase JS

### Backend

- Supabase Postgres
- PostGIS
- Supabase Auth
- Supabase Storage
- Supabase Realtime
- Supabase Edge Functions

## Repository Structure

```text
.
|-- admin_web/
|   |-- src/
|   |-- map_export/
|   |-- package.json
|   `-- vercel.json
|-- mobile_app/
|   |-- lib/
|   |-- supabase/functions/
|   |-- android/
|   |-- ios/
|   |-- web/
|   |-- windows/
|   |-- linux/
|   |-- macos/
|   `-- pubspec.yaml
|-- combined_supabase_migrations.sql
|-- 030_admin_live_presence.sql
|-- Export_API_Documentation.md
|-- Feature_Status_Assessment.md
|-- Guide.md
|-- Requirements.md
`-- Technology Stack.md
```

## Prerequisites

You need the following before the full system can run locally:

- A Supabase project with PostGIS available
- Flutter SDK compatible with `mobile_app/pubspec.yaml`
- `npm` for the admin dashboard
- Firebase project files if you want Android FCM push notifications
- A deployment workflow for Supabase Edge Functions

Important repository note:

- The repo does not include a checked-in `supabase/config.toml`, so if you want to deploy the functions with the Supabase CLI, initialize or link your local Supabase project first.

## 1. Bootstrap Supabase

### 1.1 Create the Supabase project

Create a Supabase project and make sure the project supports PostGIS extensions.

### 1.2 Run the schema bootstrap

Use the SQL editor in Supabase and run the full contents of:

- `combined_supabase_migrations.sql`

Do not run `030_admin_live_presence.sql` afterward unless you intentionally want to reapply that migration manually. Its contents are already embedded in `combined_supabase_migrations.sql`.

### 1.3 Create at least one admin user

The admin dashboard rejects all non-admin users. After creating an auth user in Supabase Auth, insert a matching row into `public.app_roles`:

```sql
insert into public.app_roles (user_id, role)
values ('<AUTH_USER_UUID>', 'admin')
on conflict (user_id) do update set role = excluded.role;
```

Without this step, the admin dashboard login and admin-only Edge Functions will not work.

### 1.4 Deploy the Edge Functions

The repository contains these Supabase Edge Functions under `mobile_app/supabase/functions/`:

- `process_zone_heartbeat`
- `push_sender`
- `translate_report_for_admin`
- `process_pending_report_translations`
- `analyze_report_ai`
- `process_pending_report_ai`
- `translate_advisory_preview`
- `publish_advisory_with_translations`
- `admin_seed_curated_reports`
- `admin_clear_curated_seed`

Shared helper files in the same directory support admin-authenticated service-role access and translation logic.

### 1.5 Configure required secrets

At minimum, the checked-in functions expect some combination of:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FCM_SERVER_KEY`
- `SARVAM_API_KEY` or `SARVAM_API_KEYS`
- `SARVAM_BASE_URL` (optional)
- `REPORT_TRANSLATION_WORKER_SECRET`
- `GROQ_API_KEY`
- `REPORT_AI_WORKER_SECRET`

Optional translation worker tuning variables referenced in the repo:

- `REPORT_TRANSLATION_BATCH_SIZE`
- `REPORT_TRANSLATION_MAX_BATCH_SIZE`
- `REPORT_TRANSLATION_CONCURRENCY`
- `REPORT_TRANSLATION_MAX_CONCURRENCY`

Optional AI worker tuning variables referenced in the repo:

- `GROQ_BASE_URL`
- `REPORT_AI_TEXT_MODEL`
- `REPORT_AI_VISION_MODEL`
- `REPORT_AI_TRANSCRIPTION_MODEL`
- `REPORT_AI_BATCH_SIZE`
- `REPORT_AI_MAX_BATCH_SIZE`
- `REPORT_AI_CONCURRENCY`
- `REPORT_AI_MAX_CONCURRENCY`
- `REPORT_AI_MAX_IMAGES`
- `REPORT_AI_MAX_AUDIO`
- `REPORT_AI_MAX_VIDEO`

Operational notes:

- `push_sender` is intended to run on a recurring cadence and still uses the legacy FCM HTTP API.
- translation workers use Sarvam-based translation helpers.
- report AI workers use Groq-backed text analysis in the current checked-in foundation.

### 1.6 Report AI setup

The current AI implementation is a backend worker foundation, not a fully finished multimodal pipeline yet.

What the checked-in code currently supports:

- `report_ai_analysis`, `report_ai_runs`, and `report_ai_feedback` tables
- automatic queue records through database triggers when reports change
- automatic AI scoring after report translation completes
- a single-report AI scorer through `analyze_report_ai`
- a batch worker through `process_pending_report_ai` for retries, stale rows, and backfill
- admin queue sorting and filtering by stored AI priority

What still needs additional implementation later:

- deeper production tuning for scheduling and retry cadence
- deploying and scheduling the external video-frame worker in the environment that has `ffmpeg`

To enable the current AI foundation:

1. Apply `034_report_ai_scoring.sql` or re-run `combined_supabase_migrations.sql` in a controlled migration flow.
2. Deploy the new Edge Functions:
   - `analyze_report_ai`
   - `process_pending_report_ai`
3. Configure at least:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GROQ_API_KEY`
   - `REPORT_AI_WORKER_SECRET`
4. Store these Vault secrets if you want database-side scheduling:
   - `project_url`
   - `report_ai_worker_secret`
5. Trigger `process_pending_report_ai` on a schedule or invoke it manually.

Example Vault setup:

```sql
select vault.create_secret('https://your-project-ref.supabase.co', 'project_url');
select vault.create_secret('your-worker-secret', 'report_ai_worker_secret');
```

For manual invocation from Windows PowerShell, the repo now includes:

- `scripts/invoke-report-ai-worker.ps1`

Example:

```powershell
$env:SUPABASE_URL = "https://your-project.supabase.co"
$env:REPORT_AI_WORKER_SECRET = "your-worker-secret"
.\scripts\invoke-report-ai-worker.ps1 -Limit 10 -Concurrency 2
```

The repo now also includes `036_report_ai_scheduler.sql`, which creates:

- `public.invoke_report_ai_worker(batch_limit, batch_concurrency)`
- `public.schedule_report_ai_worker(cron_expression, batch_limit, batch_concurrency)`

If Vault secrets are present when that migration runs, it auto-schedules the AI worker every 5 minutes. If not, it skips safely and you can schedule it later with:

```sql
select public.schedule_report_ai_worker('*/5 * * * *', 10, 2);
```

### 1.7 Optional video-frame worker

True video visual analysis is implemented as a separate Node worker because the checked-in Edge Function path does not bundle `ffmpeg`.

The repo includes:

- `scripts/process-report-ai-videos.mjs`

It:

- finds reports with videos that still need frame analysis
- downloads the video
- extracts sample frames with `ffmpeg`
- sends those frames to the Groq vision model
- writes the enriched video score and frame findings back into `report_ai_analysis`

Required environment variables for this worker:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY`

Optional:

- `GROQ_BASE_URL`
- `REPORT_AI_VISION_MODEL`
- `REPORT_AI_VIDEO_FRAME_COUNT`
- `REPORT_AI_VIDEO_WORKER_LIMIT`
- `REPORT_AI_FFMPEG_PATH`
- `REPORT_AI_FFPROBE_PATH`

Example:

```powershell
$env:SUPABASE_URL = "https://your-project-ref.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"
$env:GROQ_API_KEY = "your-groq-key"
$env:REPORT_AI_FFMPEG_PATH = "ffmpeg"
$env:REPORT_AI_FFPROBE_PATH = "ffprobe"
node .\scripts\process-report-ai-videos.mjs
```

### 1.8 Optional GitHub Actions runner for video AI

If you want scheduled or manual video-frame processing without running the worker on your own machine, the repo now includes:

- `.github/workflows/process-report-ai-videos.yml`

It:

- runs every 10 minutes
- can also be triggered manually from the GitHub Actions tab
- installs `ffmpeg` on the GitHub-hosted runner
- runs `scripts/process-report-ai-videos.mjs`

Set these GitHub repository secrets before enabling it:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY`

Optional GitHub repository secrets:

- `GROQ_BASE_URL`
- `REPORT_AI_VISION_MODEL`
- `REPORT_AI_VIDEO_WORKER_LIMIT`
- `REPORT_AI_VIDEO_FRAME_COUNT`

Manual runs can override:

- `report_ai_video_worker_limit`
- `report_ai_video_frame_count`

If you want the admin web UI to trigger this workflow through Supabase, also set these Supabase Edge Function secrets:

- `GITHUB_ACTIONS_TOKEN`
- `GITHUB_ACTIONS_REPO_OWNER`
- `GITHUB_ACTIONS_REPO_NAME`

Optional Supabase Edge Function secrets:

- `GITHUB_API_URL`
- `GITHUB_ACTIONS_WORKFLOW_ID`
- `GITHUB_ACTIONS_WORKFLOW_REF`

Recommended values:

- `GITHUB_ACTIONS_WORKFLOW_ID=process-report-ai-videos.yml`
- `GITHUB_ACTIONS_WORKFLOW_REF=main`

## 2. Configure and Run the Citizen App

### 2.1 Install dependencies

```bash
cd mobile_app
flutter pub get
```

### 2.2 Configure Supabase

The Flutter app is not currently `.env`-driven. Update the hardcoded values in:

- `mobile_app/lib/core/supabase_config.dart`

Replace the checked-in URL and anon key with your own Supabase project values.

### 2.3 Optional but usually required Android push setup

If you want Android FCM push notifications:

- add `mobile_app/android/app/google-services.json`
- add the corresponding iOS Firebase files if you plan to support iOS
- make sure your Firebase project matches the app you are building

This repository does not include `google-services.json`, `GoogleService-Info.plist`, or `firebase_options.dart`.

### 2.4 Run the app

```bash
flutter run
```

### Mobile-specific notes

- OTP login is hardcoded around India-format phone numbers and prepends `+91`.
- Android background sync, FCM bootstrap, and zone monitoring are guarded by `Platform.isAndroid`.
- Web and desktop targets exist in the Flutter scaffold, but the shared codebase currently imports `dart:io`, so those targets are not documented here as production-ready.
- The checked-in Android package identifier is still `com.example.civil_alert_system`.

## 3. Configure and Run the Admin Dashboard

### 3.1 Install dependencies

```bash
cd admin_web
npm install
```

### 3.2 Create the local env file

Create `admin_web/.env.local` with at least:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Accepted fallback names are also present in the codebase, but `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are the primary documented variables.

Optional:

```env
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

Note that `VITE_GOOGLE_MAPS_API_KEY` is only consumed by `GoogleMapDashboard`, which is not currently routed from `admin_web/src/App.tsx`.

### 3.3 Start the dev server

```bash
npm run dev
```

Other useful scripts:

```bash
npm run build
npm run lint
npm run preview
```

### Admin-specific notes

- Login uses Supabase email/password auth.
- A valid auth account is not enough on its own; the user must also exist in `public.app_roles` with `role = 'admin'`.
- The Vercel config in `admin_web/vercel.json` is set up for SPA route rewrites.

## Edge Function Responsibilities

| Function | Purpose |
| --- | --- |
| `process_zone_heartbeat` | Accepts device heartbeats, processes monitoring-zone presence, and queues localized zone notifications |
| `push_sender` | Drains `notification_outbox` and sends FCM messages |
| `translate_report_for_admin` | Translates a single report description for admin review |
| `process_pending_report_translations` | Batch worker for queued report translations |
| `analyze_report_ai` | Runs AI scoring for a single report and stores the latest priority snapshot |
| `process_pending_report_ai` | Batch worker that scores queued or stale reports for the admin review queue |
| `translate_advisory_preview` | Generates multilingual advisory preview translations for admins |
| `publish_advisory_with_translations` | Publishes or updates advisories with reviewed translations |
| `admin_seed_curated_reports` | Creates demo seed users, media, and curated reports |
| `admin_clear_curated_seed` | Removes curated seed data |

## Key Database and RPC Surface

Important checked-in backend entry points include:

- `create_hazard_report(...)`
- `get_verified_reports_in_bounds(...)`
- `get_cached_risk_zones(...)`
- `calculate_risk_zones_on_demand(...)`
- `get_user_reports_on_map(...)`
- `get_verified_report_details(...)`
- `admin_get_monitoring_zones()`
- `admin_get_zone_transition_events(...)`
- `process_zone_heartbeat_state(...)`
- `admin_get_live_presence_anonymized(...)`
- `admin_start_live_location_session(...)`
- `admin_stop_live_location_session(...)`
- `admin_get_live_exact_pins(...)`

The admin dashboard and mobile app also call additional RPCs for advisory localization and publishing workflows. See the caveats section below for current repository mismatches.

## Related Documents

- `Guide.md`
- `Feature_Status_Assessment.md`
- `admin_web/map_export/README.md`

## Known Gaps, Caveats, and Repository Mismatches

These are important if you are trying to run or extend the project.

### Configuration and platform caveats

- The Flutter app does not read Supabase credentials from environment variables; it uses hardcoded constants in `mobile_app/lib/core/supabase_config.dart`.
- Firebase project files are not included in the repo.
- Android package metadata is still placeholder-level: `com.example.civil_alert_system`.
- Offline maps currently use a hardcoded Bangalore fallback center in the checked-in implementation.
- There is no `mobile_app/README.md` even though the previous root README referenced one.

### SQL and RPC mismatch caveats

- The mobile app calls `get_official_advisories_localized`, `get_official_advisory_localized`, and `get_reports_near_location`, but those function definitions are not present in the checked-in SQL files in this repository.
- `publish_advisory_with_translations` calls `admin_publish_official_advisory_with_translations`, but that RPC is also not present in the checked-in SQL files.
- In other words: the mobile app and advisory publish flow currently assume backend objects that are not fully represented by the repository's checked-in SQL bootstrap alone.

### UI and testing caveats

- `admin_web/src/pages/AuditLogs.tsx` currently uses mock data rather than a live backend integration.
- The admin login screen includes demo autofill credentials in the UI, but real login still depends on a real Supabase admin account.
- Meaningful automated test coverage is largely absent:
  - the Flutter app only includes the default counter smoke test in `mobile_app/test/widget_test.dart`
  - no admin web test/spec files are checked in

### Licensing

- No root `LICENSE` file is present in the repository.

## Current Recommendation

If you are onboarding this project locally, follow this order:

1. Bootstrap Supabase with `combined_supabase_migrations.sql`.
2. Create an auth user and grant `app_roles.role = 'admin'`.
3. Decide whether you need the missing advisory/localization RPCs and add them before relying on the full mobile advisory flow.
4. Deploy the Edge Functions and configure secrets.
5. Replace the hardcoded Flutter Supabase credentials.
6. Add Firebase config files if you need Android push notifications.
7. Run `mobile_app` and `admin_web` separately.

That order matches the actual dependencies in the checked-in code and avoids the biggest setup dead ends.
