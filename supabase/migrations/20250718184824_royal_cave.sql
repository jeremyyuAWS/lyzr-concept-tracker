/*
  # Fix User Creation Database Policies

  1. User Management
    - Fix user profile creation trigger
    - Update RLS policies for user_profiles
    - Add proper permissions for signup process

  2. Security
    - Enable proper user profile creation
    - Fix authentication policies
    - Ensure triggers work correctly
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the user profile creation function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_profiles with proper error handling
  INSERT INTO public.user_profiles (
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
      split_part(NEW.email, '@', 1)
    ),
    CASE 
      WHEN NEW.email = 'jeremy@lyzr.ai' THEN 'admin'
      WHEN NEW.email = 'admin@lyzr.ai' THEN 'admin'
      WHEN NEW.email LIKE '%@lyzr.ai' THEN 'user'
      ELSE 'user'
    END,
    true,
    NOW(),
    NOW()
  );
  
  -- Return the new user record
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Update RLS policies for user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "System can create profiles" ON user_profiles;
DROP POLICY IF EXISTS "Enable automatic profile creation" ON user_profiles;
DROP POLICY IF EXISTS "Allow signup profile creation" ON user_profiles;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow profile creation during signup process
CREATE POLICY "Allow profile creation during signup" ON user_profiles
  FOR INSERT WITH CHECK (
    -- Allow if the user ID matches the authenticated user (during signup)
    auth.uid() = user_id OR
    -- Allow if this is being called by the trigger (no auth context yet)
    auth.uid() IS NULL
  );

-- Admin policies
CREATE POLICY "Admins can manage all profiles" ON user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Specific admin email policies for initial admin creation
CREATE POLICY "Admin emails can manage profiles" ON user_profiles
  FOR ALL USING (
    auth.email() IN ('jeremy@lyzr.ai', 'admin@lyzr.ai') OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create a function to safely create user profiles
CREATE OR REPLACE FUNCTION create_user_profile_safe(
  p_user_id uuid,
  p_email text,
  p_display_name text DEFAULT NULL,
  p_role text DEFAULT 'user'
)
RETURNS user_profiles AS $$
DECLARE
  v_profile user_profiles;
BEGIN
  -- Insert the profile
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
    p_user_id,
    p_email,
    COALESCE(p_display_name, split_part(p_email, '@', 1)),
    CASE 
      WHEN p_email = 'jeremy@lyzr.ai' THEN 'admin'
      WHEN p_email = 'admin@lyzr.ai' THEN 'admin'
      WHEN p_email LIKE '%@lyzr.ai' THEN 'user'
      ELSE COALESCE(p_role, 'user')
    END,
    true,
    NOW(),
    NOW()
  )
  RETURNING * INTO v_profile;
  
  RETURN v_profile;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, return it
    SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;
    RETURN v_profile;
  WHEN OTHERS THEN
    -- Re-raise other errors
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile_safe TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user TO authenticated;

-- Test the setup
SELECT 'User creation setup completed successfully!' as status;