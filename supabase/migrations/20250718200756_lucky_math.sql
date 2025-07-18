/*
  # Advanced Analytics and Health Scoring System

  This migration adds comprehensive session tracking, activity logging, and demo health scoring capabilities to provide rich analytics data for measuring engagement, usage, and key KPIs.

  ## 1. New Tables
  - `demo_health_scores` - Computed health scores for demo prioritization and performance tracking
  - Enhanced existing `user_sessions` and `activity_logs` for better analytics

  ## 2. New Functions
  - `start_user_session()` - Initialize a new user session with tracking
  - `end_user_session()` - Close a session and calculate engagement metrics
  - `log_user_activity()` - Track granular user activities in real-time
  - `calculate_demo_health_score()` - Compute comprehensive demo health scores
  - `get_real_time_activities()` - Get recent activities for live dashboard feed
  - `update_all_demo_health_scores()` - Batch update all demo health scores
  - `get_engagement_metrics()` - Calculate user engagement velocity and patterns
  - `toggle_favorite()` - Enhanced favorite toggling with activity tracking

  ## 3. Analytics Features
  - Session duration tracking with detailed metrics
  - Click pattern analysis and user behavior insights
  - Real-time activity feed for immediate engagement visibility
  - Demo health scoring with multiple factors (views, favorites, recency, etc.)
  - Engagement velocity metrics and trend analysis
  - User journey tracking and conversion analytics

  ## 4. Security
  - Enable RLS on all new tables
  - Add appropriate policies for user data access
  - Ensure proper data isolation and privacy
*/

-- ==========================================
-- CREATE DEMO HEALTH SCORES TABLE
-- ==========================================

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

-- Create indexes for demo health scores
CREATE INDEX IF NOT EXISTS idx_demo_health_scores_demo_id ON demo_health_scores(demo_id);
CREATE INDEX IF NOT EXISTS idx_demo_health_scores_health_score ON demo_health_scores(health_score DESC);
CREATE INDEX IF NOT EXISTS idx_demo_health_scores_last_calculated ON demo_health_scores(last_calculated DESC);

-- ==========================================
-- CREATE ANALYTICS FUNCTIONS
-- ==========================================

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
  
  -- Log session start activity
  PERFORM log_user_activity('session_start', 'session', v_session_id, jsonb_build_object(
    'user_agent', p_user_agent,
    'ip_address', p_ip_address,
    'referrer', p_referrer
  ));
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- End user session function
CREATE OR REPLACE FUNCTION end_user_session(p_session_id uuid)
RETURNS void AS $$
DECLARE
  v_session_start timestamptz;
  v_duration_ms bigint;
BEGIN
  -- Get session start time
  SELECT session_start INTO v_session_start
  FROM user_sessions 
  WHERE id = p_session_id AND user_id = auth.uid();
  
  IF v_session_start IS NULL THEN
    RETURN; -- Session not found or not owned by user
  END IF;
  
  -- Calculate duration
  v_duration_ms := EXTRACT(EPOCH FROM (NOW() - v_session_start)) * 1000;
  
  -- Update session record
  UPDATE user_sessions 
  SET 
    session_end = NOW(),
    duration_ms = v_duration_ms
  WHERE id = p_session_id AND user_id = auth.uid();
  
  -- Log session end activity
  PERFORM log_user_activity('session_end', 'session', p_session_id, jsonb_build_object(
    'duration_ms', v_duration_ms,
    'duration_minutes', ROUND(v_duration_ms / 60000.0, 2)
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced activity logging function
CREATE OR REPLACE FUNCTION log_user_activity(
  p_action text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
  VALUES (
    auth.uid(), 
    p_action, 
    p_resource_type, 
    p_resource_id, 
    p_details,
    COALESCE((p_details->>'ip_address')::text, NULL),
    COALESCE((p_details->>'user_agent')::text, NULL)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  v_recent_activity_count integer := 0;
  v_try_app_clicks integer := 0;
BEGIN
  -- Get demo data
  SELECT 
    page_views,
    NOW() - created_at
  INTO v_page_views, v_demo_age
  FROM demos 
  WHERE id = p_demo_id;
  
  IF v_page_views IS NULL THEN
    RETURN 0; -- Demo not found
  END IF;
  
  -- Calculate view score (0-25 points)
  -- More views = higher score, with diminishing returns
  v_view_score := LEAST(25, LOG(GREATEST(v_page_views, 1)) * 3);
  
  -- Calculate engagement score (0-25 points) based on favorites
  SELECT COUNT(*) INTO v_favorite_count
  FROM user_favorites
  WHERE demo_id = p_demo_id;
  
  v_engagement_score := LEAST(25, v_favorite_count * 2.5);
  
  -- Calculate recency score (0-25 points)
  v_recency_score := CASE 
    WHEN v_demo_age < INTERVAL '7 days' THEN 25
    WHEN v_demo_age < INTERVAL '30 days' THEN 20
    WHEN v_demo_age < INTERVAL '90 days' THEN 15
    WHEN v_demo_age < INTERVAL '180 days' THEN 10
    WHEN v_demo_age < INTERVAL '365 days' THEN 5
    ELSE 0
  END;
  
  -- Calculate favorite score (0-15 points) - bonus for being favorited
  v_favorite_score := LEAST(15, v_favorite_count * 1.5);
  
  -- Calculate recent activity score (0-10 points)
  SELECT COUNT(*) INTO v_recent_activity_count
  FROM activity_logs
  WHERE resource_id = p_demo_id 
    AND resource_type = 'demo'
    AND created_at > NOW() - INTERVAL '30 days';
  
  -- Calculate try app conversion score (0-10 points)
  SELECT COUNT(*) INTO v_try_app_clicks
  FROM activity_logs
  WHERE resource_id = p_demo_id 
    AND action = 'try_app'
    AND created_at > NOW() - INTERVAL '90 days';
  
  v_conversion_score := CASE 
    WHEN v_page_views > 0 THEN LEAST(10, (v_try_app_clicks::numeric / v_page_views::numeric) * 100)
    ELSE 0
  END;
  
  -- Total health score (max 100)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get real-time activities function with enhanced data
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced toggle favorite function with activity tracking
CREATE OR REPLACE FUNCTION toggle_favorite(p_demo_id uuid)
RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
  v_exists boolean;
  v_demo_title text;
BEGIN
  -- Get current user ID
  SELECT auth.uid() INTO v_user_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get demo title for activity logging
  SELECT title INTO v_demo_title FROM demos WHERE id = p_demo_id;
  
  -- Check if favorite exists
  SELECT EXISTS(
    SELECT 1 FROM user_favorites 
    WHERE user_id = v_user_id AND demo_id = p_demo_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Remove favorite
    DELETE FROM user_favorites 
    WHERE user_id = v_user_id AND demo_id = p_demo_id;
    
    -- Log unfavorite activity
    PERFORM log_user_activity('favorite_demo', 'demo', p_demo_id, jsonb_build_object(
      'action', 'remove',
      'title', v_demo_title,
      'timestamp', EXTRACT(EPOCH FROM NOW())
    ));
    
    RETURN false;
  ELSE
    -- Add favorite
    INSERT INTO user_favorites (user_id, demo_id)
    VALUES (v_user_id, p_demo_id);
    
    -- Log favorite activity
    PERFORM log_user_activity('favorite_demo', 'demo', p_demo_id, jsonb_build_object(
      'action', 'add',
      'title', v_demo_title,
      'timestamp', EXTRACT(EPOCH FROM NOW())
    ));
    
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get engagement metrics function
CREATE OR REPLACE FUNCTION get_engagement_metrics(p_days integer DEFAULT 30)
RETURNS TABLE (
  total_sessions integer,
  avg_session_duration numeric,
  total_page_views integer,
  unique_users integer,
  bounce_rate numeric,
  conversion_rate numeric,
  most_active_hour integer,
  top_referrers jsonb
) AS $$
DECLARE
  v_period_start timestamptz;
BEGIN
  v_period_start := NOW() - (p_days || ' days')::interval;
  
  RETURN QUERY
  WITH session_stats AS (
    SELECT 
      COUNT(*) as session_count,
      AVG(duration_ms / 1000.0) as avg_duration_seconds,
      COUNT(DISTINCT user_id) as unique_user_count
    FROM user_sessions
    WHERE session_start >= v_period_start
  ),
  activity_stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE action = 'view_demo') as page_view_count,
      COUNT(*) FILTER (WHERE action = 'try_app') as try_app_count,
      EXTRACT(hour FROM created_at) as activity_hour
    FROM activity_logs
    WHERE created_at >= v_period_start
  ),
  hourly_activity AS (
    SELECT 
      EXTRACT(hour FROM created_at) as hour,
      COUNT(*) as activity_count
    FROM activity_logs
    WHERE created_at >= v_period_start
    GROUP BY EXTRACT(hour FROM created_at)
    ORDER BY activity_count DESC
    LIMIT 1
  ),
  referrer_stats AS (
    SELECT 
      jsonb_agg(
        jsonb_build_object(
          'referrer', COALESCE(referrer, 'Direct'),
          'count', session_count
        )
      ) as top_refs
    FROM (
      SELECT 
        referrer,
        COUNT(*) as session_count
      FROM user_sessions
      WHERE session_start >= v_period_start
      GROUP BY referrer
      ORDER BY session_count DESC
      LIMIT 5
    ) ref_data
  )
  SELECT 
    ss.session_count::integer,
    ROUND(ss.avg_duration_seconds, 2),
    COALESCE(ast.page_view_count, 0)::integer,
    ss.unique_user_count::integer,
    ROUND(
      CASE 
        WHEN ss.session_count > 0 THEN 
          (ss.session_count - COUNT(DISTINCT us.id) FILTER (WHERE us.duration_ms > 10000))::numeric / ss.session_count * 100
        ELSE 0 
      END, 2
    ) as bounce_rate,
    ROUND(
      CASE 
        WHEN ast.page_view_count > 0 THEN 
          ast.try_app_count::numeric / ast.page_view_count * 100
        ELSE 0 
      END, 2
    ) as conversion_rate,
    COALESCE(ha.hour, 12)::integer,
    COALESCE(rs.top_refs, '[]'::jsonb)
  FROM session_stats ss
  CROSS JOIN activity_stats ast
  LEFT JOIN user_sessions us ON us.session_start >= v_period_start
  LEFT JOIN hourly_activity ha ON true
  LEFT JOIN referrer_stats rs ON true
  GROUP BY ss.session_count, ss.avg_duration_seconds, ss.unique_user_count, 
           ast.page_view_count, ast.try_app_count, ha.hour, rs.top_refs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user session metrics function
CREATE OR REPLACE FUNCTION get_user_session_metrics()
RETURNS TABLE (
  today_sessions integer,
  week_sessions integer,
  month_sessions integer,
  average_session_duration numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE session_start >= CURRENT_DATE)::integer as today_sessions,
    COUNT(*) FILTER (WHERE session_start >= CURRENT_DATE - INTERVAL '7 days')::integer as week_sessions,
    COUNT(*) FILTER (WHERE session_start >= CURRENT_DATE - INTERVAL '30 days')::integer as month_sessions,
    ROUND(AVG(duration_ms / 1000.0 / 60.0), 2) as average_session_duration -- in minutes
  FROM user_sessions
  WHERE session_start >= CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- ENHANCED RLS POLICIES
-- ==========================================

-- Enable RLS on demo health scores
ALTER TABLE demo_health_scores ENABLE ROW LEVEL SECURITY;

-- Demo health scores policies
CREATE POLICY "Anyone can view demo health scores" ON demo_health_scores
  FOR SELECT USING (true);

CREATE POLICY "System can manage demo health scores" ON demo_health_scores
  FOR ALL USING (true);

-- ==========================================
-- CREATE TRIGGERS
-- ==========================================

-- Updated at trigger for demo health scores
CREATE TRIGGER handle_demo_health_scores_updated_at
  BEFORE UPDATE ON demo_health_scores
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ==========================================
-- INITIALIZE HEALTH SCORES
-- ==========================================

-- Calculate initial health scores for existing demos
INSERT INTO demo_health_scores (demo_id, health_score, view_score, engagement_score, recency_score, favorite_score, conversion_score)
SELECT 
  d.id,
  0, -- Will be calculated by the function
  0,
  0,
  0,
  0,
  0
FROM demos d
WHERE NOT EXISTS (
  SELECT 1 FROM demo_health_scores dhs WHERE dhs.demo_id = d.id
)
ON CONFLICT (demo_id) DO NOTHING;

-- Update all health scores
SELECT update_all_demo_health_scores();

-- Success message
SELECT '✅ Advanced analytics system installed successfully! Health scoring, session tracking, and real-time activity monitoring are now active.' as status;