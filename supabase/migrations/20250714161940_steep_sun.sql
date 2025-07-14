/*
  # Create Database Functions

  1. Database Functions
    - `increment_page_views` - Increment demo page views counter
    - `log_user_activity` - Log user actions for audit trail
    - `uid()` - Helper function to get current user ID
    - `email()` - Helper function to get current user email

  2. Security
    - Functions use security definer for proper permissions
    - Audit logging for all user actions
*/

-- Helper function to get current user ID
CREATE OR REPLACE FUNCTION uid() 
RETURNS uuid 
LANGUAGE sql 
STABLE
AS $$
  SELECT auth.uid();
$$;

-- Helper function to get current user email
CREATE OR REPLACE FUNCTION email() 
RETURNS text 
LANGUAGE sql 
STABLE
AS $$
  SELECT auth.email();
$$;

-- Function to increment page views for a demo
CREATE OR REPLACE FUNCTION increment_page_views(demo_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE demos 
  SET page_views = page_views + 1 
  WHERE id = demo_id;
END;
$$;

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_action text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO activity_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    created_at
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_details,
    now()
  );
END;
$$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text := 'user';
BEGIN
  -- Set admin role for specific emails
  IF NEW.email IN ('jeremy@lyzr.ai', 'admin@lyzr.ai') THEN
    user_role := 'admin';
  END IF;

  INSERT INTO user_profiles (
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
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    user_role,
    true,
    now(),
    now()
  );

  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;