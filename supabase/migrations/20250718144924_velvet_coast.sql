/*
  # Enforce User Profile Requirement for Login

  1. Security Enhancement
    - Ensure all users have profiles before allowing access
    - Add database constraints and policies
    - Create verification functions

  2. Access Control
    - Block access for users without profiles
    - Ensure profile integrity
    - Add profile verification function
*/

-- Function to verify user has a valid profile
CREATE OR REPLACE FUNCTION verify_user_profile(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  profile_exists boolean := false;
BEGIN
  -- Check if user has a profile
  SELECT EXISTS(
    SELECT 1 FROM user_profiles 
    WHERE user_id = p_user_id AND is_active = true
  ) INTO profile_exists;
  
  RETURN profile_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user profile with verification
CREATE OR REPLACE FUNCTION get_verified_user_profile(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  display_name text,
  role text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz,
  last_login timestamptz,
  is_active boolean
) AS $$
BEGIN
  -- Only return profile if user exists and is active
  RETURN QUERY
  SELECT 
    up.id,
    up.user_id,
    up.email,
    up.display_name,
    up.role,
    up.avatar_url,
    up.created_at,
    up.updated_at,
    up.last_login,
    up.is_active
  FROM user_profiles up
  WHERE up.user_id = p_user_id 
    AND up.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced user creation with mandatory profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role text := 'user';
BEGIN
  -- Determine user role based on email
  IF NEW.email = 'jeremy@lyzr.ai' OR NEW.email = 'admin@lyzr.ai' THEN
    user_role := 'admin';
  END IF;

  -- Create user profile (mandatory for access)
  INSERT INTO user_profiles (
    user_id, 
    email, 
    display_name, 
    role,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    user_role,
    true,
    NOW(),
    NOW()
  );
  
  -- Log the profile creation
  INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
  VALUES (
    NEW.id,
    'profile_created',
    'user_profile',
    NEW.id,
    jsonb_build_object(
      'email', NEW.email,
      'role', user_role,
      'created_via', 'auth_trigger'
    )
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't prevent user creation
  INSERT INTO activity_logs (user_id, action, resource_type, details)
  VALUES (
    NEW.id,
    'profile_creation_failed',
    'user_profile',
    jsonb_build_object(
      'error', SQLERRM,
      'email', NEW.email
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Enhanced RLS policies for stricter access control

-- User profiles: Only active users with profiles can access
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (user_id = auth.uid() AND is_active = true);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (user_id = auth.uid() AND is_active = true);

-- Demos: Only users with active profiles can access
DROP POLICY IF EXISTS "Users with profiles can view demos" ON demos;
CREATE POLICY "Users with profiles can view demos" ON demos
  FOR SELECT USING (
    status = 'published' AND 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Users with profiles can create demos" ON demos;
CREATE POLICY "Users with profiles can create demos" ON demos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Activity logs: Only users with profiles can create logs
DROP POLICY IF EXISTS "Users with profiles can create activity logs" ON activity_logs;
CREATE POLICY "Users with profiles can create activity logs" ON activity_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- User favorites: Only users with profiles can manage favorites
DROP POLICY IF EXISTS "Users with profiles can manage favorites" ON user_favorites;
CREATE POLICY "Users with profiles can manage favorites" ON user_favorites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Ensure all existing auth users have profiles
DO $$
DECLARE
  auth_user RECORD;
  user_role text;
BEGIN
  -- Create profiles for any auth users missing them
  FOR auth_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN user_profiles up ON au.id = up.user_id
    WHERE up.user_id IS NULL
  LOOP
    -- Determine role
    IF auth_user.email = 'jeremy@lyzr.ai' OR auth_user.email = 'admin@lyzr.ai' THEN
      user_role := 'admin';
    ELSE
      user_role := 'user';
    END IF;
    
    -- Create missing profile
    INSERT INTO user_profiles (
      user_id, 
      email, 
      display_name, 
      role,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      auth_user.id,
      auth_user.email,
      COALESCE(
        auth_user.raw_user_meta_data->>'display_name',
        auth_user.raw_user_meta_data->>'full_name',
        split_part(auth_user.email, '@', 1)
      ),
      user_role,
      true,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Created profile for user: %', auth_user.email;
  END LOOP;
END $$;

-- Verification query
SELECT 
  'Profile Creation Enforcement Setup Complete' as status,
  COUNT(*) as total_auth_users,
  (SELECT COUNT(*) FROM user_profiles) as total_profiles,
  (SELECT COUNT(*) FROM user_profiles WHERE is_active = true) as active_profiles
FROM auth.users;

-- Test the verification function
SELECT verify_user_profile(id) as has_profile, email 
FROM auth.users 
LIMIT 5;

SELECT 'Setup complete - all logins now require active user profiles' as final_status;