/*
  # Fix toggle_favorite function duplicate key constraint error

  1. Problem
    - The toggle_favorite function was trying to insert favorites without checking if they already exist
    - This caused duplicate key violations on the unique constraint user_favorites_user_id_demo_id_key

  2. Solution
    - Replace the toggle_favorite function with proper existence checking
    - Delete existing favorites (unfavorite) or insert new ones (favorite)
    - Return correct boolean values indicating the final state
*/

CREATE OR REPLACE FUNCTION toggle_favorite(p_demo_id uuid)
RETURNS boolean AS $$
DECLARE
  is_favorited boolean;
BEGIN
  -- Check if the demo is already favorited by the current user
  SELECT EXISTS (
    SELECT 1
    FROM user_favorites
    WHERE user_id = auth.uid() AND demo_id = p_demo_id
  ) INTO is_favorited;

  IF is_favorited THEN
    -- If already favorited, remove it
    DELETE FROM user_favorites
    WHERE user_id = auth.uid() AND demo_id = p_demo_id;
    RETURN FALSE; -- Indicate that it was unfavorited
  ELSE
    -- If not favorited, add it
    INSERT INTO user_favorites (user_id, demo_id)
    VALUES (auth.uid(), p_demo_id);
    RETURN TRUE; -- Indicate that it was favorited
  END IF;
END;
$$ LANGUAGE plpgsql;