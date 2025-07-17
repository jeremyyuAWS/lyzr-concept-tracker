/*
  # Fix toggle_favorite function duplicate key error

  1. Table Structure
    - Ensure user_favorites table has proper unique constraint
    - Enable Row Level Security (RLS)
    
  2. Security Policies
    - Users can view their own favorites
    - Users can insert their own favorites
    - Users can delete their own favorites
    
  3. Function Fix
    - Create/replace toggle_favorite function with proper logic
    - Check if favorite exists before inserting/deleting
    - Return true if favorite added, false if removed
*/

-- Ensure user_favorites table exists with proper structure
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  demo_id uuid NOT NULL REFERENCES demos(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, demo_id)
);

-- Enable Row Level Security
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON user_favorites;

-- Create RLS policies
CREATE POLICY "Users can view their own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Create or replace the toggle_favorite function with proper logic
CREATE OR REPLACE FUNCTION toggle_favorite(p_demo_id uuid)
RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
  v_exists boolean;
BEGIN
  -- Get the current user ID
  SELECT auth.uid() INTO v_user_id;

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

  -- If it exists, delete it (unfavorite)
  IF v_exists THEN
    DELETE FROM user_favorites
    WHERE user_id = v_user_id AND demo_id = p_demo_id;
    RETURN FALSE; -- Favorite removed
  ELSE
    -- If it doesn't exist, insert it (favorite)
    INSERT INTO user_favorites (user_id, demo_id)
    VALUES (v_user_id, p_demo_id);
    RETURN TRUE; -- Favorite added
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;