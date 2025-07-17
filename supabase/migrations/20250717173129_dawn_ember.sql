/*
# Fix toggle_favorite function duplicate key constraint error

1. Database Function
   - `toggle_favorite(p_demo_id uuid)` - properly handles toggle logic
   - Checks if favorite exists before inserting/deleting
   - Returns boolean indicating final state (true = favorited, false = unfavorited)

2. Security
   - Uses SECURITY DEFINER to ensure proper permissions
   - Validates user authentication via auth.uid()

3. Logic
   - If favorite exists: DELETE it and return FALSE (unfavorited)
   - If favorite doesn't exist: INSERT it and return TRUE (favorited)
*/

CREATE OR REPLACE FUNCTION toggle_favorite(p_demo_id uuid)
RETURNS boolean AS $$
DECLARE
    v_user_id uuid;
    v_exists boolean;
BEGIN
    v_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
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
        RETURN FALSE; -- Indicate that it's no longer favorited
    ELSE
        -- If it doesn't exist, insert it (favorite)
        INSERT INTO user_favorites (user_id, demo_id)
        VALUES (v_user_id, p_demo_id);
        RETURN TRUE; -- Indicate that it's now favorited
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;