/*
# Enhanced Analytics Tracking System

This migration adds comprehensive session tracking, activity logging, and demo health scoring capabilities to provide rich analytics data for measuring engagement, usage, and key KPIs.

## New Tables
- `user_sessions` - Track user sessions with duration, page views, and engagement metrics
- `user_activities` - Real-time activity tracking for immediate engagement visibility
- `demo_health_scores` - Computed health scores for demo prioritization

## New Functions
- `start_user_session()` - Initialize a new user session
- `end_user_session()` - Close a session and calculate metrics
- `log_user_activity()` - Track granular user activities
- `calculate_demo_health_score()` - Compute demo health scores
- `get_real_time_activities()` - Get recent activities for live feed

## Analytics Features
- Session duration tracking
- Click pattern analysis
- Real-time activity feed
- Demo health scoring
- Engagement velocity metrics
*/

-- Create user sessions table for enhanced tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_start timestamptz DEFAULT now(),
  session_end timestamptz,
  duration_seconds integer,
  page_views integer DEFAULT 0,
  demos_viewed integer DEFAULT 0,
  demos_favorited integer DEFAULT 0,
  clicks_count integer DEFAULT 0,
  last_activity timestamptz DEFAULT now(),
  user_agent text,
  ip_address text,
  device_type text,
  browser text,
  referrer text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user activities table for real-time tracking
CREATE TABLE IF NOT EXISTS user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES user_sessions(id) ON DELETE CASCADE,
  activity_type text NOT NULL, -- 'view_demo', 'favorite_demo', 'search', 'filter', 'click_external', 'try_app', 'share_demo'
  resource_type text NOT NULL, -- 'demo', 'search', 'filter', 'external_link'
  resource_id uuid,
  activity_data jsonb, -- Additional context data
  timestamp timestamptz DEFAULT now(),
  duration_ms integer, -- How long the activity took
  created_at timestamptz DEFAULT now()
);

-- Create demo health scores table
CREATE TABLE IF NOT EXISTS demo_health_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_id uuid REFERENCES demos(id) ON DELETE CASCADE,
  health_score numeric(5,2) DEFAULT 0.00, -- 0-100 score
  view_score numeric(5,2) DEFAULT 0.00,
  engagement_score numeric(5,2) DEFAULT 0.00,
  recency_score numeric(5,2) DEFAULT 0.00,
  favorite_score numeric(5,2) DEFAULT 0.00,
  conversion_score numeric(5,2) DEFAULT 0.00,
  last_calculated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(demo_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_start_time ON user_sessions(session_start DESC);

CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_session_id ON user_activities(session_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_timestamp ON user_activities(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_resource ON user_activities(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_demo_health_scores_demo_id ON demo_health_scores(demo_id);
CREATE INDEX IF NOT EXISTS idx_demo_health_scores_score ON demo_health_scores(health_score DESC);

-- Function to start a new user session
CREATE OR REPLACE FUNCTION start_user_session(
  p_user_agent text DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_referrer text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_session_id uuid;
  v_device_type text;
  v_browser text;
BEGIN
  -- Extract device type from user agent
  v_device_type := CASE
    WHEN p_user_agent ILIKE '%mobile%' THEN 'mobile'
    WHEN p_user_agent ILIKE '%tablet%' THEN 'tablet'
    ELSE 'desktop'
  END;
  
  -- Extract browser from user agent
  v_browser := CASE
    WHEN p_user_agent ILIKE '%chrome%' THEN 'chrome'
    WHEN p_user_agent ILIKE '%firefox%' THEN 'firefox'
    WHEN p_user_agent ILIKE '%safari%' THEN 'safari'
    WHEN p_user_agent ILIKE '%edge%' THEN 'edge'
    ELSE 'other'
  END;
  
  -- End any existing active sessions for this user
  UPDATE user_sessions 
  SET is_active = false, 
      session_end = now(),
      duration_seconds = EXTRACT(EPOCH FROM (now() - session_start))::integer
  WHERE user_id = auth.uid() AND is_active = true;
  
  -- Create new session
  INSERT INTO user_sessions (
    user_id, 
    user_agent, 
    ip_address, 
    device_type, 
    browser, 
    referrer,
    is_active
  ) VALUES (
    auth.uid(), 
    p_user_agent, 
    p_ip_address, 
    v_device_type, 
    v_browser, 
    p_referrer,
    true
  ) RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to end a user session
CREATE OR REPLACE FUNCTION end_user_session(p_session_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE user_sessions 
  SET is_active = false,
      session_end = now(),
      duration_seconds = EXTRACT(EPOCH FROM (now() - session_start))::integer,
      updated_at = now()
  WHERE id = p_session_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_session_id uuid,
  p_activity_type text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_activity_data jsonb DEFAULT NULL,
  p_duration_ms integer DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Insert activity
  INSERT INTO user_activities (
    user_id,
    session_id,
    activity_type,
    resource_type,
    resource_id,
    activity_data,
    duration_ms
  ) VALUES (
    auth.uid(),
    p_session_id,
    p_activity_type,
    p_resource_type,
    p_resource_id,
    p_activity_data,
    p_duration_ms
  );
  
  -- Update session stats
  UPDATE user_sessions 
  SET 
    last_activity = now(),
    clicks_count = clicks_count + 1,
    demos_viewed = CASE 
      WHEN p_activity_type = 'view_demo' THEN demos_viewed + 1 
      ELSE demos_viewed 
    END,
    demos_favorited = CASE 
      WHEN p_activity_type = 'favorite_demo' THEN demos_favorited + 1 
      ELSE demos_favorited 
    END,
    updated_at = now()
  WHERE id = p_session_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate demo health score
CREATE OR REPLACE FUNCTION calculate_demo_health_score(p_demo_id uuid)
RETURNS numeric AS $$
DECLARE
  v_demo_record record;
  v_view_score numeric := 0;
  v_engagement_score numeric := 0;
  v_recency_score numeric := 0;
  v_favorite_score numeric := 0;
  v_conversion_score numeric := 0;
  v_total_score numeric := 0;
  v_max_views integer;
  v_avg_views numeric;
  v_favorite_count integer;
  v_days_since_creation integer;
  v_recent_activity_count integer;
BEGIN
  -- Get demo details
  SELECT * INTO v_demo_record FROM demos WHERE id = p_demo_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calculate view score (0-30 points)
  SELECT MAX(page_views), AVG(page_views) INTO v_max_views, v_avg_views FROM demos;
  IF v_max_views > 0 THEN
    v_view_score := LEAST(30, (v_demo_record.page_views::numeric / v_max_views) * 30);
  END IF;
  
  -- Calculate engagement score (0-25 points)
  SELECT COUNT(*) INTO v_recent_activity_count 
  FROM user_activities 
  WHERE resource_id = p_demo_id 
    AND timestamp > now() - interval '7 days';
  v_engagement_score := LEAST(25, v_recent_activity_count * 2);
  
  -- Calculate recency score (0-20 points)
  v_days_since_creation := EXTRACT(DAYS FROM (now() - v_demo_record.created_at::timestamptz));
  v_recency_score := CASE
    WHEN v_days_since_creation <= 7 THEN 20
    WHEN v_days_since_creation <= 30 THEN 15
    WHEN v_days_since_creation <= 90 THEN 10
    ELSE 5
  END;
  
  -- Calculate favorite score (0-15 points)
  SELECT COUNT(*) INTO v_favorite_count FROM user_favorites WHERE demo_id = p_demo_id;
  v_favorite_score := LEAST(15, v_favorite_count * 3);
  
  -- Calculate conversion score (0-10 points)
  SELECT COUNT(*) INTO v_conversion_score 
  FROM user_activities 
  WHERE resource_id = p_demo_id 
    AND activity_type = 'try_app'
    AND timestamp > now() - interval '30 days';
  v_conversion_score := LEAST(10, v_conversion_score);
  
  -- Calculate total score
  v_total_score := v_view_score + v_engagement_score + v_recency_score + v_favorite_score + v_conversion_score;
  
  -- Update or insert health score
  INSERT INTO demo_health_scores (
    demo_id,
    health_score,
    view_score,
    engagement_score,
    recency_score,
    favorite_score,
    conversion_score,
    last_calculated
  ) VALUES (
    p_demo_id,
    v_total_score,
    v_view_score,
    v_engagement_score,
    v_recency_score,
    v_favorite_score,
    v_conversion_score,
    now()
  ) ON CONFLICT (demo_id) DO UPDATE SET
    health_score = EXCLUDED.health_score,
    view_score = EXCLUDED.view_score,
    engagement_score = EXCLUDED.engagement_score,
    recency_score = EXCLUDED.recency_score,
    favorite_score = EXCLUDED.favorite_score,
    conversion_score = EXCLUDED.conversion_score,
    last_calculated = EXCLUDED.last_calculated,
    updated_at = now();
  
  RETURN v_total_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get real-time activities
CREATE OR REPLACE FUNCTION get_real_time_activities(p_limit integer DEFAULT 50)
RETURNS TABLE(
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
    ua.id,
    up.email,
    up.display_name,
    ua.activity_type,
    ua.resource_type,
    COALESCE(d.title, 'Unknown') as resource_title,
    ua.activity_data,
    ua.timestamp,
    CASE
      WHEN ua.timestamp > now() - interval '1 minute' THEN 'Just now'
      WHEN ua.timestamp > now() - interval '1 hour' THEN 
        EXTRACT(MINUTES FROM (now() - ua.timestamp))::text || ' min ago'
      WHEN ua.timestamp > now() - interval '1 day' THEN 
        EXTRACT(HOURS FROM (now() - ua.timestamp))::text || ' hr ago'
      ELSE 
        EXTRACT(DAYS FROM (now() - ua.timestamp))::text || ' days ago'
    END as time_ago
  FROM user_activities ua
  LEFT JOIN user_profiles up ON ua.user_id = up.user_id
  LEFT JOIN demos d ON ua.resource_id = d.id
  WHERE ua.timestamp > now() - interval '1 day'
  ORDER BY ua.timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update all demo health scores
CREATE OR REPLACE FUNCTION update_all_demo_health_scores()
RETURNS void AS $$
DECLARE
  demo_record record;
BEGIN
  FOR demo_record IN SELECT id FROM demos WHERE status = 'published' LOOP
    PERFORM calculate_demo_health_score(demo_record.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic updates
CREATE OR REPLACE FUNCTION handle_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sessions_updated_at ON user_sessions;
CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_sessions_updated_at();

DROP TRIGGER IF EXISTS demo_health_updated_at ON demo_health_scores;
CREATE TRIGGER demo_health_updated_at
  BEFORE UPDATE ON demo_health_scores
  FOR EACH ROW
  EXECUTE FUNCTION handle_sessions_updated_at();

-- Enable RLS on new tables
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_health_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_sessions
CREATE POLICY "Users can view their own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" ON user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON user_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS policies for user_activities
CREATE POLICY "Users can view their own activities" ON user_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activities" ON user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activities" ON user_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS policies for demo_health_scores
CREATE POLICY "Anyone can view demo health scores" ON demo_health_scores
  FOR SELECT USING (true);

CREATE POLICY "System can manage demo health scores" ON demo_health_scores
  FOR ALL USING (true);

-- Initial calculation of health scores for existing demos
SELECT update_all_demo_health_scores();

-- Success message
SELECT 'Enhanced analytics tracking system created successfully! Session tracking, activity logging, and demo health scoring are now available.' as status;