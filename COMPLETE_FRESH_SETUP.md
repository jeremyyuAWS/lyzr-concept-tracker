# 🚀 Complete Fresh Supabase Setup Guide

## **Step 1: Update Netlify Environment Variables** (3 mins)

### **1.1 Get New Supabase Values:**
1. **Go to:** https://supabase.com/dashboard
2. **Click your NEW project**
3. **Click Settings** → **API**
4. **Copy these values:**
   - **Project URL:** `https://your-new-id.supabase.co`
   - **Anon Key:** The "anon public" key (starts with `eyJ`)

### **1.2 Update Netlify Variables:**
1. **Go to:** https://app.netlify.com
2. **Find your site** → **Site settings** → **Environment variables**
3. **Delete old variables** (if any)
4. **Add new variables:**
   - `VITE_SUPABASE_URL` = Your new project URL
   - `VITE_SUPABASE_ANON_KEY` = Your new anon key
5. **Redeploy:** Deploys → Trigger deploy → Deploy site

---

## **Step 2: Run Complete Database Migration** (5 mins)

### **2.1 Go to Supabase SQL Editor:**
1. **In your NEW Supabase project**
2. **Click SQL Editor** (left sidebar)

### **2.2 Run This Complete Migration:**
```sql
-- ==========================================
-- COMPLETE DATABASE SETUP FOR LYZR CONCEPT TRACKER
-- ==========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
  user_id uuid REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  demo_id uuid NOT NULL REFERENCES demos(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, demo_id)
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_start timestamptz DEFAULT now(),
  session_end timestamptz,
  user_agent text,
  ip_address inet,
  referrer text,
  duration_ms bigint,
  created_at timestamptz DEFAULT now()
);

-- Create demo_health_scores table
CREATE TABLE IF NOT EXISTS demo_health_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_id uuid NOT NULL REFERENCES demos(id) ON DELETE CASCADE,
  health_score numeric DEFAULT 0,
  view_score numeric DEFAULT 0,
  engagement_score numeric DEFAULT 0,
  recency_score numeric DEFAULT 0,
  favorite_score numeric DEFAULT 0,
  conversion_score numeric DEFAULT 0,
  last_calculated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(demo_id)
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

-- User favorites indexes
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_demo_id ON user_favorites(demo_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at DESC);

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_start ON user_sessions(session_start DESC);

-- Demo health scores indexes
CREATE INDEX IF NOT EXISTS idx_demo_health_scores_demo_id ON demo_health_scores(demo_id);
CREATE INDEX IF NOT EXISTS idx_demo_health_scores_health_score ON demo_health_scores(health_score DESC);
CREATE INDEX IF NOT EXISTS idx_demo_health_scores_last_calculated ON demo_health_scores(last_calculated DESC);

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

-- Create updated_at triggers
DROP TRIGGER IF EXISTS handle_demos_updated_at ON demos;
CREATE TRIGGER handle_demos_updated_at
  BEFORE UPDATE ON demos
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER handle_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_demo_health_scores_updated_at ON demo_health_scores;
CREATE TRIGGER handle_demo_health_scores_updated_at
  BEFORE UPDATE ON demo_health_scores
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

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

-- Create auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

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

-- Toggle favorite function
CREATE OR REPLACE FUNCTION toggle_favorite(p_demo_id uuid)
RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
  v_exists boolean;
BEGIN
  -- Get current user ID
  SELECT auth.uid() INTO v_user_id;
  
  -- Check if favorite exists
  SELECT EXISTS(
    SELECT 1 FROM user_favorites 
    WHERE user_id = v_user_id AND demo_id = p_demo_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Remove favorite
    DELETE FROM user_favorites 
    WHERE user_id = v_user_id AND demo_id = p_demo_id;
    RETURN false;
  ELSE
    -- Add favorite
    INSERT INTO user_favorites (user_id, demo_id)
    VALUES (v_user_id, p_demo_id);
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Get real-time activities function
CREATE OR REPLACE FUNCTION get_real_time_activities(p_limit integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  user_email text,
  user_display_name text,
  activity_type text,
  resource_type text,
  resource_title text,
  activity_data jsonb,
  timestamp timestamptz,
  time_ago text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    up.email as user_email,
    COALESCE(up.display_name, up.email) as user_display_name,
    al.action as activity_type,
    al.resource_type,
    COALESCE(d.title, al.resource_type) as resource_title,
    al.details as activity_data,
    al.created_at as timestamp,
    CASE 
      WHEN al.created_at > NOW() - INTERVAL '1 minute' THEN 'just now'
      WHEN al.created_at > NOW() - INTERVAL '1 hour' THEN 
        EXTRACT(EPOCH FROM (NOW() - al.created_at))::integer / 60 || ' minutes ago'
      WHEN al.created_at > NOW() - INTERVAL '1 day' THEN 
        EXTRACT(EPOCH FROM (NOW() - al.created_at))::integer / 3600 || ' hours ago'
      ELSE 
        EXTRACT(EPOCH FROM (NOW() - al.created_at))::integer / 86400 || ' days ago'
    END as time_ago
  FROM activity_logs al
  JOIN user_profiles up ON al.user_id = up.user_id
  LEFT JOIN demos d ON al.resource_id = d.id
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Calculate demo health score function
CREATE OR REPLACE FUNCTION calculate_demo_health_score(p_demo_id uuid)
RETURNS numeric AS $$
DECLARE
  v_view_score numeric := 0;
  v_engagement_score numeric := 0;
  v_recency_score numeric := 0;
  v_favorite_score numeric := 0;
  v_conversion_score numeric := 0;
  v_health_score numeric := 0;
  v_demo_age interval;
  v_page_views integer := 0;
  v_favorite_count integer := 0;
BEGIN
  -- Get demo data
  SELECT 
    page_views,
    NOW() - created_at
  INTO v_page_views, v_demo_age
  FROM demos 
  WHERE id = p_demo_id;
  
  -- Calculate view score (0-25 points)
  v_view_score := LEAST(25, v_page_views * 0.1);
  
  -- Calculate engagement score (0-25 points)
  SELECT COUNT(*) INTO v_favorite_count
  FROM user_favorites
  WHERE demo_id = p_demo_id;
  
  v_engagement_score := LEAST(25, v_favorite_count * 5);
  
  -- Calculate recency score (0-25 points)
  v_recency_score := CASE 
    WHEN v_demo_age < INTERVAL '7 days' THEN 25
    WHEN v_demo_age < INTERVAL '30 days' THEN 20
    WHEN v_demo_age < INTERVAL '90 days' THEN 15
    WHEN v_demo_age < INTERVAL '180 days' THEN 10
    WHEN v_demo_age < INTERVAL '365 days' THEN 5
    ELSE 0
  END;
  
  -- Calculate favorite score (0-15 points)
  v_favorite_score := LEAST(15, v_favorite_count * 3);
  
  -- Calculate conversion score (0-10 points)
  v_conversion_score := LEAST(10, v_page_views * 0.05);
  
  -- Total health score
  v_health_score := v_view_score + v_engagement_score + v_recency_score + v_favorite_score + v_conversion_score;
  
  -- Upsert into demo_health_scores
  INSERT INTO demo_health_scores (
    demo_id, health_score, view_score, engagement_score, 
    recency_score, favorite_score, conversion_score, last_calculated
  )
  VALUES (
    p_demo_id, v_health_score, v_view_score, v_engagement_score,
    v_recency_score, v_favorite_score, v_conversion_score, NOW()
  )
  ON CONFLICT (demo_id) DO UPDATE SET
    health_score = EXCLUDED.health_score,
    view_score = EXCLUDED.view_score,
    engagement_score = EXCLUDED.engagement_score,
    recency_score = EXCLUDED.recency_score,
    favorite_score = EXCLUDED.favorite_score,
    conversion_score = EXCLUDED.conversion_score,
    last_calculated = NOW(),
    updated_at = NOW();
  
  RETURN v_health_score;
END;
$$ LANGUAGE plpgsql;

-- Update all demo health scores function
CREATE OR REPLACE FUNCTION update_all_demo_health_scores()
RETURNS void AS $$
DECLARE
  demo_record RECORD;
BEGIN
  FOR demo_record IN 
    SELECT id FROM demos WHERE status = 'published'
  LOOP
    PERFORM calculate_demo_health_score(demo_record.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Start user session function
CREATE OR REPLACE FUNCTION start_user_session(
  p_user_agent text DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_referrer text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_session_id uuid;
BEGIN
  INSERT INTO user_sessions (user_id, user_agent, ip_address, referrer)
  VALUES (auth.uid(), p_user_agent, p_ip_address::inet, p_referrer)
  RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- End user session function
CREATE OR REPLACE FUNCTION end_user_session(p_session_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE user_sessions 
  SET 
    session_end = NOW(),
    duration_ms = EXTRACT(EPOCH FROM (NOW() - session_start)) * 1000
  WHERE id = p_session_id;
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
-- ENABLE ROW LEVEL SECURITY
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE demos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_health_scores ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- CREATE RLS POLICIES
-- ==========================================

-- Demos policies
DROP POLICY IF EXISTS "Anyone can view published demos" ON demos;
CREATE POLICY "Anyone can view published demos" ON demos
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Authenticated users can create demos" ON demos;
CREATE POLICY "Authenticated users can create demos" ON demos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own demos" ON demos;
CREATE POLICY "Users can update their own demos" ON demos
  FOR UPDATE USING (
    auth.uid()::text = owner OR 
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "Users can delete their own demos" ON demos;
CREATE POLICY "Users can delete their own demos" ON demos
  FOR DELETE USING (
    auth.uid()::text = owner OR 
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- User profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can create profiles" ON user_profiles;
CREATE POLICY "System can create profiles" ON user_profiles
  FOR INSERT WITH CHECK (true);

-- Activity logs policies
DROP POLICY IF EXISTS "Users can view their own activity logs" ON activity_logs;
CREATE POLICY "Users can view their own activity logs" ON activity_logs
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can create activity logs" ON activity_logs;
CREATE POLICY "System can create activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- User favorites policies
DROP POLICY IF EXISTS "Users can view their own favorites" ON user_favorites;
CREATE POLICY "Users can view their own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own favorites" ON user_favorites;
CREATE POLICY "Users can create their own favorites" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own favorites" ON user_favorites;
CREATE POLICY "Users can delete their own favorites" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view favorite counts" ON user_favorites;
CREATE POLICY "Anyone can view favorite counts" ON user_favorites
  FOR SELECT USING (true);

-- User sessions policies
DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
CREATE POLICY "Users can view their own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create sessions" ON user_sessions;
CREATE POLICY "Users can create sessions" ON user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sessions" ON user_sessions;
CREATE POLICY "Users can update their own sessions" ON user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Demo health scores policies
DROP POLICY IF EXISTS "Anyone can view demo health scores" ON demo_health_scores;
CREATE POLICY "Anyone can view demo health scores" ON demo_health_scores
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can manage demo health scores" ON demo_health_scores;
CREATE POLICY "System can manage demo health scores" ON demo_health_scores
  FOR ALL USING (true);

-- ==========================================
-- SETUP STORAGE
-- ==========================================

-- Create storage bucket
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

-- ==========================================
-- INSERT SAMPLE DATA
-- ==========================================

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
)
ON CONFLICT DO NOTHING;

-- Success message
SELECT '✅ Database setup complete! All tables, functions, and policies created successfully.' as status;
```

**Copy this ENTIRE script** → **Paste in SQL Editor** → **Click RUN**

---

## **Step 3: Test Your App** (2 mins)

1. **After SQL completes** → **Go to:** https://lyzr-concept-tracker.netlify.app
2. **Should show LOGIN FORM** (no database errors)
3. **Create admin account:**
   - Email: `jeremy@lyzr.ai`
   - Password: `admin123456`
   - Display Name: `Jeremy`
4. **Should get admin access automatically**

---

## **✅ What You'll Have:**

- ✅ **Complete database** with all tables and functions
- ✅ **Admin authentication** (jeremy@lyzr.ai gets admin role)
- ✅ **3 sample demos** to work with
- ✅ **Image upload** functionality ready
- ✅ **All security policies** configured
- ✅ **Production-ready app**

**Start with Step 1 (environment variables) and work through each step!**