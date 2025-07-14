-- ==========================================
-- FIX STORAGE BUCKET - DEMO SCREENSHOTS
-- ==========================================

-- Create the storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'demo-screenshots', 
  'demo-screenshots', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Remove any existing storage policies (to avoid conflicts)
DROP POLICY IF EXISTS "Public read access for demo screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload demo screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;

-- Create new storage policies
CREATE POLICY "Public read access for demo screenshots" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'demo-screenshots');

CREATE POLICY "Authenticated users can upload demo screenshots" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'demo-screenshots' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'demo-screenshots'
);

CREATE POLICY "Users can update their own uploads" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'demo-screenshots' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own uploads" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'demo-screenshots' 
  AND auth.role() = 'authenticated'
);

-- Test the bucket creation
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'demo-screenshots') 
    THEN '✅ Storage bucket created successfully!'
    ELSE '❌ Storage bucket creation failed!'
  END as status;

-- Show bucket configuration
SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'demo-screenshots';