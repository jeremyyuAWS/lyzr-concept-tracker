/*
  # Enhanced Login and Engagement Tracking

  1. Database Functions
    - Enhanced login tracking
    - User engagement scoring
    - Activity aggregation
    - Session management

  2. User Analytics
    - Last login tracking
    - Engagement metrics calculation
    - Activity streaks
    - Usage patterns

  3. Performance Optimization
    - Efficient queries for favorites
    - Proper indexing
    - Optimized RLS policies
*/

-- Enhanced function to update user login and engagement
CREATE OR REPLACE FUNCTION track_user_login(
  p_user_id uuid DEFAULT auth.uid(),
  p_user_agent text DEFAULT NULL,
  p_ip_address text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_profile_exists boolean;
  v_last_login timestamptz;
  v_login_streak integer := 1;
BEGIN
  -- Check if profile exists
  SELECT EXISTS(
    SELECT 1 FROM user_profiles WHERE user_id = p_user_id
  ) INTO v_profile_exists;
  
  -- If no profile exists, create one
  IF NOT v_profile_exists THEN
    INSERT INTO user_profiles (
      user_id, 
      email, 
      display_name, 
      role,
      last_login,
      is_active
    )
    SELECT 
      au.id,
      au.email,
      COALESCE(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1)),
      CASE 
        WHEN au.email IN ('jeremy@lyzr.ai', 'admin@lyzr.ai') THEN 'admin'
        ELSE 'user'
      END,
      NOW(),
      true
    FROM auth.users au
    WHERE au.id = p_user_id;
  ELSE
    -- Get last login to calculate streak
    SELECT last_login INTO v_last_login
    FROM user_profiles 
    WHERE user_id = p_user_id;
    
    -- Calculate login streak
    IF v_last_login IS NOT NULL THEN
      -- If last login was yesterday, increment streak
      IF DATE(v_last_login) = DATE(NOW() - INTERVAL '1 day') THEN
        -- Get current streak and increment
        SELECT COALESCE((details->>'login_streak')::integer, 0) + 1
        INTO v_login_streak
        FROM activity_logs
        WHERE user_id = p_user_id AND action = 'login'
        ORDER BY created_at DESC
        LIMIT 1;
      ELSIF DATE(v_last_login) = DATE(NOW()) THEN
        -- Same day login, keep current streak
        SELECT COALESCE((details->>'login_streak')::integer, 1)
        INTO v_login_streak
        FROM activity_logs
        WHERE user_id = p_user_id AND action = 'login'
        ORDER BY created_at DESC
        LIMIT 1;
      END IF;
      -- If gap > 1 day, streak resets to 1
    END IF;
    
    -- Update user profile with last login
    UPDATE user_profiles 
    SET 
      last_login = NOW(),
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
  
  -- Log the login activity with engagement data
  INSERT INTO activity_logs (
    user_id,
    action,
    resource_type,
    details,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    p_user_id,
    'login',
    'authentication',
    jsonb_build_object(
      'login_streak', v_login_streak,
      'login_time', NOW(),
      'session_start', true
    ),
    p_ip_address,
    p_user_agent,
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate user engagement score
CREATE OR REPLACE FUNCTION calculate_user_engagement(p_user_id uuid DEFAULT auth.uid())
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_total_logins integer := 0;
  v_demos_viewed integer := 0;
  v_demos_favorited integer := 0;
  v_demos_created integer := 0;
  v_last_active timestamptz;
  v_days_active integer := 0;
  v_engagement_score numeric := 0;
  v_login_streak integer := 0;
BEGIN
  -- Get login count (last 30 days)
  SELECT COUNT(*)
  INTO v_total_logins
  FROM activity_logs
  WHERE user_id = p_user_id 
    AND action = 'login'
    AND created_at > NOW() - INTERVAL '30 days';
  
  -- Get demos viewed (last 30 days)
  SELECT COUNT(DISTINCT resource_id)
  INTO v_demos_viewed
  FROM activity_logs
  WHERE user_id = p_user_id 
    AND action = 'view_demo'
    AND created_at > NOW() - INTERVAL '30 days';
  
  -- Get demos favorited
  SELECT COUNT(*)
  INTO v_demos_favorited
  FROM user_favorites
  WHERE user_id = p_user_id;
  
  -- Get demos created (if user is admin)
  SELECT COUNT(*)
  INTO v_demos_created
  FROM demos
  WHERE owner = (SELECT email FROM user_profiles WHERE user_id = p_user_id);
  
  -- Get last activity
  SELECT MAX(created_at)
  INTO v_last_active
  FROM activity_logs
  WHERE user_id = p_user_id;
  
  -- Calculate days active (last 30 days)
  SELECT COUNT(DISTINCT DATE(created_at))
  INTO v_days_active
  FROM activity_logs
  WHERE user_id = p_user_id 
    AND created_at > NOW() - INTERVAL '30 days';
  
  -- Get current login streak
  SELECT COALESCE((details->>'login_streak')::integer, 0)
  INTO v_login_streak
  FROM activity_logs
  WHERE user_id = p_user_id AND action = 'login'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Calculate engagement score (0-100)
  v_engagement_score := LEAST(100, (
    (v_total_logins * 2) +           -- 2 points per login
    (v_demos_viewed * 5) +           -- 5 points per demo viewed
    (v_demos_favorited * 10) +       -- 10 points per favorite
    (v_demos_created * 20) +         -- 20 points per demo created
    (v_days_active * 3) +            -- 3 points per active day
    (v_login_streak * 5)             -- 5 points per streak day
  ));
  
  -- Build result object
  v_result := jsonb_build_object(
    'user_id', p_user_id,
    'engagement_score', v_engagement_score,
    'total_logins', v_total_logins,
    'demos_viewed', v_demos_viewed,
    'demos_favorited', v_demos_favorited,
    'demos_created', v_demos_created,
    'days_active', v_days_active,
    'login_streak', v_login_streak,
    'last_active', v_last_active,
    'calculated_at', NOW()
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user engagement leaderboard
CREATE OR REPLACE FUNCTION get_engagement_leaderboard(p_limit integer DEFAULT 10)
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  role text,
  engagement_data jsonb,
  last_login timestamptz,
  is_active boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.user_id,
    up.email,
    up.display_name,
    up.role,
    calculate_user_engagement(up.user_id) as engagement_data,
    up.last_login,
    up.is_active
  FROM user_profiles up
  WHERE up.is_active = true
  ORDER BY (calculate_user_engagement(up.user_id)->>'engagement_score')::numeric DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced favorites functions with better error handling
CREATE OR REPLACE FUNCTION get_user_favorites_with_folders(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  folders jsonb,
  unorganized jsonb
) AS $$
DECLARE
  v_folders jsonb;
  v_unorganized jsonb;
BEGIN
  -- Get folders with their demos
  WITH folder_data AS (
    SELECT 
      ff.id,
      ff.name,
      ff.description,
      ff.color,
      ff.icon,
      ff.sort_order,
      COALESCE(
        jsonb_agg(
          CASE 
            WHEN d.id IS NOT NULL THEN
              jsonb_build_object(
                'id', d.id,
                'title', d.title,
                'description', d.description,
                'tags', d.tags,
                'netlify_url', d.netlify_url,
                'excalidraw_url', d.excalidraw_url,
                'supabase_url', d.supabase_url,
                'admin_url', d.admin_url,
                'screenshot_url', d.screenshot_url,
                'video_url', d.video_url,
                'owner', d.owner,
                'page_views', d.page_views,
                'created_at', d.created_at,
                'is_featured', d.is_featured,
                'sort_order', uf.sort_order
              )
            ELSE NULL
          END
          ORDER BY uf.sort_order NULLS LAST, d.created_at DESC
        ) FILTER (WHERE d.id IS NOT NULL),
        '[]'::jsonb
      ) as demos
    FROM favorite_folders ff
    LEFT JOIN user_favorites uf ON ff.id = uf.folder_id AND uf.user_id = p_user_id
    LEFT JOIN demos d ON uf.demo_id = d.id AND d.status = 'published'
    WHERE ff.user_id = p_user_id
    GROUP BY ff.id, ff.name, ff.description, ff.color, ff.icon, ff.sort_order
    ORDER BY ff.sort_order
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', name,
      'description', description,
      'color', color,
      'icon', icon,
      'sort_order', sort_order,
      'demos', demos
    )
    ORDER BY sort_order
  )
  INTO v_folders
  FROM folder_data;
  
  -- Get unorganized favorites
  WITH unorganized_data AS (
    SELECT 
      d.id,
      d.title,
      d.description,
      d.tags,
      d.netlify_url,
      d.excalidraw_url,
      d.supabase_url,
      d.admin_url,
      d.screenshot_url,
      d.video_url,
      d.owner,
      d.page_views,
      d.created_at,
      d.is_featured,
      uf.sort_order
    FROM user_favorites uf
    JOIN demos d ON uf.demo_id = d.id
    WHERE uf.user_id = p_user_id 
      AND uf.folder_id IS NULL
      AND d.status = 'published'
    ORDER BY uf.sort_order NULLS LAST, d.created_at DESC
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'title', title,
      'description', description,
      'tags', tags,
      'netlify_url', netlify_url,
      'excalidraw_url', excalidraw_url,
      'supabase_url', supabase_url,
      'admin_url', admin_url,
      'screenshot_url', screenshot_url,
      'video_url', video_url,
      'owner', owner,
      'page_views', page_views,
      'created_at', created_at,
      'is_featured', is_featured,
      'sort_order', sort_order
    )
    ORDER BY sort_order NULLS LAST, created_at DESC
  )
  INTO v_unorganized
  FROM unorganized_data;
  
  -- Return the results
  RETURN QUERY SELECT 
    COALESCE(v_folders, '[]'::jsonb) as folders,
    COALESCE(v_unorganized, '[]'::jsonb) as unorganized;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Improved toggle favorite function
CREATE OR REPLACE FUNCTION toggle_favorite(p_demo_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
DECLARE
  v_exists boolean;
  v_result boolean;
BEGIN
  -- Check if favorite exists
  SELECT EXISTS(
    SELECT 1 FROM user_favorites 
    WHERE user_id = p_user_id AND demo_id = p_demo_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Remove favorite
    DELETE FROM user_favorites 
    WHERE user_id = p_user_id AND demo_id = p_demo_id;
    
    -- Log the unfavorite action
    INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
    VALUES (p_user_id, 'unfavorite_demo', 'demo', p_demo_id, jsonb_build_object('action', 'remove'));
    
    v_result := false;
  ELSE
    -- Add favorite
    INSERT INTO user_favorites (user_id, demo_id, created_at)
    VALUES (p_user_id, p_demo_id, NOW());
    
    -- Log the favorite action
    INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
    VALUES (p_user_id, 'favorite_demo', 'demo', p_demo_id, jsonb_build_object('action', 'add'));
    
    v_result := true;
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_action ON activity_logs(user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_folder ON user_favorites(user_id, folder_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_sort_order ON user_favorites(user_id, sort_order);

-- Update RLS policies for enhanced security
DROP POLICY IF EXISTS "Users can view their own favorites enhanced" ON user_favorites;
CREATE POLICY "Users can view their own favorites enhanced" ON user_favorites
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "Users can manage their own favorites enhanced" ON user_favorites;
CREATE POLICY "Users can manage their own favorites enhanced" ON user_favorites
  FOR ALL USING (user_id = auth.uid());

-- Success message
SELECT '✅ Enhanced login/engagement tracking and favorites system updated successfully!' as status;