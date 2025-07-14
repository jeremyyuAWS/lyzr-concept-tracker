-- Fix user creation issues for jeremy@lyzr.ai

-- First, let's check if the user already exists
SELECT 
  id, 
  email, 
  created_at,
  email_confirmed_at
FROM auth.users 
WHERE email = 'jeremy@lyzr.ai';

-- Check if user profile exists
SELECT 
  id,
  user_id,
  email,
  display_name,
  role,
  created_at
FROM user_profiles 
WHERE email = 'jeremy@lyzr.ai';

-- If user exists but no profile, create profile manually
DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Get user from auth.users
  SELECT * INTO user_record 
  FROM auth.users 
  WHERE email = 'jeremy@lyzr.ai';
  
  -- If user exists but no profile, create it
  IF user_record.id IS NOT NULL THEN
    INSERT INTO user_profiles (user_id, email, display_name, role)
    VALUES (
      user_record.id,
      'jeremy@lyzr.ai',
      'Jeremy',
      'admin'
    )
    ON CONFLICT (user_id) DO UPDATE SET
      role = 'admin',
      display_name = 'Jeremy',
      updated_at = now();
  END IF;
END $$;

-- Verify the trigger function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Verify the trigger is active
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- If trigger is missing, recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Success message
SELECT 'User creation system verified and fixed!' as status;