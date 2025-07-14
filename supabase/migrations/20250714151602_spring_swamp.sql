/*
  # Fix infinite recursion in user_profiles RLS policies

  The issue is that admin policies are checking the user_profiles table to determine 
  if a user is an admin, which creates infinite recursion when trying to read from
  the same table.

  ## Changes
  1. Drop existing admin policies that cause recursion
  2. Create simpler policies that avoid circular references
  3. Use auth.email() to identify admin users instead of querying user_profiles

  ## Security
  - Users can still read and update their own profiles
  - System can still insert new profiles
  - Admin access is now determined by email address to avoid recursion
*/

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON user_profiles;

-- Create new admin policies using email instead of role lookup
CREATE POLICY "Admins can read all profiles by email"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.email() IN ('jeremy@lyzr.ai', 'admin@lyzr.ai'));

CREATE POLICY "Admins can update user profiles by email"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.email() IN ('jeremy@lyzr.ai', 'admin@lyzr.ai'));

-- Create admin delete policy using email
CREATE POLICY "Admins can delete user profiles by email"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (auth.email() IN ('jeremy@lyzr.ai', 'admin@lyzr.ai'));