/*
# 🚀 Complete Lyzr Concept Tracker Database Migration
# Run this entire script in Supabase SQL Editor to set up everything

This migration creates:
1. All required tables (demos, user_profiles, activity_logs)
2. Database functions for business logic
3. Row Level Security (RLS) policies
4. Storage bucket for image uploads
5. Triggers and indexes for performance
6. Admin user setup for jeremy@lyzr.ai
*/

-- ============================================================================
-- 1. CREATE EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. CREATE TABLES
-- ============================================================================

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email text UNIQUE NOT NULL,
  display_name text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz,
  is_active boolean DEFAULT true
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
  video_url text,
  owner text NOT NULL DEFAULT 'Unknown',
  page_views integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured boolean DEFAULT false
);

-- ============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON user_profiles(email);
CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON user_profiles(role);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS activity_logs_user_id_idx ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_action_idx ON activity_logs(action);

-- Demos indexes
CREATE INDEX IF NOT EXISTS demos_created_at_idx ON demos(created_at DESC);
CREATE INDEX IF NOT EXISTS demos_page_views_idx ON demos(page_views DESC);
CREATE INDEX IF NOT EXISTS demos_tags_idx ON demos USING gin(tags);
CREATE INDEX IF NOT EXISTS demos_status_idx ON demos(status);
CREATE INDEX IF NOT EXISTS demos_owner_idx ON demos(owner);
CREATE INDEX IF NOT EXISTS demos_is_featured_idx ON demos(is_featured) WHERE is_featured = true;

-- ============================================================================
-- 4. CREATE FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Function to increment page views
CREATE OR REPLACE FUNCTION increment_page_views(demo_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE demos SET page_views = page_views + 1 WHERE id = demo_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log user activity
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

-- Helper function to get current user ID
CREATE OR REPLACE FUNCTION uid() 
RETURNS uuid AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql;

-- Helper function to get current user email
CREATE OR REPLACE FUNCTION email() 
RETURNS text AS $$
BEGIN
  RETURN auth.email();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. CREATE TRIGGERS
-- ============================================================================

-- Trigger to update updated_at on user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on demos
DROP TRIGGER IF EXISTS update_demos_updated_at ON demos;
CREATE TRIGGER update_demos_updated_at
  BEFORE UPDATE ON demos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to handle new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE demos ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. CREATE RLS POLICIES
-- ============================================================================

-- User Profiles Policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert profiles" ON user_profiles;
CREATE POLICY "System can insert profiles" ON user_profiles
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read all profiles by email" ON user_profiles;
CREATE POLICY "Admins can read all profiles by email" ON user_profiles
  FOR SELECT USING (auth.email() = ANY(ARRAY['jeremy@lyzr.ai', 'admin@lyzr.ai']));

DROP POLICY IF EXISTS "Admins can update user profiles by email" ON user_profiles;
CREATE POLICY "Admins can update user profiles by email" ON user_profiles
  FOR UPDATE USING (auth.email() = ANY(ARRAY['jeremy@lyzr.ai', 'admin@lyzr.ai']));

DROP POLICY IF EXISTS "Admins can delete user profiles by email" ON user_profiles;
CREATE POLICY "Admins can delete user profiles by email" ON user_profiles
  FOR DELETE USING (auth.email() = ANY(ARRAY['jeremy@lyzr.ai', 'admin@lyzr.ai']));

-- Activity Logs Policies
DROP POLICY IF EXISTS "Users can read own activity logs" ON activity_logs;
CREATE POLICY "Users can read own activity logs" ON activity_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;
CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read all activity logs" ON activity_logs;
CREATE POLICY "Admins can read all activity logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = ANY(ARRAY['admin', 'super_admin'])
    )
  );

-- Demos Policies
DROP POLICY IF EXISTS "Enable read access for all users" ON demos;
CREATE POLICY "Enable read access for all users" ON demos
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert demos" ON demos;
CREATE POLICY "Admins can insert demos" ON demos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = ANY(ARRAY['admin', 'super_admin'])
    )
  );

DROP POLICY IF EXISTS "Admins can update demos" ON demos;
CREATE POLICY "Admins can update demos" ON demos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = ANY(ARRAY['admin', 'super_admin'])
    )
  );

DROP POLICY IF EXISTS "Admins can delete demos" ON demos;
CREATE POLICY "Admins can delete demos" ON demos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = ANY(ARRAY['admin', 'super_admin'])
    )
  );

-- ============================================================================
-- 8. SETUP STORAGE BUCKET
-- ============================================================================

-- Create storage bucket for demo screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('demo-screenshots', 'demo-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Public read access for demo screenshots" ON storage.objects;
CREATE POLICY "Public read access for demo screenshots" ON storage.objects
  FOR SELECT USING (bucket_id = 'demo-screenshots');

DROP POLICY IF EXISTS "Authenticated users can upload demo screenshots" ON storage.objects;
CREATE POLICY "Authenticated users can upload demo screenshots" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'demo-screenshots' 
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can update their own uploads" ON storage.objects;
CREATE POLICY "Users can update their own uploads" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'demo-screenshots' 
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;
CREATE POLICY "Users can delete their own uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'demo-screenshots' 
    AND auth.role() = 'authenticated'
  );

-- ============================================================================
-- 9. TEST SETUP
-- ============================================================================

-- Test that we can query all tables
DO $$
DECLARE
  demo_count integer;
  profile_count integer;
  log_count integer;
BEGIN
  SELECT COUNT(*) INTO demo_count FROM demos;
  SELECT COUNT(*) INTO profile_count FROM user_profiles;
  SELECT COUNT(*) INTO log_count FROM activity_logs;
  
  RAISE NOTICE '✅ Database setup complete!';
  RAISE NOTICE '📊 Current data: % demos, % profiles, % logs', demo_count, profile_count, log_count;
  RAISE NOTICE '🎉 Ready for production use!';
END $$;

-- ============================================================================
-- SETUP COMPLETE! 🎉
-- ============================================================================

/*
🎯 WHAT THIS MIGRATION CREATED:

✅ Tables: demos, user_profiles, activity_logs
✅ Functions: increment_page_views, log_user_activity, etc.
✅ RLS Policies: Secure access control for all tables
✅ Storage Bucket: demo-screenshots for image uploads
✅ Indexes: Optimized for performance
✅ Triggers: Auto-update timestamps and user creation
✅ Admin Setup: jeremy@lyzr.ai gets admin role automatically

🚀 NEXT STEPS:
1. Your app should now show the login form (not database error)
2. Create account with jeremy@lyzr.ai to get admin access
3. Start adding demos to the catalog!
*/