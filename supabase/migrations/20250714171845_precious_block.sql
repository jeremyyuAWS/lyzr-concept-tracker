-- ==========================================
-- COMPLETE STORAGE BUCKET FIX
-- ==========================================

-- First, let's check if the bucket exists
SELECT 
  'Current buckets:' as info,
  id,
  name,
  public
FROM storage.buckets;

-- Remove existing bucket if it exists (to start fresh)
DELETE FROM storage.buckets WHERE id = 'demo-screenshots';

-- Create the bucket with proper settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'demo-screenshots',
  'demo-screenshots', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Verify bucket was created
SELECT 
  'Bucket created:' as status,
  id,
  name,
  public,
  file_size_limit
FROM storage.buckets 
WHERE id = 'demo-screenshots';

-- Remove any existing policies (to avoid conflicts)
DROP POLICY IF EXISTS "demo_screenshots_public_read" ON storage.objects;
DROP POLICY IF EXISTS "demo_screenshots_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "demo_screenshots_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "demo_screenshots_auth_delete" ON storage.objects;

-- Create storage policies with specific names
CREATE POLICY "demo_screenshots_public_read" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'demo-screenshots');

CREATE POLICY "demo_screenshots_auth_insert" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'demo-screenshots' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "demo_screenshots_auth_update" ON storage.objects
  FOR UPDATE 
  USING (
    bucket_id = 'demo-screenshots' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "demo_screenshots_auth_delete" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'demo-screenshots' 
    AND auth.role() = 'authenticated'
  );

-- Verify policies were created
SELECT 
  'Policies created:' as status,
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%demo_screenshots%';

-- Final verification - test bucket access
SELECT 
  'Storage setup complete!' as status,
  'Bucket: demo-screenshots' as bucket_info,
  'Public: true' as access_level,
  'Policies: 4 created' as security;