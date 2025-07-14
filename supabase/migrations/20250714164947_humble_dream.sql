-- ===========================================
-- COMPLETE SUPABASE DATABASE SETUP
-- Run this entire script in Supabase SQL Editor
-- ===========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 1. CREATE TABLES
-- ===========================================

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz,
  is_active boolean DEFAULT true
);

-- Create demos table
CREATE TABLE IF NOT EXISTS demos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  tags text[] DEFAULT '{}',
  netlify_url text NOT NULL,
  excalidraw_url text,
  supabase_url text,
  admin_url text,
  screenshot_url text,
  owner text NOT NULL DEFAULT 'Unknown',
  page_views integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured boolean DEFAULT false,
  video_url text
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- ===========================================
-- 2. CREATE INDEXES
-- ===========================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON user_profiles(role);

-- Demos indexes
CREATE INDEX IF NOT EXISTS demos_created_at_idx ON demos(created_at DESC);
CREATE INDEX IF NOT EXISTS demos_status_idx ON demos(status);
CREATE INDEX IF NOT EXISTS demos_owner_idx ON demos(owner);
CREATE INDEX IF NOT EXISTS demos_page_views_idx ON demos(page_views DESC);
CREATE INDEX IF NOT EXISTS demos_is_featured_idx ON demos(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS demos_tags_idx ON demos USING gin(tags);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS activity_logs_user_id_idx ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_action_idx ON activity_logs(action);

-- ===========================================
-- 3. CREATE FUNCTIONS
-- ===========================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Increment page views function
CREATE OR REPLACE FUNCTION increment_page_views(demo_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE demos SET page_views = page_views + 1 WHERE id = demo_id;
END;
$$ LANGUAGE plpgsql;

-- Activity logging function
CREATE OR REPLACE FUNCTION log_user_activity(
  p_action text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
  VALUES (auth.uid(), p_action, p_resource_type, p_resource_id, p_details);
END;
$$ LANGUAGE plpgsql;

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION uid() 
RETURNS uuid AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION email() 
RETURNS text AS $$
BEGIN
  RETURN auth.email();
END;
$$ LANGUAGE plpgsql;

-- Handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (user_id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.email = ANY(ARRAY['jeremy@lyzr.ai', 'admin@lyzr.ai']) THEN 'admin'
      ELSE 'user'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 4. CREATE TRIGGERS
-- ===========================================

-- Update timestamp triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_demos_updated_at ON demos;
CREATE TRIGGER update_demos_updated_at
  BEFORE UPDATE ON demos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User registration trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===========================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE demos ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 6. CREATE RLS POLICIES
-- ===========================================

-- User Profiles Policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert profiles" ON user_profiles;
CREATE POLICY "System can insert profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read all profiles by email" ON user_profiles;
CREATE POLICY "Admins can read all profiles by email"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.email() = ANY(ARRAY['jeremy@lyzr.ai', 'admin@lyzr.ai']));

DROP POLICY IF EXISTS "Admins can update user profiles by email" ON user_profiles;
CREATE POLICY "Admins can update user profiles by email"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.email() = ANY(ARRAY['jeremy@lyzr.ai', 'admin@lyzr.ai']));

DROP POLICY IF EXISTS "Admins can delete user profiles by email" ON user_profiles;
CREATE POLICY "Admins can delete user profiles by email"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (auth.email() = ANY(ARRAY['jeremy@lyzr.ai', 'admin@lyzr.ai']));

-- Demos Policies
DROP POLICY IF EXISTS "Enable read access for all users" ON demos;
CREATE POLICY "Enable read access for all users"
  ON demos FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Admins can insert demos" ON demos;
CREATE POLICY "Admins can insert demos"
  ON demos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can update demos" ON demos;
CREATE POLICY "Admins can update demos"
  ON demos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can delete demos" ON demos;
CREATE POLICY "Admins can delete demos"
  ON demos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

-- Activity Logs Policies
DROP POLICY IF EXISTS "Users can read own activity logs" ON activity_logs;
CREATE POLICY "Users can read own activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all activity logs" ON activity_logs;
CREATE POLICY "Admins can read all activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;
CREATE POLICY "System can insert activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ===========================================
-- 7. CREATE STORAGE BUCKET
-- ===========================================

-- Create storage bucket for demo screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('demo-screenshots', 'demo-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- 8. CREATE STORAGE POLICIES
-- ===========================================

-- Storage policies for demo screenshots
DROP POLICY IF EXISTS "Public read access for demo screenshots" ON storage.objects;
CREATE POLICY "Public read access for demo screenshots" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'demo-screenshots');

DROP POLICY IF EXISTS "Authenticated users can upload demo screenshots" ON storage.objects;
CREATE POLICY "Authenticated users can upload demo screenshots" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'demo-screenshots' 
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can update their own uploads" ON storage.objects;
CREATE POLICY "Users can update their own uploads" 
  ON storage.objects FOR UPDATE 
  USING (
    bucket_id = 'demo-screenshots' 
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;
CREATE POLICY "Users can delete their own uploads" 
  ON storage.objects FOR DELETE 
  USING (
    bucket_id = 'demo-screenshots' 
    AND auth.role() = 'authenticated'
  );

-- ===========================================
-- SETUP COMPLETE!
-- ===========================================

-- Verify setup with a test query
SELECT 
  'Setup Complete!' as status,
  (SELECT COUNT(*) FROM user_profiles) as user_profiles_count,
  (SELECT COUNT(*) FROM demos) as demos_count,
  (SELECT COUNT(*) FROM activity_logs) as activity_logs_count;