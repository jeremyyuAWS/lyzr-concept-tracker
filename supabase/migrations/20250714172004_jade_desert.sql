-- ==========================================
-- COMPLETE DATABASE SETUP FOR LYZR CONCEPT TRACKER
-- THIS FIXES ALL COMMON ISSUES
-- ==========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- DROP EXISTING OBJECTS (CLEAN SLATE)
-- ==========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view published demos" ON demos;
DROP POLICY IF EXISTS "Authenticated users can create demos" ON demos;
DROP POLICY IF EXISTS "Users can update their own demos" ON demos;
DROP POLICY IF EXISTS "Users can delete their own demos" ON demos;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "System can create profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own activity logs" ON activity_logs;
DROP POLICY IF EXISTS "System can create activity logs" ON activity_logs;

-- Drop existing triggers
DROP TRIGGER IF EXISTS handle_demos_updated_at ON demos;
DROP TRIGGER IF EXISTS handle_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing functions
DROP FUNCTION IF EXISTS increment_page_views(uuid);
DROP FUNCTION IF EXISTS log_user_activity(text, text, uuid, jsonb);
DROP FUNCTION IF EXISTS handle_updated_at();
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS uid();
DROP FUNCTION IF EXISTS email();

-- ==========================================
-- CREATE TABLES
-- ==========================================

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
  owner text NOT NULL,
  page_views integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured boolean DEFAULT false,
  video_url text
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz,
  is_active boolean DEFAULT true,
  UNIQUE(user_id)
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- ==========================================
-- CREATE INDEXES
-- ==========================================

-- Demos indexes
CREATE INDEX IF NOT EXISTS idx_demos_created_at ON demos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demos_status ON demos(status);
CREATE INDEX IF NOT EXISTS idx_demos_owner ON demos(owner);
CREATE INDEX IF NOT EXISTS idx_demos_featured ON demos(is_featured) WHERE is_featured = true;

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ==========================================
-- CREATE FUNCTIONS
-- ==========================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Handle new user signup
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

-- ==========================================
-- CREATE TRIGGERS
-- ==========================================

-- Create updated_at triggers
CREATE TRIGGER handle_demos_updated_at
  BEFORE UPDATE ON demos
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create auth trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ==========================================
-- ENABLE ROW LEVEL SECURITY
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE demos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- CREATE RLS POLICIES
-- ==========================================

-- Demos policies
CREATE POLICY "Anyone can view published demos" ON demos
  FOR SELECT USING (status = 'published');

CREATE POLICY "Authenticated users can create demos" ON demos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own demos" ON demos
  FOR UPDATE USING (
    auth.uid()::text = owner OR 
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Users can delete their own demos" ON demos
  FOR DELETE USING (
    auth.uid()::text = owner OR 
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create profiles" ON user_profiles
  FOR INSERT WITH CHECK (true);

-- Activity logs policies
CREATE POLICY "Users can view their own activity logs" ON activity_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- ==========================================
-- SETUP STORAGE BUCKET
-- ==========================================

-- Delete existing bucket if it exists
DELETE FROM storage.buckets WHERE id = 'demo-screenshots';

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'demo-screenshots', 
  'demo-screenshots', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Wait a moment for bucket creation
SELECT pg_sleep(1);

-- Drop existing storage policies
DROP POLICY IF EXISTS "Public read access for demo screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload demo screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;

-- Create storage policies
CREATE POLICY "Public read access for demo screenshots" ON storage.objects
  FOR SELECT USING (bucket_id = 'demo-screenshots');

CREATE POLICY "Authenticated users can upload demo screenshots" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'demo-screenshots' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own uploads" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'demo-screenshots' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their own uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'demo-screenshots' 
    AND auth.role() = 'authenticated'
  );

-- ==========================================
-- INSERT SAMPLE DATA
-- ==========================================

-- Clear existing data
DELETE FROM demos;

-- Insert sample demos
INSERT INTO demos (title, description, tags, netlify_url, excalidraw_url, supabase_url, admin_url, owner, page_views, is_featured) VALUES
(
  'AI-Powered Task Manager',
  'A smart task management application that uses AI to prioritize tasks, suggest optimal scheduling, and provide productivity insights. Features include natural language task creation, intelligent reminders, and automated time blocking.',
  ARRAY['AI', 'Productivity', 'Task Management', 'NLP', 'Scheduling'],
  'https://ai-task-manager-demo.netlify.app',
  'https://excalidraw.com/#json=ai-task-manager-wireframe',
  'https://supabase.com/dashboard/project/ai-task-manager',
  'https://ai-task-manager-demo.netlify.app/admin',
  'Jeremy',
  45,
  false
),
(
  'Real-time Analytics Dashboard',
  'A comprehensive analytics dashboard that provides real-time insights into business metrics, user behavior, and system performance. Features interactive charts, customizable widgets, and automated reporting capabilities.',
  ARRAY['Analytics', 'Dashboard', 'Real-time', 'Business Intelligence', 'Charts'],
  'https://analytics-dashboard-demo.netlify.app',
  'https://excalidraw.com/#json=analytics-dashboard-design',
  'https://supabase.com/dashboard/project/analytics-dashboard',
  'https://analytics-dashboard-demo.netlify.app/admin',
  'Jeremy',
  123,
  true
),
(
  'Smart E-commerce Platform',
  'An intelligent e-commerce platform with AI-powered product recommendations, dynamic pricing, inventory management, and personalized shopping experiences. Includes advanced search, reviews, and order tracking.',
  ARRAY['E-commerce', 'AI', 'Recommendations', 'Shopping', 'Inventory'],
  'https://smart-ecommerce-demo.netlify.app',
  'https://excalidraw.com/#json=ecommerce-platform-flow',
  'https://supabase.com/dashboard/project/smart-ecommerce',
  'https://smart-ecommerce-demo.netlify.app/admin',
  'Jeremy',
  67,
  false
);

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Test all components
SELECT 
  '✅ Tables created' as status,
  (SELECT COUNT(*) FROM demos) as demo_count,
  (SELECT COUNT(*) FROM user_profiles) as profile_count,
  (SELECT COUNT(*) FROM activity_logs) as log_count;

-- Test functions
SELECT '✅ Functions working' as status, uid() as test_uid;

-- Test storage bucket
SELECT '✅ Storage bucket created' as status, 
       (SELECT COUNT(*) FROM storage.buckets WHERE id = 'demo-screenshots') as bucket_exists;

-- Test storage policies
SELECT '✅ Storage policies created' as status, 
       (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage') as policy_count;

-- Final success message
SELECT '🎉 COMPLETE DATABASE SETUP SUCCESSFUL! All components ready.' as final_status;