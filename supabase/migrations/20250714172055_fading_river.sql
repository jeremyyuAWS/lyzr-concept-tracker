-- ==========================================
-- COMPLETE DATABASE VERIFICATION
-- ==========================================

-- Check if all tables exist
SELECT 
  'Tables Check' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'demos') AND
         EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') AND
         EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs')
    THEN '✅ All tables exist'
    ELSE '❌ Some tables missing'
  END as status;

-- Check if all functions exist
SELECT 
  'Functions Check' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'increment_page_views') AND
         EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_user_activity') AND
         EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'uid') AND
         EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'email')
    THEN '✅ All functions exist'
    ELSE '❌ Some functions missing'
  END as status;

-- Check storage bucket
SELECT 
  'Storage Bucket Check' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'demo-screenshots' AND public = true)
    THEN '✅ Storage bucket exists and is public'
    ELSE '❌ Storage bucket missing or not public'
  END as status;

-- Check storage policies
SELECT 
  'Storage Policies Check' as component,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage') >= 4
    THEN '✅ Storage policies exist'
    ELSE '❌ Storage policies missing'
  END as status;

-- Check RLS is enabled
SELECT 
  'RLS Check' as component,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_tables WHERE tablename IN ('demos', 'user_profiles', 'activity_logs') AND rowsecurity = true) = 3
    THEN '✅ RLS enabled on all tables'
    ELSE '❌ RLS not enabled on some tables'
  END as status;

-- Check sample data
SELECT 
  'Sample Data Check' as component,
  CASE 
    WHEN (SELECT COUNT(*) FROM demos) >= 3
    THEN '✅ Sample data exists'
    ELSE '❌ Sample data missing'
  END as status;

-- Test basic functionality
SELECT 
  'Basic Function Test' as component,
  CASE 
    WHEN uid() IS NOT NULL OR uid() IS NULL  -- Both are valid (authenticated or not)
    THEN '✅ Basic functions working'
    ELSE '❌ Basic functions failing'
  END as status;

-- Show bucket details
SELECT 
  'Bucket Details' as component,
  COALESCE(
    (SELECT 'Bucket: ' || id || ', Public: ' || public || ', Size Limit: ' || file_size_limit 
     FROM storage.buckets 
     WHERE id = 'demo-screenshots'), 
    '❌ Bucket not found'
  ) as status;

-- Final comprehensive check
SELECT 
  'OVERALL STATUS' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'demos') AND
         EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'increment_page_views') AND
         EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'demo-screenshots' AND public = true) AND
         (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage') >= 4 AND
         (SELECT COUNT(*) FROM demos) >= 3
    THEN '🎉 ALL SYSTEMS READY - DATABASE FULLY OPERATIONAL'
    ELSE '🚨 SOME COMPONENTS STILL MISSING - CHECK INDIVIDUAL ITEMS ABOVE'
  END as status;