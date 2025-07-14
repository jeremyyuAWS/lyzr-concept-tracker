/*
  # Setup Storage for Demo Screenshots

  1. Storage Bucket
    - Create `demo-screenshots` bucket for image uploads
    - Set up public access policies
    - Configure file upload permissions

  2. Security
    - Public read access for screenshots
    - Authenticated users can upload
    - Admin users can delete
*/

-- Create storage bucket for demo screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'demo-screenshots',
  'demo-screenshots',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Policy for public read access to screenshots
CREATE POLICY "Public read access for demo screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'demo-screenshots');

-- Policy for authenticated users to upload screenshots
CREATE POLICY "Authenticated users can upload screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'demo-screenshots');

-- Policy for authenticated users to update their own screenshots
CREATE POLICY "Users can update screenshots"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'demo-screenshots');

-- Policy for admin users to delete screenshots
CREATE POLICY "Admins can delete screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'demo-screenshots' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'super_admin')
  )
);