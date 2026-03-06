# Institutional Export API Documentation

The Civil Alert System is built on Supabase, which automatically exposes a secure, fully featured REST API via PostgREST. Institutions, researchers, and partner agencies can query live data directly without needing custom endpoints.

## Base URL
All requests should be made against your Supabase project URL:
`https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/rest/v1`

## Authentication
Since public data in the system (like verified reports and active advisories) is accessible to non-logged-in users via Row-Level Security (RLS), you simply need to include the public `anon` key in your headers.

**Required Headers:**
```http
apikey: <YOUR_SUPABASE_ANON_KEY>
Authorization: Bearer <YOUR_SUPABASE_ANON_KEY>
Content-Type: application/json
```

---

## 1. Export Verified Hazard Reports

The `hazard_reports` table contains all user-submitted reports. By default, Row Level Security ensures that unauthenticated clients can only query reports where `status = 'verified'`.

**Endpoint:**
`GET /hazard_reports`

**Example: Fetch the latest 50 verified reports**
```bash
curl -X GET 'https://<PROJECT_REF>.supabase.co/rest/v1/hazard_reports?select=*&status=eq.verified&order=created_at.desc&limit=50' \
-H 'apikey: <ANON_KEY>' \
-H 'Authorization: Bearer <ANON_KEY>'
```

**Common Query Parameters:**
- Filter by Hazard Type: `&hazard_type=eq.Flood`
- Filter by High Risk: `&is_high_risk=is.true`
- Since a specific date: `&created_at=gte.2024-01-01T00:00:00Z`
- Location bounding box (PostGIS): `&latitude=gte.12.9&latitude=lte.13.1&longitude=gte.80.1&longitude=lte.80.3`

---

## 2. Export Official Advisories

The `official_advisories` table contains all authoritative broadcasts from the disaster management center.

**Endpoint:**
`GET /official_advisories`

**Example: Fetch currently active advisories**
```bash
curl -X GET 'https://<PROJECT_REF>.supabase.co/rest/v1/official_advisories?select=*&expires_at=gte.now()&order=published_at.desc' \
-H 'apikey: <ANON_KEY>' \
-H 'Authorization: Bearer <ANON_KEY>'
```

---

## 3. Export Calculated Risk Zones (Hotspots)

The `generated_risk_zones` table contains dynamic hotspots calculated by the backend based on clustering user reports.

**Endpoint:**
`GET /generated_risk_zones`

**Example: Fetch verified High-Risk zones**
```bash
curl -X GET 'https://<PROJECT_REF>.supabase.co/rest/v1/generated_risk_zones?select=*&level=eq.high_risk&status=eq.verified' \
-H 'apikey: <ANON_KEY>' \
-H 'Authorization: Bearer <ANON_KEY>'
```

---

## Using Python?

Here is a quick example of fetching the latest reports using Python's `requests` library.

```python
import requests

PROJECT_URL = "https://<PROJECT_REF>.supabase.co/rest/v1/hazard_reports"
ANON_KEY = "<YOUR_SUPABASE_ANON_KEY>"

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Accept": "application/json"
}

# Fetch the latest 10 verified Flood reports
params = {
    "select": "*",
    "status": "eq.verified",
    "hazard_type": "eq.Flood",
    "order": "created_at.desc",
    "limit": "10"
}

response = requests.get(PROJECT_URL, headers=headers, params=params)
data = response.json()

for report in data:
    print(f"[{report['created_at']}] {report['hazard_type']} at {report['latitude']},{report['longitude']}")
```

---

## PostgREST Reference
Because our API runs on PostgREST, you can use powerful queries via the URL.
Read the full syntax here: [PostgREST API Documentation](https://postgrest.org/en/v12/references/api/tables_views.html)
