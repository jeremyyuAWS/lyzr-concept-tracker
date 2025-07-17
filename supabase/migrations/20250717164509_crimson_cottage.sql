/*
  # Add User Favorites Functionality

  1. New Tables
    - `user_favorites` - Track which users have favorited which demos
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `demo_id` (uuid, references demos)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on user_favorites table
    - Add policies for users to manage their own favorites
    - Add policy for reading favorites for demo stats

  3. Indexes
    - Composite index on (user_id, demo_id) for efficient lookups
    - Index on demo_id for counting favorites per demo
*/

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  demo_id uuid NOT NULL REFERENCES demos(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, demo_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_demo_id ON user_favorites(demo_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_favorites
CREATE POLICY "Users can view their own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Allow reading favorite counts (for demo statistics)
CREATE POLICY "Anyone can view favorite counts" ON user_favorites
  FOR SELECT USING (true);

-- Function to toggle favorite status
CREATE OR REPLACE FUNCTION toggle_favorite(p_demo_id uuid)
RETURNS boolean AS $$
DECLARE
  favorite_exists boolean;
BEGIN
  -- Check if favorite already exists
  SELECT EXISTS(
    SELECT 1 FROM user_favorites 
    WHERE user_id = auth.uid() AND demo_id = p_demo_id
  ) INTO favorite_exists;

  IF favorite_exists THEN
    -- Remove favorite
    DELETE FROM user_favorites 
    WHERE user_id = auth.uid() AND demo_id = p_demo_id;
    RETURN false;
  ELSE
    -- Add favorite
    INSERT INTO user_favorites (user_id, demo_id) 
    VALUES (auth.uid(), p_demo_id);
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's favorites
CREATE OR REPLACE FUNCTION get_user_favorites(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(demo_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT uf.demo_id
  FROM user_favorites uf
  WHERE uf.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get favorite count for a demo
CREATE OR REPLACE FUNCTION get_demo_favorite_count(p_demo_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM user_favorites
    WHERE demo_id = p_demo_id
  );
END;
$$ LANGUAGE plpgsql;