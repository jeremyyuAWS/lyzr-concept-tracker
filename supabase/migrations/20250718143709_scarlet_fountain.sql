/*
  # Verify and Fix User Profile Creation

  This migration ensures that new user registrations automatically create profiles in user_profiles table.

  ## What this migration does:
  1. Verifies the handle_new_user trigger function exists and works correctly
  2. Ensures the trigger is properly attached to auth.users table
  3. Fixes any RLS policy issues that might prevent profile creation
  4. Tests the setup with a verification query
*/

-- Drop existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the user profile creation function with enhanced error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_display_name text;
  user_role text;
BEGIN
  -- Extract display name from metadata or email
  user_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'displayName', 
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Determine user role based on email
  user_role := CASE 
    WHEN NEW.email = 'jeremy@lyzr.ai' THEN 'admin'
    WHEN NEW.email = 'admin@lyzr.ai' THEN 'admin'
    ELSE 'user'
  END;

  -- Insert user profile with error handling
  BEGIN
    INSERT INTO public.user_profiles (
      user_id,
      email,
      display_name,
      role,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      user_display_name,
      user_role,
      true,
      NOW(),
      NOW()
    );
    
    -- Log successful profile creation
    RAISE NOTICE 'User profile created successfully for user_id: %, email: %', NEW.id, NEW.email;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create user profile for user_id: %, email: %. Error: %', NEW.id, NEW.email, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS policies allow profile creation
-- Drop existing conflicting policies
DROP POLICY IF EXISTS "System can create profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable profile creation during signup" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON public.user_profiles;

-- Create a comprehensive policy for profile creation
CREATE POLICY "Enable automatic profile creation" ON public.user_profiles
  FOR INSERT 
  WITH CHECK (true);

-- Ensure users can read their own profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
CREATE POLICY "Users can read own profile" ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Ensure users can update their own profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin policies for user management
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.user_profiles;
CREATE POLICY "Admins can read all profiles" ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
CREATE POLICY "Admins can update all profiles" ON public.user_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;
CREATE POLICY "Admins can delete profiles" ON public.user_profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Backfill profiles for existing users without profiles
INSERT INTO public.user_profiles (user_id, email, display_name, role, is_active)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'display_name',
    au.raw_user_meta_data->>'displayName',
    au.raw_user_meta_data->>'full_name',
    split_part(au.email, '@', 1)
  ) as display_name,
  CASE 
    WHEN au.email = 'jeremy@lyzr.ai' THEN 'admin'
    WHEN au.email = 'admin@lyzr.ai' THEN 'admin'
    ELSE 'user'
  END as role,
  true as is_active
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
WHERE up.user_id IS NULL
  AND au.email IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Create a test function to verify the trigger works
CREATE OR REPLACE FUNCTION public.test_profile_creation()
RETURNS TABLE (
  test_name text,
  status text,
  details text
) AS $$
BEGIN
  -- Test 1: Check if trigger function exists
  RETURN QUERY
  SELECT 
    'Trigger Function' as test_name,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'handle_new_user'
    ) THEN 'PASS' ELSE 'FAIL' END as status,
    'handle_new_user function exists' as details;

  -- Test 2: Check if trigger exists
  RETURN QUERY
  SELECT 
    'Trigger Exists' as test_name,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'on_auth_user_created'
    ) THEN 'PASS' ELSE 'FAIL' END as status,
    'Trigger attached to auth.users table' as details;

  -- Test 3: Check RLS policies
  RETURN QUERY
  SELECT 
    'RLS Policies' as test_name,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'user_profiles' 
      AND policyname = 'Enable automatic profile creation'
    ) THEN 'PASS' ELSE 'FAIL' END as status,
    'Profile creation policy exists' as details;

  -- Test 4: Check existing profiles
  RETURN QUERY
  SELECT 
    'Existing Profiles' as test_name,
    'INFO' as status,
    'Total profiles: ' || COUNT(*)::text as details
  FROM public.user_profiles;

  -- Test 5: Check users without profiles
  RETURN QUERY
  SELECT 
    'Missing Profiles' as test_name,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END as status,
    'Users without profiles: ' || COUNT(*)::text as details
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON au.id = up.user_id
  WHERE up.user_id IS NULL AND au.email IS NOT NULL;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the verification test
SELECT * FROM public.test_profile_creation();

-- Success message
SELECT 
  '✅ User profile creation setup complete!' as status,
  'New user registrations will automatically create profiles in user_profiles table' as message;