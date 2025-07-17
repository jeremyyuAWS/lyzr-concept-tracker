/*
# Fix toggle_favorite function duplicate key constraint error

This migration fixes the duplicate key constraint error in the toggle_favorite function.
The function now properly checks if a favorite exists before deciding whether to insert or delete.

1. Updates toggle_favorite function to handle proper toggle logic
2. Returns boolean indicating favorite status (true = favorited, false = unfavorited)
3. Prevents duplicate key violations by checking existence first
*/

CREATE OR REPLACE FUNCTION toggle_favorite(p_demo_id uuid)
RETURNS boolean AS $$
DECLARE
  is_favorited boolean;
BEGIN
  -- Check if the demo is already favorited by the current user
  SELECT EXISTS (SELECT 1 FROM user_favorites WHERE user_id = auth.uid() AND demo_id = p_demo_id) INTO is_favorited;

  IF is_favorited THEN
    -- If already favorited, remove it
    DELETE FROM user_favorites WHERE user_id = auth.uid() AND demo_id = p_demo_id;
    RETURN FALSE; -- Indicate that it's no longer favorited
  ELSE
    -- If not favorited, add it
    INSERT INTO user_favorites (user_id, demo_id) VALUES (auth.uid(), p_demo_id);
    RETURN TRUE; -- Indicate that it's now favorited
  END IF;
END;
$$ LANGUAGE plpgsql;