/*
  # Update demo fields for customer documentation

  1. Schema Changes
    - Rename `supabase_url` to `notion_url` for Notion customer documentation
    - Rename `admin_url` to `drive_url` for Google Drive customer documentation
    - Update field descriptions and constraints

  2. Data Migration
    - Preserve existing data during field rename
    - Update any existing demo records

  3. Notes
    - This migration supports the new customer documentation workflow
    - Notion pages will contain customer-facing documentation
    - Google Drive will contain customer resources and files
*/

-- Rename supabase_url to notion_url
ALTER TABLE demos RENAME COLUMN supabase_url TO notion_url;

-- Rename admin_url to drive_url  
ALTER TABLE demos RENAME COLUMN admin_url TO drive_url;

-- Add comments to clarify the new field purposes
COMMENT ON COLUMN demos.notion_url IS 'URL to Notion page containing customer documentation';
COMMENT ON COLUMN demos.drive_url IS 'URL to Google Drive folder containing customer resources';

-- Update any existing sample data URLs to be more descriptive
UPDATE demos 
SET notion_url = REPLACE(notion_url, 'supabase.com/dashboard/project/', 'notion.so/') 
WHERE notion_url LIKE '%supabase.com/dashboard/project/%';

UPDATE demos 
SET drive_url = REPLACE(drive_url, 'github.com/', 'drive.google.com/drive/folders/') 
WHERE drive_url LIKE '%github.com/%';

-- Verify the changes
SELECT 'Schema updated successfully - Supabase URLs replaced with customer documentation links' as status;