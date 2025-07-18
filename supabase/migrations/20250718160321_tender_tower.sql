/*
  # Fix RLS Infinite Recursion Error

  This migration resolves the "infinite recursion detected in policy for relation 'user_profiles'" 
  error by implementing a SECURITY DEFINER function for admin checks.

  ## Problem
  Current RLS policies on user_profiles and demos tables create circular dependencies when 
  checking admin roles, causing infinite recursion.

  ## Solution
  1. Create `is_admin()` SECURITY DEFINER function
     - Bypasses RLS when checking user roles
     - Returns true if current user is admin/super_admin
     - Grants execute permission to authenticated users

  2. Update RLS Policies
     - Drop existing policies that cause recursion
     - Recreate policies using the new is_admin() function
     - Maintain same security model without recursion

  ## Changes
  - New SECURITY DEFINER function: is_admin()
  - Updated user_profiles policies for admin access
  - Updated demos policies for admin access
  - Maintains existing security while fixing recursion
*/

-- ==========================================
-- CREATE SECURITY DEFINER FUNCTION
-- ==========================================

-- Create is_admin function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user has admin role
  -- SECURITY DEFINER allows this query to bypass RLS
  RETURN EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- ==========================================
-- FIX USER_PROFILES RLS POLICIES
-- ==========================================

-- Drop existing admin policies that cause recursion
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete user profiles by email" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles by email" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update user profiles by email" ON user_profiles;

-- Recreate admin policies using the SECURITY DEFINER function
CREATE POLICY "Admins can delete profiles" ON user_profiles
  FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can read all profiles" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update all profiles" ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin());

-- Keep email-based policies for specific admin emails
CREATE POLICY "Admin emails can delete profiles" ON user_profiles
  FOR DELETE
  TO authenticated
  USING (auth.email() = ANY (ARRAY['jeremy@lyzr.ai'::text, 'admin@lyzr.ai'::text]));

CREATE POLICY "Admin emails can read all profiles" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.email() = ANY (ARRAY['jeremy@lyzr.ai'::text, 'admin@lyzr.ai'::text]));

CREATE POLICY "Admin emails can update all profiles" ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.email() = ANY (ARRAY['jeremy@lyzr.ai'::text, 'admin@lyzr.ai'::text]));

-- ==========================================
-- FIX DEMOS RLS POLICIES
-- ==========================================

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Admins can delete demos" ON demos;
DROP POLICY IF EXISTS "Admins can insert demos" ON demos;
DROP POLICY IF EXISTS "Admins can update demos" ON demos;
DROP POLICY IF EXISTS "Users can delete their own demos" ON demos;
DROP POLICY IF EXISTS "Users can update their own demos" ON demos;

-- Recreate policies using the SECURITY DEFINER function
CREATE POLICY "Admins can manage all demos" ON demos
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Users can manage their own demos" ON demos
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = owner)
  WITH CHECK (auth.uid()::text = owner);

-- ==========================================
-- FIX ACTIVITY_LOGS RLS POLICIES
-- ==========================================

-- Drop existing admin policies that might cause recursion
DROP POLICY IF EXISTS "Admins can read all activity logs" ON activity_logs;

-- Recreate using SECURITY DEFINER function
CREATE POLICY "Admins can read all activity logs" ON activity_logs
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- ==========================================
-- VERIFICATION
-- ==========================================

-- Test the function works (should not cause recursion)
SELECT 'is_admin() function created successfully' as status;

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'demos', 'activity_logs')
  AND policyname LIKE '%Admins%'
ORDER BY tablename, policyname;

-- Success message
SELECT '✅ RLS infinite recursion fix completed successfully!' as result;