# 🗂️ Create Storage Bucket in Supabase

## **Step 1: Go to Supabase SQL Editor** (1 min)

1. **Open:** https://supabase.com/dashboard
2. **Click your project:** hypapdrapycaqwaszuoy
3. **Click:** SQL Editor (left sidebar)

## **Step 2: Run Storage Setup SQL** (2 mins)

**Copy this entire SQL block and paste it in the SQL Editor:**

```sql
-- Create storage bucket for demo screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('demo-screenshots', 'demo-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for public read access
CREATE POLICY "Public read access for demo screenshots" ON storage.objects
FOR SELECT USING (bucket_id = 'demo-screenshots');

-- Allow authenticated users to upload screenshots
CREATE POLICY "Authenticated users can upload demo screenshots" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'demo-screenshots' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own uploads
CREATE POLICY "Users can update their own uploads" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'demo-screenshots' 
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own uploads" ON storage.objects
FOR DELETE USING (
  bucket_id = 'demo-screenshots' 
  AND auth.role() = 'authenticated'
);

-- Verify bucket was created
SELECT 'Storage bucket created successfully!' as status;
```

## **Step 3: Click RUN** (1 min)

1. **Click the RUN button** in the SQL Editor
2. **Wait for success message**
3. **Should see:** "Storage bucket created successfully!"

## **Step 4: Test Your App** (1 min)

1. **Go to:** https://lyzr-concept-tracker.netlify.app
2. **Should now show:** Login form (no storage errors)
3. **Create admin account:**
   - Email: `jeremy@lyzr.ai`
   - Password: `admin123456`
   - Display Name: `Jeremy`

## **✅ Expected Result:**

After creating the storage bucket, your app should work perfectly with:
- ✅ Login form appears
- ✅ Admin account creation works
- ✅ Image upload functionality ready
- ✅ All tabs accessible

**This is the final piece needed to make your app fully functional!**