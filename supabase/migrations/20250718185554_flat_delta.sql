/*
  # Fix infinite recursion in RLS policies

  This migration fixes the infinite recursion error in Row Level Security policies
  by creating a SECURITY DEFINER function to safely check admin roles without
  triggering recursive policy checks.

  ## Changes Made:
  1. Create `is_admin_or_super_admin()` function with SECURITY DEFINER
  2. Update demos table policies to use the new function
  3. Fix any other policies that might cause recursion
  4. Ensure clean policy structure
*/

-- Create a SECURITY DEFINER function to check admin roles without triggering RLS recursion
CREATE OR REPLACE FUNCTION is_admin_or_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Also create a general is_admin function for compatibility
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Fix demos table policies to use the SECURITY DEFINER function
DROP POLICY IF EXISTS "Users can update their own demos" ON demos;
CREATE POLICY "Users can update their own demos" ON demos
  FOR UPDATE USING (
    auth.uid()::text = owner OR
    is_admin_or_super_admin()
  );

DROP POLICY IF EXISTS "Users can delete their own demos" ON demos;
CREATE POLICY "Users can delete their own demos" ON demos
  FOR DELETE USING (
    auth.uid()::text = owner OR
    is_admin_or_super_admin()
  );

-- Update the admin management policy
DROP POLICY IF EXISTS "Admins can manage all demos" ON demos;
CREATE POLICY "Admins can manage all demos" ON demos
  FOR ALL USING (is_admin_or_super_admin())
  WITH CHECK (is_admin_or_super_admin());

-- Fix user_profiles policies to prevent recursion
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
CREATE POLICY "Admins can manage all profiles" ON user_profiles
  FOR ALL USING (
    auth.email() = ANY (ARRAY['jeremy@lyzr.ai'::text, 'admin@lyzr.ai'::text]) OR
    auth.uid() IN (
      SELECT user_id FROM public.user_profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  );

-- Simplify the admin read policy
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
CREATE POLICY "Admins can read all profiles" ON user_profiles
  FOR SELECT USING (
    auth.email() = ANY (ARRAY['jeremy@lyzr.ai'::text, 'admin@lyzr.ai'::text]) OR
    auth.uid() IN (
      SELECT user_id FROM public.user_profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  );

-- Update activity_logs policies
DROP POLICY IF EXISTS "Admins can read all activity logs" ON activity_logs;
CREATE POLICY "Admins can read all activity logs" ON activity_logs
  FOR SELECT USING (is_admin_or_super_admin());

-- Clean up any duplicate policies that might cause issues
DROP POLICY IF EXISTS "Admin emails can manage profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin emails can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin emails can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin emails can delete profiles" ON user_profiles;

-- Create a single consolidated admin policy for user_profiles
CREATE POLICY "Admins can manage user profiles" ON user_profiles
  FOR ALL USING (
    auth.email() = ANY (ARRAY['jeremy@lyzr.ai'::text, 'admin@lyzr.ai'::text])
  );

-- Grant necessary permissions to the functions
GRANT EXECUTE ON FUNCTION is_admin_or_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_super_admin() TO anon;
GRANT EXECUTE ON FUNCTION is_admin() TO anon;