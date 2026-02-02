# Fix: Supabase Circle Save Integration

## Problem Solved
**Error**: "TypeError: Failed to fetch" when saving circles to Supabase  
**Root Cause**: Missing/incorrect environment variables, RLS policies, or table permissions

---

## ✅ Setup Instructions

### 1. Create `.env.local` in `admin_web/` Directory

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Settings → API → Copy URL and `anon` key

**IMPORTANT**:
- ✅ Use `VITE_` prefix (NOT `REACT_APP_` or `process.env`)
- ✅ Use the `anon` public key (NOT service_role key)
- ✅ Restart dev server after updating `.env.local`

### 2. Create Supabase Table

Run this SQL in your Supabase dashboard (SQL Editor):

```sql
-- Create monitoring_zones table
create table monitoring_zones (
  id uuid primary key default gen_random_uuid(),
  center_lat double precision not null,
  center_lng double precision not null,
  radius_meters integer not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS for security
alter table monitoring_zones enable row level security;

-- Allow all users to SELECT (read)
create policy "Allow public read" 
on monitoring_zones for select using (true);

-- Allow all users to INSERT (write)
create policy "Allow public insert" 
on monitoring_zones for insert with check (true);

-- Optional: Add index for performance
create index idx_monitoring_zones_created_at 
on monitoring_zones(created_at desc);
```

### 3. Restart Dev Server

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## 🔍 Troubleshooting

### Check Browser Console

Open DevTools (F12) → Console tab. You should see:

```
✅ Supabase connection successful
```

If you see errors, refer to solutions below.

### Problem: "Network error - Check Supabase URL"

**Cause**: Invalid or missing Supabase URL

**Fix**:
1. Verify `.env.local` has correct URL
2. Check URL format: `https://xxxxx.supabase.co`
3. Ensure no extra spaces or typos
4. Restart dev server

### Problem: "Permission denied - Check RLS policies"

**Cause**: Row Level Security blocking inserts

**Fix**:
1. Go to Supabase Dashboard → `monitoring_zones` table
2. Click "Auth Policies" button
3. Ensure these policies exist:
   - `Allow public read` on SELECT
   - `Allow public insert` on INSERT

### Problem: "Table not found - Create monitoring_zones"

**Cause**: Table doesn't exist

**Fix**:
1. Go to Supabase Dashboard → SQL Editor
2. Paste and run the table creation SQL (see Step 2 above)
3. Verify table appears in Tables list

### Problem: Still Getting "Failed to fetch"

**Advanced troubleshooting**:

1. **Check Supabase project is active**:
   - Dashboard → Project Settings → Check status is "Active"

2. **Verify CORS is enabled**:
   - Supabase handles CORS automatically for `*.supabase.co` URLs

3. **Check environment variables are loaded**:
   - In browser console, paste: `import.meta.env.VITE_SUPABASE_URL`
   - Should return your project URL, not `undefined`

4. **Check browser console for specific errors**:
   - Look for full error message in red text
   - Search this guide or Supabase docs for that error

---

## 📊 How It Works Now

### Drawing Circles

1. Navigate to **🗺️ Map View** tab
2. Click **circle icon** in toolbar (top-left)
3. **Click and drag** on map to draw circle
4. Circle auto-saves with:
   - ✅ Center latitude/longitude
   - ✅ Radius (meters)
   - ✅ Timestamp (auto)

### Console Logging

When drawing a circle, you'll see:

```
🔍 Testing Supabase connection...
✅ Supabase connection successful
📤 Inserting zone to Supabase: {center_lat: 13.08, center_lng: 80.27, radius_meters: 5000}
Response status: 201
Response data: [{id: "abc123", center_lat: 13.08, ...}]
✅ Zone saved to Supabase: [...]
```

### Error Messages Shown to Admin

- **Supabase Connection Issue**: Appears if connection test fails on load
- **Failed to save zone**: Specific error when insert fails
- **✓ Zone saved!**: Confirmation when successful

---

## 🔧 Code Changes Made

### 1. **supabase_config.ts** - Enhanced with:
- ✅ Environment variable validation
- ✅ Detailed error messages
- ✅ `testSupabaseConnection()` function
- ✅ No auth persistence (for public access)

### 2. **LeafletMapWithDraw.tsx** - Enhanced with:
- ✅ Supabase connection test on mount
- ✅ Detailed error logging
- ✅ Helpful RLS/permission error messages
- ✅ `.select()` on insert for response data
- ✅ 500ms delay after save for database sync

---

## 📝 Environment Variables Reference

```typescript
// ✅ Correct (Vite)
import.meta.env.VITE_SUPABASE_URL

// ❌ Wrong (old React Create App style)
process.env.REACT_APP_SUPABASE_URL

// ❌ Wrong (no prefix)
import.meta.env.SUPABASE_URL
```

---

## 🚀 Next Steps

### Optional Enhancements

- [ ] Add circle editing with Supabase updates
- [ ] Add delete confirmation dialogs
- [ ] Add zone naming/metadata
- [ ] Real-time updates via WebSocket
- [ ] Zone history/audit logs

### Security (Production)

- [ ] Use Row Level Security (done in setup)
- [ ] Add authentication
- [ ] Use service role only for admin operations
- [ ] Add data validation on backend

---

## Support

**Still having issues?**

1. Check browser console (F12) for exact error
2. Verify `.env.local` has correct values
3. Confirm Supabase table and RLS policies exist
4. Check Supabase project dashboard for any alerts

**Supabase Documentation**: https://supabase.com/docs
