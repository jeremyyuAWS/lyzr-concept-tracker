/*
  # Add Favorites Folders System

  1. New Tables
    - `favorite_folders` - User-created folders for organizing favorites
    - Update `user_favorites` - Add folder_id reference

  2. Security
    - Enable RLS on new tables
    - Add policies for user access to their own folders
    - Ensure folders belong to users who created them

  3. Features
    - Users can create custom folders
    - Drag and drop demos between folders
    - Hierarchical organization of favorites
*/

-- Create favorite_folders table
CREATE TABLE IF NOT EXISTS favorite_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#6366f1',
  icon text DEFAULT 'folder',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add folder_id to user_favorites
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_favorites' AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE user_favorites ADD COLUMN folder_id uuid REFERENCES favorite_folders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add sort_order to user_favorites for custom ordering within folders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_favorites' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE user_favorites ADD COLUMN sort_order integer DEFAULT 0;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_favorite_folders_user_id ON favorite_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_folders_sort_order ON favorite_folders(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_user_favorites_folder_id ON user_favorites(folder_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_sort_order ON user_favorites(folder_id, sort_order);

-- Enable RLS
ALTER TABLE favorite_folders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for favorite_folders
CREATE POLICY "Users can view their own folders" ON favorite_folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders" ON favorite_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" ON favorite_folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" ON favorite_folders
  FOR DELETE USING (auth.uid() = user_id);

-- Update existing user_favorites policies to handle folders
DROP POLICY IF EXISTS "Users can create their own favorites" ON user_favorites;
CREATE POLICY "Users can create their own favorites" ON user_favorites
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    (folder_id IS NULL OR EXISTS (
      SELECT 1 FROM favorite_folders WHERE id = folder_id AND user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Users can update their own favorites" ON user_favorites;
CREATE POLICY "Users can update their own favorites" ON user_favorites
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    (folder_id IS NULL OR EXISTS (
      SELECT 1 FROM favorite_folders WHERE id = folder_id AND user_id = auth.uid()
    ))
  );

-- Create updated_at trigger for favorite_folders
CREATE TRIGGER handle_favorite_folders_updated_at
  BEFORE UPDATE ON favorite_folders
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create functions for folder management
CREATE OR REPLACE FUNCTION create_favorite_folder(
  p_name text,
  p_description text DEFAULT NULL,
  p_color text DEFAULT '#6366f1',
  p_icon text DEFAULT 'folder'
)
RETURNS uuid AS $$
DECLARE
  v_folder_id uuid;
  v_max_order integer;
BEGIN
  -- Get max sort order for user's folders
  SELECT COALESCE(MAX(sort_order), 0) + 1 INTO v_max_order
  FROM favorite_folders
  WHERE user_id = auth.uid();
  
  -- Create the folder
  INSERT INTO favorite_folders (user_id, name, description, color, icon, sort_order)
  VALUES (auth.uid(), p_name, p_description, p_color, p_icon, v_max_order)
  RETURNING id INTO v_folder_id;
  
  RETURN v_folder_id;
END;
$$ LANGUAGE plpgsql;

-- Function to move favorite to folder
CREATE OR REPLACE FUNCTION move_favorite_to_folder(
  p_demo_id uuid,
  p_folder_id uuid DEFAULT NULL,
  p_sort_order integer DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_sort_order integer;
BEGIN
  -- If no sort order provided, put at end of folder/root
  IF p_sort_order IS NULL THEN
    SELECT COALESCE(MAX(sort_order), 0) + 1 INTO v_sort_order
    FROM user_favorites
    WHERE user_id = auth.uid() AND 
          ((folder_id IS NULL AND p_folder_id IS NULL) OR folder_id = p_folder_id);
  ELSE
    v_sort_order := p_sort_order;
  END IF;
  
  -- Update the favorite
  UPDATE user_favorites
  SET folder_id = p_folder_id, sort_order = v_sort_order
  WHERE user_id = auth.uid() AND demo_id = p_demo_id;
END;
$$ LANGUAGE plpgsql;

-- Function to reorder folders
CREATE OR REPLACE FUNCTION reorder_favorite_folders(
  p_folder_orders jsonb
)
RETURNS void AS $$
DECLARE
  folder_order jsonb;
BEGIN
  -- Update sort order for each folder
  FOR folder_order IN SELECT jsonb_array_elements(p_folder_orders)
  LOOP
    UPDATE favorite_folders
    SET sort_order = (folder_order->>'sort_order')::integer
    WHERE id = (folder_order->>'id')::uuid AND user_id = auth.uid();
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to reorder favorites within a folder
CREATE OR REPLACE FUNCTION reorder_favorites_in_folder(
  p_folder_id uuid,
  p_favorite_orders jsonb
)
RETURNS void AS $$
DECLARE
  favorite_order jsonb;
BEGIN
  -- Update sort order for each favorite in the folder
  FOR favorite_order IN SELECT jsonb_array_elements(p_favorite_orders)
  LOOP
    UPDATE user_favorites
    SET sort_order = (favorite_order->>'sort_order')::integer
    WHERE demo_id = (favorite_order->>'demo_id')::uuid 
          AND user_id = auth.uid()
          AND ((folder_id IS NULL AND p_folder_id IS NULL) OR folder_id = p_folder_id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create default "Uncategorized" folder for existing favorites (optional)
-- Users can organize their existing favorites into this or create new folders

SELECT 'Favorites folders system created successfully!' as status;