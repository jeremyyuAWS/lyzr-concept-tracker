# 🔧 Supabase SQL Migrations Setup Guide

## **Step 1: Open Supabase SQL Editor** (2 mins)

### **1.1 Go to Supabase Dashboard:**
1. Open https://supabase.com/dashboard
2. Find and click your **lyzr-demos** project (or whatever you named it)
3. Wait for the project to fully load

### **1.2 Navigate to SQL Editor:**
1. In the left sidebar, look for **SQL Editor** (usually has a `</>` icon)
2. Click on **SQL Editor**
3. You should see a text area where you can write SQL

---

## **Step 2: Run Database Functions Migration** (3 mins)

### **2.1 Copy this entire SQL block:**
```sql
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

### **2.2 Execute the SQL:**
1. **Paste the entire SQL block** into the SQL Editor
2. Click the **"RUN"** button (usually blue, in top right)
3. Wait for execution to complete
4. **Success:** You should see "Success. No rows returned" or similar message
5. **Error:** If you get an error, screenshot it and I'll help fix it

---

## **Step 3: Run Storage Bucket Migration** (2 mins)

### **3.1 Copy this SQL block:**
```sql
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

### **3.2 Execute the SQL:**
1. **Clear the SQL Editor** and paste this new SQL block
2. Click **"RUN"** again
3. Wait for completion
4. **Success:** Should see success message

---

## **Step 4: Verify Everything Was Created** (2 mins)

### **4.1 Check Database Functions:**
1. Go to **Database** → **Functions** in Supabase sidebar
2. You should see these functions:
   - `increment_page_views`
   - `log_user_activity`
   - `uid`
   - `email`

### **4.2 Check Storage Bucket:**
1. Go to **Storage** in Supabase sidebar
2. You should see a bucket called **demo-screenshots**
3. It should be marked as **Public**

---

## **Step 5: Test Your App** (1 min)

### **5.1 Refresh Your App:**
1. Go to: https://lyzr-concept-tracker.netlify.app
2. **Success:** You should see the login form
3. **Still Error:** Try hard refresh (Ctrl+F5 or Cmd+Shift+R)

---

## **🚨 Common SQL Issues:**

### **Issue 1: "permission denied for relation storage.buckets"**
- **Cause:** Need to enable storage extension
- **Fix:** Run this first: `CREATE EXTENSION IF NOT EXISTS "storage";`

### **Issue 2: "relation demos does not exist"**
- **Cause:** Tables weren't created by migrations
- **Fix:** We may need to run the table creation migrations first

### **Issue 3: Functions show syntax errors**
- **Cause:** Copy/paste formatting issue
- **Fix:** Make sure you copied the entire SQL block including semicolons

---

## **💡 Pro Tips:**

1. **Run each SQL block separately** - easier to troubleshoot
2. **Check for success messages** after each execution
3. **Screenshot any errors** so I can help debug
4. **Don't worry about "No rows returned"** - that's normal for CREATE statements

---

## **✅ Success Checklist:**

After completing all steps:
- [x] Database functions created
- [x] Storage bucket created
- [x] Storage policies set up
- [x] App shows login form (not database error)

**Let me know how Step 2 goes - running the database functions SQL!**