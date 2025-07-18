-- Fix infinite recursion in user_profiles RLS policy
-- This resolves the issue where demos table queries cause recursion
-- when checking owner information from user_profiles

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;

-- Create a new policy that allows authenticated users to view all profiles
-- This prevents recursion when demos table needs to resolve owner information
CREATE POLICY "Authenticated users can view all profiles" ON user_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Keep the update policy restrictive to own profile only
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Keep the insert policy for system use
DROP POLICY IF EXISTS "System can create profiles" ON user_profiles;
CREATE POLICY "System can create profiles" ON user_profiles
  FOR INSERT WITH CHECK (true);