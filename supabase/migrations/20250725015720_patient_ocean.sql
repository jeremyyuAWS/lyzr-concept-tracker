/*
  # Add Global Folders Feature

  1. Database Changes
    - Add `is_global` column to `favorite_folders` table
    - Add `created_by` column to track who created global folders
    - Update RLS policies to allow all users to view global folders
    - Add policy for super admins to create global folders

  2. Security
    - Only super admins can create global folders
    - All users can view global folders
    - Users can still create their own personal folders
    - Users can move demos between personal and global folders
*/

-- Add new columns to favorite_folders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'favorite_folders' AND column_name = 'is_global'
  ) THEN
    ALTER TABLE favorite_folders ADD COLUMN is_global boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'favorite_folders' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE favorite_folders ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update existing folders to have created_by as user_id
UPDATE favorite_folders 
SET created_by = user_id 
WHERE created_by IS NULL;

-- Update RLS policies for favorite_folders
DROP POLICY IF EXISTS "Users can view their own folders" ON favorite_folders;
DROP POLICY IF EXISTS "Users can view global and own folders" ON favorite_folders;
CREATE POLICY "Users can view global and own folders" ON favorite_folders
  FOR SELECT USING (
    (auth.uid() = user_id) OR 
    (is_global = true)
  );

DROP POLICY IF EXISTS "Users can create their own folders" ON favorite_folders;
CREATE POLICY "Users can create their own folders" ON favorite_folders
  FOR INSERT WITH CHECK (
    (auth.uid() = user_id AND is_global = false) OR
    (is_global = true AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    ))
  );

DROP POLICY IF EXISTS "Users can update their own folders" ON favorite_folders;
CREATE POLICY "Users can update their own folders" ON favorite_folders
  FOR UPDATE USING (
    (auth.uid() = user_id AND is_global = false) OR
    (is_global = true AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    ))
  );

DROP POLICY IF EXISTS "Users can delete their own folders" ON favorite_folders;
CREATE POLICY "Users can delete their own folders" ON favorite_folders
  FOR DELETE USING (
    (auth.uid() = user_id AND is_global = false) OR
    (is_global = true AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    ))
  );

-- Update user_favorites policies to allow moving to global folders
DROP POLICY IF EXISTS "Users can create their own favorites" ON user_favorites;
CREATE POLICY "Users can create their own favorites" ON user_favorites
  FOR INSERT WITH CHECK (
    (auth.uid() = user_id) AND (
      (folder_id IS NULL) OR 
      (EXISTS (
        SELECT 1 FROM favorite_folders 
        WHERE id = user_favorites.folder_id AND (
          (user_id = auth.uid()) OR (is_global = true)
        )
      ))
    )
  );

DROP POLICY IF EXISTS "Users can update their own favorites" ON user_favorites;
CREATE POLICY "Users can update their own favorites" ON user_favorites
  FOR UPDATE USING (
    (auth.uid() = user_id) AND (
      (folder_id IS NULL) OR 
      (EXISTS (
        SELECT 1 FROM favorite_folders 
        WHERE id = user_favorites.folder_id AND (
          (user_id = auth.uid()) OR (is_global = true)
        )
      ))
    )
  );

-- Add index for global folders
CREATE INDEX IF NOT EXISTS idx_favorite_folders_global ON favorite_folders(is_global) WHERE is_global = true;

-- Create some sample global folders
INSERT INTO favorite_folders (user_id, created_by, name, description, color, icon, is_global, sort_order) VALUES
(
  (SELECT user_id FROM user_profiles WHERE role = 'super_admin' LIMIT 1),
  (SELECT user_id FROM user_profiles WHERE role = 'super_admin' LIMIT 1),
  'Enterprise Demos',
  'High-impact demos perfect for enterprise client presentations',
  '#1f2937',
  'building',
  true,
  0
),
(
  (SELECT user_id FROM user_profiles WHERE role = 'super_admin' LIMIT 1),
  (SELECT user_id FROM user_profiles WHERE role = 'super_admin' LIMIT 1),
  'Quick Wins',
  'Fast, impressive demos for 5-minute presentations',
  '#059669',
  'zap',
  true,
  1
),
(
  (SELECT user_id FROM user_profiles WHERE role = 'super_admin' LIMIT 1),
  (SELECT user_id FROM user_profiles WHERE role = 'super_admin' LIMIT 1),
  'Technical Deep Dives',
  'Comprehensive demos for developer and technical audiences',
  '#7c3aed',
  'code',
  true,
  2
)
ON CONFLICT DO NOTHING;

SELECT 'Global folders feature added successfully!' as status;