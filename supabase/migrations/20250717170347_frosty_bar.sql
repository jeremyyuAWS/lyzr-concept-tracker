/*
  # Fix toggle_favorite function to prevent duplicate key errors

  1. Updates
    - Recreate the toggle_favorite function with proper logic
    - Function now checks if favorite exists before inserting/deleting
    - Prevents duplicate key violations on user_favorites table

  2. Security
    - Function uses SECURITY DEFINER to ensure proper permissions
    - Respects existing RLS policies on user_favorites table
*/

CREATE OR REPLACE FUNCTION toggle_favorite(p_demo_id uuid)
RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
  v_exists boolean;
  v_is_favorited boolean;
BEGIN
  v_user_id := auth.uid();

  -- Check if the favorite already exists
  SELECT EXISTS (
    SELECT 1
    FROM user_favorites
    WHERE user_id = v_user_id AND demo_id = p_demo_id
  ) INTO v_exists;

  IF v_exists THEN
    -- If it exists, delete it (unfavorite)
    DELETE FROM user_favorites
    WHERE user_id = v_user_id AND demo_id = p_demo_id;
    v_is_favorited := FALSE;
    
    -- Log the activity if log function exists
    BEGIN
      PERFORM log_user_activity('remove_favorite', 'demo', p_demo_id, jsonb_build_object('user_id', v_user_id));
    EXCEPTION
      WHEN others THEN
        -- Ignore logging errors
        NULL;
    END;
  ELSE
    -- If it doesn't exist, insert it (favorite)
    INSERT INTO user_favorites (user_id, demo_id)
    VALUES (v_user_id, p_demo_id);
    v_is_favorited := TRUE;
    
    -- Log the activity if log function exists
    BEGIN
      PERFORM log_user_activity('add_favorite', 'demo', p_demo_id, jsonb_build_object('user_id', v_user_id));
    EXCEPTION
      WHEN others THEN
        -- Ignore logging errors
        NULL;
    END;
  END IF;

  RETURN v_is_favorited;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;