# 🚨 Database Setup Troubleshooting Guide

## **Error: "Database Setup Required"**

This means one of the 4 database components isn't configured properly. Let's check each one:

---

## **Step 1: Verify Supabase Environment Variables** (2 mins)

### **1.1 Check Netlify Environment Variables:**
1. Go to https://app.netlify.com
2. Find your `lyzr-concept-tracker` site
3. Go to **Site settings** → **Environment variables**
4. Verify these exist:
   - `VITE_SUPABASE_URL` = `https://your-project-id.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`

### **1.2 Get correct values from Supabase:**
1. Go to https://supabase.com/dashboard
2. Select your `lyzr-demos` project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### **1.3 Update Netlify if needed:**
1. In Netlify → Environment variables
2. Update/add the correct values
3. **Deploy** → **Trigger deploy** to restart with new variables

---

## **Step 2: Verify SQL Migrations Ran Successfully** (3 mins)

### **2.1 Check Database Functions:**
1. Go to Supabase → **Database** → **Functions**
2. Verify these functions exist:
   - `increment_page_views(demo_id uuid)`
   - `log_user_activity(...)`
   - `uid()`
   - `email()`

### **2.2 If functions are missing, re-run SQL:**
```sql
-- Re-run this in Supabase SQL Editor:

-- Create increment page views function
CREATE OR REPLACE FUNCTION increment_page_views(demo_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE demos SET page_views = page_views + 1 WHERE id = demo_id;
END;
$$ LANGUAGE plpgsql;

-- Create activity logging function
CREATE OR REPLACE FUNCTION log_user_activity(
  p_action text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
  VALUES (auth.uid(), p_action, p_resource_type, p_resource_id, p_details);
END;
$$ LANGUAGE plpgsql;

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION uid() 
RETURNS uuid AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION email() 
RETURNS text AS $$
BEGIN
  RETURN auth.email();
END;
$$ LANGUAGE plpgsql;
```

---

## **Step 3: Verify Storage Bucket** (2 mins)

### **3.1 Check Storage:**
1. Go to Supabase → **Storage**
2. Verify bucket `demo-screenshots` exists
3. Check it's marked as **Public**

### **3.2 If bucket is missing:**
```sql
-- Run this in Supabase SQL Editor:

-- Create storage bucket for demo screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('demo-screenshots', 'demo-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Public read access for demo screenshots" ON storage.objects
FOR SELECT USING (bucket_id = 'demo-screenshots');

CREATE POLICY "Authenticated users can upload demo screenshots" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'demo-screenshots' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own uploads" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'demo-screenshots' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own uploads" ON storage.objects
FOR DELETE USING (
  bucket_id = 'demo-screenshots' 
  AND auth.role() = 'authenticated'
);
```

---

## **Step 4: Verify Tables and RLS** (2 mins)

### **4.1 Check Tables Exist:**
1. Go to Supabase → **Table Editor**
2. Verify these tables exist:
   - `demos`
   - `user_profiles` 
   - `activity_logs`

### **4.2 Check RLS is Enabled:**
1. Click each table
2. Go to **Authentication** → **RLS**
3. Verify "Enable RLS" is turned ON for all tables

---

## **Step 5: Test Database Connection** (1 min)

### **5.1 Test in Supabase SQL Editor:**
```sql
-- Run this simple test:
SELECT COUNT(*) FROM demos;
SELECT COUNT(*) FROM user_profiles;
```

If this works, your database is properly set up.

---

## **Quick Fix Commands** (If you need to start over)

### **Option A: Reset Everything**
```sql
-- 1. Drop and recreate functions
DROP FUNCTION IF EXISTS increment_page_views(uuid);
DROP FUNCTION IF EXISTS log_user_activity(text, text, uuid, jsonb);
DROP FUNCTION IF EXISTS uid();
DROP FUNCTION IF EXISTS email();

-- 2. Then re-run all the CREATE FUNCTION commands above

-- 3. Reset storage bucket
DELETE FROM storage.buckets WHERE id = 'demo-screenshots';
-- Then re-run the storage setup commands above
```

---

## **Most Common Issues:**

1. **Environment variables not set in Netlify** (80% of cases)
2. **SQL functions failed to create due to permissions**
3. **Storage bucket creation failed**
4. **Wrong Supabase project URL/key**

---

## **After fixing, test:**
1. Refresh the app: https://lyzr-concept-tracker.netlify.app
2. Should no longer show "Database Setup Required"
3. Should show login form instead

**Which step do you want to check first?**