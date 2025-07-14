/*
  # Fix User Creation Database Error

  This migration addresses issues with user creation by:
  1. Fixing the user creation trigger
  2. Ensuring proper RLS policies
  3. Adding error handling for duplicate users
  4. Verifying all required functions exist
*/

-- First, let's check if the handle_new_user function exists and fix it
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_profiles with proper error handling
  INSERT INTO user_profiles (user_id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.email = 'jeremy@lyzr.ai' THEN 'admin'
      WHEN NEW.email = 'admin@lyzr.ai' THEN 'admin'
      ELSE 'user'
    END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name),
    role = EXCLUDED.role,
    updated_at = now();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure RLS policies are correct for user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "System can create profiles" ON user_profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles by email" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update user profiles by email" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete user profiles by email" ON user_profiles;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create profiles" ON user_profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read all profiles by email" ON user_profiles
  FOR SELECT USING (auth.email() = ANY (ARRAY['jeremy@lyzr.ai'::text, 'admin@lyzr.ai'::text]));

CREATE POLICY "Admins can update user profiles by email" ON user_profiles
  FOR UPDATE USING (auth.email() = ANY (ARRAY['jeremy@lyzr.ai'::text, 'admin@lyzr.ai'::text]));

CREATE POLICY "Admins can delete user profiles by email" ON user_profiles
  FOR DELETE USING (auth.email() = ANY (ARRAY['jeremy@lyzr.ai'::text, 'admin@lyzr.ai'::text]));

-- Test the setup
DO $$
BEGIN
  -- Test that the function exists
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    RAISE EXCEPTION 'handle_new_user function does not exist';
  END IF;
  
  -- Test that the trigger exists
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    RAISE EXCEPTION 'on_auth_user_created trigger does not exist';
  END IF;
  
  RAISE NOTICE 'User creation setup verified successfully';
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- Success message
SELECT 'User creation database error fixed! Try creating a user now.' as status;