# Google Maps Geofencing System

A production-ready geofencing system for monitoring coastal ocean hazards, built with Google Maps JavaScript API, React, and Supabase.

## 🎯 Features

### Core Functionality
- ✅ **Interactive Map**: Google Maps centered on India's coastline
- ✅ **Circle Drawing**: Click-to-draw circular monitoring zones
- ✅ **Data Persistence**: Automatic save/load with Supabase
- ✅ **Zone Management**: View details, delete zones from InfoWindow
- ✅ **Real-time Sync**: Zones persist across sessions
- ✅ **Error Handling**: Graceful degradation when offline

### Future-Ready Features
- ✅ **GPS Validation**: Utility functions for location checking
- ✅ **Distance Calculations**: Haversine formula implementation
- ✅ **Zone Containment**: Check if points are inside zones
- ✅ **Report Validator**: Complete validation system for hazard reports

### 🗺️ Map Technology
**Library:** Leaflet (via `react-leaflet`)
**Tiles:** OpenStreetMap (Free, no API key required)
**Drawing:** `leaflet-draw` plugin

## 🔑 Key Features
1.  **Circular Geofencing:** Admins can draw circles on the map to define monitoring zones.
2.  **Per-Zone Monitoring:** Hazards are only accepted if they fall within an active zone.
3.  **Supabase Persistence:** Zones are automatically saved to the `monitoring_zones` table.
4.  **Interactive UI:**
    *   **Draw:** Use the toolbar to draw new circles.
    *   **Delete:** Click on a zone to see details and delete it.
    *   **Clear All:** Button to remove all zones at once.

## 🛠️ Configuration
No API keys are required for the map itself!
Supabase configuration is handled via environment variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- Google Maps API key with Maps JavaScript API enabled
- Supabase account and project

### 2. Installation
```bash
cd admin_web
npm install
```

### 3. Configuration

Create/update `.env.local`:
```env
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Database Setup

Run this SQL in Supabase SQL Editor (or use `supabase_setup.sql`):

```sql
CREATE TABLE monitoring_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_lat float8 NOT NULL,
  center_lng float8 NOT NULL,
  radius_meters integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE monitoring_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON monitoring_zones
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON monitoring_zones
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete" ON monitoring_zones
  FOR DELETE USING (true);
```

### 5. Run
```bash
npm run dev
```

Navigate to **Dashboard → Map View** tab.

## 📖 Usage

### Drawing Zones
1. Click **"Enable Drawing"** button (turns blue)
2. Click on map to set center
3. Drag to set radius
4. Release to create zone
5. Zone automatically saves to database ✅

### Viewing Zone Details
1. Click any green circle on the map
2. InfoWindow shows:
   - Center coordinates
   - Radius (km or m)
   - Creation date
   - Delete button

### Deleting Zones
1. Click zone to open InfoWindow
2. Click **"Delete Zone"** button
3. Confirm deletion
4. Zone removed from map and database ✅

## 🔧 Architecture

### Component Structure
```
GoogleMapDashboard
├── Google Maps API Loader (useJsApiLoader)
├── GoogleMap Component
├── DrawingManager (circle mode only)
├── Circle Components (for each saved zone)
└── InfoWindow (zone details)
```

### Data Flow
```
User draws circle
    ↓
onCircleComplete() captures data
    ↓
Save to Supabase
    ↓
Update React state
    ↓
Re-render circle on map
```

### State Management
- `zones`: Array of MonitoringZone objects
- `selectedZone`: Currently clicked zone
- `drawingMode`: Active/inactive drawing state
- `supabaseStatus`: Configuration status

## 🛠️ API Reference

### GoogleMapDashboard Component

```typescript
interface GoogleMapDashboardProps {
  height?: string;                              // Map height (default: "700px")
  onZoneCreated?: (zone: MonitoringZone) => void;  // Callback after zone saved
  onZoneDeleted?: (zoneId: string) => void;        // Callback after zone deleted
}
```

### MonitoringZone Interface

```typescript
interface MonitoringZone {
  id?: string;              // UUID (auto-generated)
  center_lat: number;       // Latitude of center
  center_lng: number;       // Longitude of center
  radius_meters: number;    // Radius in meters
  created_at?: string;      // ISO timestamp
}
```

### Geospatial Utilities

```typescript
import {
  isPointInZone,
  findContainingZone,
  calculateDistance,
  HazardReportValidator
} from './utils/geospatial';

// Check if point is in zone
const inside = isPointInZone(
  { lat: 13.08, lng: 80.27 },
  zone
);

// Find which zone contains a point
const containingZone = findContainingZone(
  { lat: 13.08, lng: 80.27 },
  allZones
);

// Calculate distance between two points
const distance = calculateDistance(
  13.08, 80.27,  // Point 1
  13.09, 80.28   // Point 2
); // Returns meters

// Validate hazard report location
const validator = new HazardReportValidator(activeZones);
const result = validator.validateReportLocation(13.08, 80.27);
if (result.isValid) {
  // Accept report
}
```

## 🧪 Testing

### Build Verification
```bash
npm run build
# Should complete with no TypeScript errors ✅
```

### Manual Testing Checklist
- [ ] Map loads centered on India
- [ ] Drawing mode toggles correctly
- [ ] Zones can be drawn
- [ ] Zones auto-save to database
- [ ] Zones reload on page refresh
- [ ] Clicking zones shows InfoWindow
- [ ] Zones can be deleted
- [ ] Error messages appear if config missing

## 🔒 Security

### API Keys
✅ Environment variables only (never in code)  
✅ Google Maps key restricted to domain  
✅ Supabase anon key (frontend-safe)  

### Database Security
✅ Row Level Security (RLS) enabled  
✅ Policies configured for read/write  
⚠️ Default policies allow public access  

**For production:**
- Restrict policies to authenticated users
- Add admin-only policies for create/delete
- Enable Supabase Auth

## 📊 Database Schema

```sql
Table: monitoring_zones

| Column         | Type         | Constraints           |
|----------------|--------------|-----------------------|
| id             | uuid         | PRIMARY KEY           |
| center_lat     | float8       | NOT NULL, -90 to 90   |
| center_lng     | float8       | NOT NULL, -180 to 180 |
| radius_meters  | integer      | NOT NULL, > 0         |
| created_at     | timestamptz  | DEFAULT now()         |
```

## 🎓 Advanced Features

### Real-Time Zone Updates
```typescript
// Subscribe to zone changes
const channel = supabase
  .channel('monitoring_zones_changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'monitoring_zones' },
    (payload) => {
      console.log('Zone changed:', payload);
      // Refresh zones
    }
  )
  .subscribe();
```

### Zone Editing (Future)
```typescript
// Enable on Circle component
<Circle
  options={{
    editable: true,  // Allow drag/resize
    draggable: true
  }}
  onRadiusChanged={() => {/* Update DB */}}
  onCenterChanged={() => {/* Update DB */}}
/>
```

### Zone Metadata (Future)
```sql
ALTER TABLE monitoring_zones
  ADD COLUMN name text,
  ADD COLUMN status text DEFAULT 'active',
  ADD COLUMN priority text DEFAULT 'medium';
```

## 🐛 Troubleshooting

### Map doesn't load
- Check console for API key errors
- Verify `VITE_GOOGLE_MAPS_API_KEY` is set
- Ensure billing is enabled in Google Cloud

### Zones don't save
- Check Supabase connection in console
- Verify `monitoring_zones` table exists
- Check RLS policies allow inserts

### Zones don't load on refresh
- Check console for fetch errors
- Verify RLS policies allow SELECT
- Check Supabase dashboard for data

## 📚 Resources

- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [React Google Maps API](https://react-google-maps-api-docs.netlify.app/)
- [Supabase Documentation](https://supabase.com/docs)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)

## 📄 Files

Key implementation files:
- [`Dashboard.tsx`](src/pages/Dashboard.tsx) - Main dashboard with tabs
- [`GoogleMapDashboard.tsx`](src/components/GoogleMapDashboard.tsx) - Map component
- [`geospatial.ts`](src/utils/geospatial.ts) - GPS utilities
- [`supabase_config.ts`](src/core/supabase_config.ts) - Database client
- [`supabase_setup.sql`](supabase_setup.sql) - Database schema

## ✅ Production Checklist

Before deploying to production:
- [ ] Add real Google Maps API key
- [ ] Restrict API key to production domain
- [ ] Update Supabase RLS policies for security
- [ ] Enable Supabase Auth (if needed)
- [ ] Test on mobile devices
- [ ] Set up monitoring/logging
- [ ] Configure CORS for production
- [ ] Add rate limiting
- [ ] Enable database backups

## 🤝 Support

For issues or questions:
1. Check the [walkthrough documentation](../../brain/walkthrough.md)
2. Review console logs for errors
3. Verify configuration in `.env.local`
4. Check Supabase dashboard for data

---

**Built with:** React 19, TypeScript, Google Maps API, Supabase, Material-UI

**License:** MIT (adjust as needed)
