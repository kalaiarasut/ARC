🧱 Complete Technology Stack
(Production-Ready, Free-Tier, No Self-Hosting)
1️⃣ Citizen Mobile Application
Framework

Flutter (Dart) ✅

Open-source

Cross-platform (Android first)

Offline-first capable

Stable for long-term deployments

State Management

Riverpod (preferred) or Bloc

Offline Storage & Sync

SQLite (sqflite) – structured offline data

Hive – fast local cache

Manual sync logic (explicit, reliable, disaster-safe)

Networking

Dio

Retry & timeout handling

Background sync support

Background Tasks

WorkManager (Android)

Deferred uploads

Retry on network availability

Media Capture & Processing

camera

image_picker

FFmpeg-based open-source compression plugins

Maps & Location

flutter_map + OpenStreetMap

Fully free

No API keys

No usage billing

Localization & Accessibility

flutter_localizations

Noto (Indic) font family

Large touch targets, high-contrast UI

2️⃣ Authority & Analyst Web Platform
Frontend Framework

React (TypeScript) ✅

UI & Visualization

Leaflet.js (OpenStreetMap)

Recharts / D3.js – analytics & trends

Material UI (community) or Ant Design

Redux Toolkit – state management

Features Supported

Live maps & hotspots

Report verification workflow

Filters (time, hazard type, severity)

Analytics dashboards

3️⃣ Backend Platform (Unified – Supabase Only)

No self-hosting. No servers. No Firebase.

Backend-as-a-Service

Supabase (Free Tier) ✅

Authentication & Identity

Supabase Auth

Email / password

Phone OTP (optional)

JWT-based authentication

Role-based access (citizen / authority / analyst)

Primary Database

PostgreSQL (Supabase Managed)

PostGIS enabled

Used for:

Hazard reports

Geospatial queries

Hotspot generation

Time-series analytics

Verification status

Audit trails

Database Security

Row Level Security (RLS)

Citizens can access only their data

Authorities have scoped access

Analysts get read-only analytical views

Media Storage

Supabase Storage (Free Tier)

Secure object storage

Role-based access

Media linked via DB references

Retention handled logically (via DB + policies)

Backend Logic

Supabase Edge Functions

Serverless

Verification triggers

Notification hooks

Scheduled cleanup tasks

4️⃣ Machine Learning & AI Stack

Training offline, inference integrated cleanly

Core ML Frameworks

Python

PyTorch

HuggingFace Transformers

NLP Models

IndicBERT (AI4Bharat – Indian languages)

DistilBERT (lightweight inference)

ML Tasks

Hazard classification

Urgency estimation

Credibility risk scoring (not truth detection)

Language detection

Media Authenticity (Free Methods)

EXIF metadata analysis

Perceptual hashing (duplicate / reused media)

Open-source AI-generated media risk detectors
(flagging only, never auto-verdicts)

Training & Model Management

Offline training (local / academic compute)

Human-in-the-loop labeling

Periodic retraining

MLflow (open-source) for model versioning

5️⃣ Spatial Analytics & Hotspot Detection
Techniques

PostGIS spatial queries

DBSCAN clustering

Geo-hashing

Time-decay weighted risk scoring

Grid-based aggregation for dashboards

6️⃣ Data Ingestion Pipelines
Data Sources (Free & Legal)

Citizen reports (primary signal)

YouTube public metadata

Titles

Descriptions

Comments (within free quota)

News websites via RSS feeds

Ingestion Tools

Python scripts

Scheduled batch runs

Cleaned outputs written to Supabase DB

7️⃣ Security, Privacy & Governance

HTTPS everywhere (managed by Supabase)

JWT-based access control

Role-based DB policies (RLS)

Minimal personal data collection

Media access via signed URLs

Audit logs in PostgreSQL