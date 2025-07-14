-- ===================================================================
-- COMPLETE DATABASE MIGRATION - FIXES ALL ERRORS
-- ===================================================================
-- Run this entire script in your Supabase SQL Editor
-- This will create all missing tables, functions, and policies

-- ===================================================================
-- 1. CREATE MISSING TABLES
-- ===================================================================

-- Create demos table
CREATE TABLE IF NOT EXISTS public.demos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
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
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email text NOT NULL,
    display_name text,
    role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_login timestamptz,
    is_active boolean DEFAULT true
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id uuid,
    details jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

-- ===================================================================
-- 2. CREATE MISSING FUNCTIONS
-- ===================================================================

-- Helper function for RLS (fixes "uid() function not found" error)
CREATE OR REPLACE FUNCTION public.uid() 
RETURNS uuid AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function for RLS
CREATE OR REPLACE FUNCTION public.email() 
RETURNS text AS $$
BEGIN
  RETURN auth.email();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment page views
CREATE OR REPLACE FUNCTION public.increment_page_views(demo_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.demos SET page_views = page_views + 1 WHERE id = demo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_action text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.activity_logs (user_id, action, resource_type, resource_id, details)
  VALUES (auth.uid(), p_action, p_resource_type, p_resource_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ===================================================================

-- Enable RLS on all tables
ALTER TABLE public.demos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- 4. CREATE RLS POLICIES
-- ===================================================================

-- Demos policies
CREATE POLICY "Anyone can view published demos" ON public.demos
    FOR SELECT USING (status = 'published');

CREATE POLICY "Authenticated users can create demos" ON public.demos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own demos" ON public.demos
    FOR UPDATE USING (auth.uid()::text = owner OR 
                     EXISTS (SELECT 1 FROM public.user_profiles 
                            WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Users can delete their own demos" ON public.demos
    FOR DELETE USING (auth.uid()::text = owner OR 
                     EXISTS (SELECT 1 FROM public.user_profiles 
                            WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create profiles" ON public.user_profiles
    FOR INSERT WITH CHECK (true);

-- Activity logs policies
CREATE POLICY "Users can view their own activity logs" ON public.activity_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (true);

-- ===================================================================
-- 5. CREATE STORAGE BUCKET FOR IMAGES
-- ===================================================================

-- Create storage bucket for demo screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'demo-screenshots', 
  'demo-screenshots', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
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

-- ===================================================================
-- 6. CREATE TRIGGERS AND INDEXES
-- ===================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for demos table
CREATE TRIGGER handle_demos_updated_at
  BEFORE UPDATE ON public.demos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for user_profiles table
CREATE TRIGGER handle_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.email IN ('jeremy@lyzr.ai', 'admin@lyzr.ai') THEN 'admin'
      ELSE 'user'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_demos_status ON public.demos(status);
CREATE INDEX IF NOT EXISTS idx_demos_created_at ON public.demos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demos_owner ON public.demos(owner);
CREATE INDEX IF NOT EXISTS idx_demos_featured ON public.demos(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- ===================================================================
-- 7. INSERT SAMPLE DATA (OPTIONAL)
-- ===================================================================

-- Insert sample demo data
INSERT INTO public.demos (title, description, tags, netlify_url, owner, is_featured, page_views) VALUES
(
  'AI-Powered Task Manager',
  'A smart task management application that uses AI to prioritize tasks, suggest optimal scheduling, and provide productivity insights.',
  ARRAY['AI', 'Productivity', 'Task Management'],
  'https://ai-task-manager-demo.netlify.app',
  'jeremy@lyzr.ai',
  true,
  15
),
(
  'Real-time Analytics Dashboard',
  'A comprehensive analytics dashboard that provides real-time insights into business metrics and user behavior.',
  ARRAY['Analytics', 'Dashboard', 'Real-time'],
  'https://analytics-dashboard-demo.netlify.app',
  'jeremy@lyzr.ai',
  false,
  8
),
(
  'Smart E-commerce Platform',
  'An intelligent e-commerce platform with AI-powered product recommendations and dynamic pricing.',
  ARRAY['E-commerce', 'AI', 'Recommendations'],
  'https://smart-ecommerce-demo.netlify.app',
  'jeremy@lyzr.ai',
  false,
  22
)
ON CONFLICT (id) DO NOTHING;

-- ===================================================================
-- SUCCESS MESSAGE
-- ===================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database setup complete! All tables, functions, and policies created successfully.';
END
$$;