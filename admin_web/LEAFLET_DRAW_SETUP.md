# Leaflet.Draw + Supabase Integration Setup

## Quick Start

### 1. Configure Supabase Credentials

Create `.env.local` in the `admin_web` directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Create the Supabase Table

Run this SQL in your Supabase dashboard (SQL Editor):

```sql
create table monitoring_zones (
  id uuid primary key default gen_random_uuid(),
  center_lat double precision not null,
  center_lng double precision not null,
  radius_meters integer not null,
  created_at timestamp with time zone default now()
);

-- Optional: Add an index for faster queries
create index idx_monitoring_zones_created_at 
on monitoring_zones(created_at desc);
```

### 3. Enable RLS (Row Level Security) - Optional

For production, enable RLS:

```sql
alter table monitoring_zones enable row level security;

create policy "Allow public read" 
on monitoring_zones for select using (true);

create policy "Allow public insert" 
on monitoring_zones for insert with check (true);
```

## How It Works

### Drawing Circles

1. Navigate to **🗺️ Map View** tab in Dashboard
2. Click the **circle tool** in the top-left toolbar
3. **Click and drag** on the map to draw a circle
4. Circle is **auto-saved** to Supabase with:
   - Center latitude/longitude
   - Radius in meters
   - Timestamp

### Editing & Deleting

- Click the **edit tool** to modify circle boundaries
- Click the **delete tool** to remove circles
- All changes are logged to the browser console

### Loading Existing Zones

On page load, the component:
1. Fetches all zones from `monitoring_zones` table
2. Renders them as semi-transparent blue circles
3. Shows count at the bottom

## Component API

### LeafletMapWithDraw Props

```typescript
interface LeafletMapWithDrawProps {
  height?: string | number;           // Default: '700px'
  zoom?: number;                       // Default: 6
  center?: [number, number];           // Default: [13.08, 80.27] (India coastline)
  onMapReady?: (map: LeafletMapInstance) => void;
}
```

### Usage in Dashboard

```tsx
import LeafletMapWithDraw from './components/LeafletMapWithDraw';

<LeafletMapWithDraw
  height="700px"
  zoom={6}
  center={[13.08, 80.27]}
/>
```

## Database Schema

```
Table: monitoring_zones
┌──────────────┬──────────────────────┬──────────┐
│ Column       │ Type                 │ Notes    │
├──────────────┼──────────────────────┼──────────┤
│ id           │ uuid (PK)            │ Auto     │
│ center_lat   │ double precision     │ Required │
│ center_lng   │ double precision     │ Required │
│ radius_meters│ integer              │ Required │
│ created_at   │ timestamp with TZ    │ Auto     │
└──────────────┴──────────────────────┴──────────┘
```

## Features

✅ Circle drawing with Leaflet.Draw
✅ Auto-save to Supabase
✅ Load existing zones on mount
✅ Edit circle boundaries
✅ Delete zones
✅ Responsive to tab layout
✅ Error handling with alerts
✅ Success notifications
✅ Metric display (km)
✅ Production-ready code

## Browser Console Logs

```
✓ Zone saved to Supabase: [data]
Circle created: center=[13.08, 80.27], radius=5000m
Updated: center=[13.09, 80.28], radius=6000m
Deleted layer: Circle {...}
Error fetching zones: [error message]
```

## Troubleshooting

### Supabase connection fails

- Check `.env.local` credentials
- Verify project URL matches Supabase dashboard
- Check browser console for errors

### Circles not appearing

- Verify RLS is enabled and policies allow reads
- Check Supabase table has data
- Clear browser cache and reload

### Map not resizing in tabs

- Component automatically calls `map.invalidateSize()` on window resize
- Manual trigger in parent: `mapRef.current?.invalidateSize()`

## Next Steps

- Add polygon support (edit `draw` config)
- Implement zone editing via modal
- Add zone deletion confirmation
- Track zone metadata (name, type, etc.)
- Add WebSocket updates for real-time sync
