-- Civil Alert System - Supabase Storage bucket + RLS for hazard media
-- Creates the `hazard-media` bucket and allows authenticated users to upload/read/update/delete
-- only within their own folder prefix: `<auth.uid()>/<reportId>/...`

-- IMPORTANT (hosted Supabase):
-- You may see either of these when running in the SQL editor:
--   - ERROR: 42501: must be owner of table object
--   - ERROR: 42501: permission denied to set role "supabase_storage_admin"
-- This is expected on hosted Supabase because Storage tables are owned by an internal role.
--
-- Fix (recommended): create the bucket + policies in the Supabase Dashboard:
--   Storage → Buckets → New bucket → name: hazard-media → Public: ON
--   Storage → Policies → New policy (table: storage.objects)
-- Use these policy expressions (copy/paste):
--   INSERT (authenticated): bucket_id = 'hazard-media' AND (storage.foldername(name))[1] = auth.uid()::text
--   UPDATE (authenticated): bucket_id = 'hazard-media' AND (storage.foldername(name))[1] = auth.uid()::text
--   DELETE (authenticated): bucket_id = 'hazard-media' AND (storage.foldername(name))[1] = auth.uid()::text
-- Optional:
--   SELECT (authenticated): bucket_id = 'hazard-media' AND (storage.foldername(name))[1] = auth.uid()::text
--
-- The SQL below is kept as reference for environments where you CAN run it as the storage owner.
DO $$
BEGIN
  -- 1) Create bucket (id == name convention)
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('hazard-media', 'hazard-media', true)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  -- 2) Enable RLS on storage.objects (usually already enabled)
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

  -- 3) Policies for hazard-media
  -- Clean up for idempotency
  DROP POLICY IF EXISTS "hazard media: insert own" ON storage.objects;
  DROP POLICY IF EXISTS "hazard media: update own" ON storage.objects;
  DROP POLICY IF EXISTS "hazard media: select own" ON storage.objects;
  DROP POLICY IF EXISTS "hazard media: delete own" ON storage.objects;

  -- Helper condition: object key starts with the user's uid folder
  -- Note: `name` is the object path/key.
  CREATE POLICY "hazard media: insert own"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'hazard-media'
      AND name LIKE (auth.uid()::text || '/%')
    );

  CREATE POLICY "hazard media: update own"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'hazard-media'
      AND name LIKE (auth.uid()::text || '/%')
    )
    WITH CHECK (
      bucket_id = 'hazard-media'
      AND name LIKE (auth.uid()::text || '/%')
    );

  CREATE POLICY "hazard media: select own"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'hazard-media'
      AND name LIKE (auth.uid()::text || '/%')
    );

  CREATE POLICY "hazard media: delete own"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'hazard-media'
      AND name LIKE (auth.uid()::text || '/%')
    );
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping storage SQL (insufficient_privilege). Configure hazard-media bucket + policies in Supabase Dashboard.';
  WHEN undefined_table THEN
    RAISE NOTICE 'Skipping storage SQL (storage schema/tables unavailable in this environment).';
END
$$;

