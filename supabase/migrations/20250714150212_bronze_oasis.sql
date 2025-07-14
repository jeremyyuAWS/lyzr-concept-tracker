/*
  # Update demos table for Lyzr Concept Tracker

  1. Schema Updates
    - Add missing fields: tags, supabase_url, admin_url, owner, page_views
    - Rename fields: demo_url -> netlify_url, blueprint_url -> excalidraw_url, thumbnail_url -> screenshot_url
    - Remove unused fields: industry, video_url
    - Update status field to match app needs

  2. Security
    - Update RLS policies for new schema
    - Ensure proper access controls
*/

-- Add new columns
ALTER TABLE demos ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE demos ADD COLUMN IF NOT EXISTS supabase_url text;
ALTER TABLE demos ADD COLUMN IF NOT EXISTS admin_url text;
ALTER TABLE demos ADD COLUMN IF NOT EXISTS owner text NOT NULL DEFAULT 'Unknown';
ALTER TABLE demos ADD COLUMN IF NOT EXISTS page_views integer DEFAULT 0;

-- Rename columns to match app structure
DO $$
BEGIN
  -- Rename demo_url to netlify_url
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'demos' AND column_name = 'demo_url'
  ) THEN
    ALTER TABLE demos RENAME COLUMN demo_url TO netlify_url;
  END IF;
  
  -- Rename blueprint_url to excalidraw_url  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'demos' AND column_name = 'blueprint_url'
  ) THEN
    ALTER TABLE demos RENAME COLUMN blueprint_url TO excalidraw_url;
  END IF;
  
  -- Rename thumbnail_url to screenshot_url
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'demos' AND column_name = 'thumbnail_url'
  ) THEN
    ALTER TABLE demos RENAME COLUMN thumbnail_url TO screenshot_url;
  END IF;
END $$;

-- Drop unused columns
ALTER TABLE demos DROP COLUMN IF EXISTS industry;
ALTER TABLE demos DROP COLUMN IF EXISTS video_url;

-- Update status constraint to match app needs
ALTER TABLE demos DROP CONSTRAINT IF EXISTS demos_status_check;
ALTER TABLE demos ADD CONSTRAINT demos_status_check 
  CHECK (status IN ('draft', 'published', 'archived'));

-- Update RLS policies for new schema
DROP POLICY IF EXISTS "Enable read access for all users" ON demos;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON demos;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON demos;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON demos;

-- Create updated policies
CREATE POLICY "Enable read access for all users"
  ON demos FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for authenticated users only"
  ON demos FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only"
  ON demos FOR UPDATE
  TO public
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only"
  ON demos FOR DELETE
  TO public
  USING (auth.role() = 'authenticated');

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS demos_tags_idx ON demos USING GIN (tags);
CREATE INDEX IF NOT EXISTS demos_owner_idx ON demos (owner);
CREATE INDEX IF NOT EXISTS demos_page_views_idx ON demos (page_views DESC);