/*
  # Fix toggle_favorite function overload conflict

  This fixes the PGRST203 error by removing conflicting function definitions
  and creating a single, correct toggle_favorite function.

  ## Changes
  - Drop all existing toggle_favorite functions
  - Create single toggle_favorite function with correct signature
  - Ensure proper RLS and functionality
*/

-- Drop all existing toggle_favorite functions to resolve overload conflict
DROP FUNCTION IF EXISTS toggle_favorite(uuid, uuid);
DROP FUNCTION IF EXISTS toggle_favorite(uuid);
DROP FUNCTION IF EXISTS toggle_favorite(p_demo_id uuid, p_user_id uuid);
DROP FUNCTION IF EXISTS toggle_favorite(p_demo_id uuid);

-- Create the correct toggle_favorite function
CREATE OR REPLACE FUNCTION toggle_favorite(p_demo_id uuid)
RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
  v_exists boolean;
BEGIN
  -- Get current user ID
  SELECT auth.uid() INTO v_user_id;
  
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if favorite exists
  SELECT EXISTS(
    SELECT 1 FROM user_favorites 
    WHERE user_id = v_user_id AND demo_id = p_demo_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Remove favorite
    DELETE FROM user_favorites 
    WHERE user_id = v_user_id AND demo_id = p_demo_id;
    
    -- Log activity
    INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
    VALUES (v_user_id, 'remove_favorite', 'demo', p_demo_id, jsonb_build_object('demo_id', p_demo_id));
    
    RETURN false;
  ELSE
    -- Add favorite
    INSERT INTO user_favorites (user_id, demo_id)
    VALUES (v_user_id, p_demo_id);
    
    -- Log activity
    INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
    VALUES (v_user_id, 'add_favorite', 'demo', p_demo_id, jsonb_build_object('demo_id', p_demo_id));
    
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION toggle_favorite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_favorite(uuid) TO anon;

-- Verify the function works
SELECT 'toggle_favorite function created successfully' as status;