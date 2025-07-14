/*
  # Add featured and video columns to demos table

  1. New Columns
    - `is_featured` (boolean, default false) - marks demos as featured for spotlight section
    - `video_url` (text, nullable) - optional video overview/demo URL

  2. Changes
    - Add is_featured column with boolean type and false default
    - Add video_url column with text type, nullable for optional video links
    - Both columns are added safely with IF NOT EXISTS checks

  3. Security
    - No RLS changes needed - existing policies will cover new columns
    - New columns inherit existing table permissions
*/

-- Add is_featured column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'demos' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE demos ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add video_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'demos' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE demos ADD COLUMN video_url TEXT;
  END IF;
END $$;

-- Create index for featured demos for better performance
CREATE INDEX IF NOT EXISTS demos_is_featured_idx ON demos(is_featured) WHERE is_featured = true;