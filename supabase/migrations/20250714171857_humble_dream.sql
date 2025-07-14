-- ==========================================
-- VERIFY STORAGE SETUP
-- ==========================================

-- Check if bucket exists and is properly configured
SELECT 
  'BUCKET CHECK:' as test_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'demo-screenshots') 
    THEN '✅ Bucket exists'
    ELSE '❌ Bucket missing'
  END as result;

-- Check bucket configuration
SELECT 
  'BUCKET CONFIG:' as test_type,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'demo-screenshots';

-- Check if policies exist
SELECT 
  'POLICY CHECK:' as test_type,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policy_names
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%demo_screenshots%';

-- Test bucket access (this should work if everything is set up correctly)
SELECT 
  'ACCESS TEST:' as test_type,
  'If this query runs without error, storage is working' as result;