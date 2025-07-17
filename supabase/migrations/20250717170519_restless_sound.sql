/*
  # Fix toggle_favorite function duplicate key constraint error

  1. Database Changes
    - Ensure user_favorites table has proper unique constraint
    - Update toggle_favorite function to properly handle existing favorites
    - Add proper RLS policies for user_favorites table

  2. Security
    - Enable RLS on user_favorites table
    - Add policies for users to manage their own favorites

  3. Function Updates
    - Replace toggle_favorite function with proper logic
    - Check for existing favorites before insert/delete
    - Return boolean indicating add/remove action
*/

-- Create the user_favorites table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_favorites (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  demo_id uuid NOT NULL REFERENCES demos(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, demo_id) -- Ensures unique favorite entries
);

-- Enable Row Level Security (RLS) for user_favorites
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON user_favorites;

-- RLS Policy: Users can view their own favorites
CREATE POLICY "Users can view their own favorites" ON user_favorites
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policy: Users can insert their own favorites
CREATE POLICY "Users can insert their own favorites" ON user_favorites
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policy: Users can delete their own favorites
CREATE POLICY "Users can delete their own favorites" ON user_favorites
  FOR DELETE USING (user_id = auth.uid());

-- Create or replace the toggle_favorite function
CREATE OR REPLACE FUNCTION toggle_favorite(p_demo_id uuid)
RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
  v_exists boolean;
BEGIN
  -- Get the current authenticated user's ID
  v_user_id := auth.uid();
  
  -- Check if the favorite already exists
  SELECT EXISTS (
    SELECT 1
    FROM user_favorites
    WHERE user_id = v_user_id AND demo_id = p_demo_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- If it exists, delete it
    DELETE FROM user_favorites
    WHERE user_id = v_user_id AND demo_id = p_demo_id;
    RETURN FALSE; -- Indicates it was removed
  ELSE
    -- If it doesn't exist, insert it
    INSERT INTO user_favorites (user_id, demo_id)
    VALUES (v_user_id, p_demo_id);
    RETURN TRUE; -- Indicates it was added
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;