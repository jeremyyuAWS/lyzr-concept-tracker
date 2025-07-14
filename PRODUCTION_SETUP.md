# 🚀 Lyzr Concept Tracker - Production Setup Guide

## ✅ **Step 1: Run SQL Migrations in Supabase (5 mins)**

### **1.1 Go to Supabase SQL Editor**
1. Open https://supabase.com/dashboard
2. Navigate to your `lyzr-demos` project
3. Go to **SQL Editor** in the left sidebar

### **1.2 Run Database Functions Migration**
Copy and paste this SQL in the SQL Editor:

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

Click **"Run"** to execute.

### **1.3 Run Storage Bucket Migration**
Copy and paste this SQL in the SQL Editor:

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

Click **"Run"** to execute.

---

## ✅ **Step 2: Test Admin Signup (5 mins)**

### **2.1 Open the deployed app**
1. Go to: https://lyzr-concept-tracker.netlify.app
2. You should see the login form

### **2.2 Create admin account**
1. Click **"Don't have an account? Create one"**
2. Enter:
   - Email: `jeremy@lyzr.ai`
   - Display Name: `Jeremy`
   - Password: `admin123456`
3. Click **"Create Account"**
4. You should be logged in with admin access

### **2.3 Verify admin access**
- Look for **crown icon** next to your name
- Check that **Add Demo** and **Admin** tabs are accessible
- Admin badge should show in user menu

---

## ✅ **Step 3: Add 2-3 Demo Entries (10 mins)**

### **3.1 Go to Add Demo tab**
1. Click the **"Add Demo"** tab
2. You should see the form (not an access denied message)

### **3.2 Add Demo #1: AI Task Manager**
```
Title: AI-Powered Task Manager
Description: A smart task management application that uses AI to prioritize tasks, suggest optimal scheduling, and provide productivity insights. Features include natural language task creation, intelligent reminders, and automated time blocking.
Tags: AI, Productivity, Task Management, NLP, Scheduling (press Enter after each)
Netlify URL: https://ai-task-manager-demo.netlify.app
Excalidraw URL: https://excalidraw.com/#json=ai-task-manager-wireframe
Supabase URL: https://supabase.com/dashboard/project/ai-task-manager
Admin URL: https://ai-task-manager-demo.netlify.app/admin
Owner: Jeremy
```
Click **"Add Demo"**

### **3.3 Add Demo #2: Analytics Dashboard**
```
Title: Real-time Analytics Dashboard
Description: A comprehensive analytics dashboard that provides real-time insights into business metrics, user behavior, and system performance. Features interactive charts, customizable widgets, and automated reporting capabilities.
Tags: Analytics, Dashboard, Real-time, Business Intelligence, Charts
Netlify URL: https://analytics-dashboard-demo.netlify.app
Excalidraw URL: https://excalidraw.com/#json=analytics-dashboard-design
Supabase URL: https://supabase.com/dashboard/project/analytics-dashboard
Admin URL: https://analytics-dashboard-demo.netlify.app/admin
Owner: Jeremy
Featured Demo: ✓ (check the box)
```
Click **"Add Demo"**

### **3.4 Add Demo #3: E-commerce Platform**
```
Title: Smart E-commerce Platform
Description: An intelligent e-commerce platform with AI-powered product recommendations, dynamic pricing, inventory management, and personalized shopping experiences. Includes advanced search, reviews, and order tracking.
Tags: E-commerce, AI, Recommendations, Shopping, Inventory
Netlify URL: https://smart-ecommerce-demo.netlify.app
Excalidraw URL: https://excalidraw.com/#json=ecommerce-platform-flow
Supabase URL: https://supabase.com/dashboard/project/smart-ecommerce
Admin URL: https://smart-ecommerce-demo.netlify.app/admin
Owner: Jeremy
```
Click **"Add Demo"**

---

## ✅ **Step 4: Test Image Upload (5 mins)**

### **4.1 Test image upload on existing demo**
1. Go to **"Catalog"** tab
2. Find one of your demos
3. Click the **3-dot menu** (⋯) → **"Edit"**
4. Scroll to the **Screenshot** section
5. Try uploading a sample image (drag & drop or click to select)
6. Verify the image appears in the preview
7. Click **"Update Demo"**

### **4.2 Verify image in catalog**
- Go back to Catalog tab
- Confirm the image appears in the demo card
- Check that the image loads properly

---

## ✅ **Step 5: Verify All Tabs Work (5 mins)**

### **5.1 Featured Tab**
- Should show your featured demo (Analytics Dashboard)
- Test filter buttons: Featured, Recent, Trending
- Verify demo cards display properly

### **5.2 Catalog Tab**
- Should show all 3 demos
- Test search functionality
- Test tag filtering
- Test grid/list view toggle
- Click "Try App" on a demo (should increment view count)

### **5.3 Add Demo Tab**
- Should show the form (not access denied)
- Form should be functional and submit properly

### **5.4 Analytics Tab**
- Should show metrics for your 3 demos
- Charts should display demo data
- View counts should be accurate

### **5.5 Admin Tab**
- Should show admin dashboard (not access denied)
- Should display system information
- Should show your user profile in user management section

---

## 🎉 **Success Criteria**

After completing all steps, you should have:
- ✅ Database functions working
- ✅ Storage bucket configured
- ✅ Admin account created and working
- ✅ 3 demo entries in the catalog
- ✅ Image upload functionality working
- ✅ All tabs accessible and functional
- ✅ Page view tracking working
- ✅ Search and filtering working

---

## 🚨 **Troubleshooting**

### **Database Connection Issues**
- Check Supabase project status
- Verify environment variables are set on Netlify
- Check browser console for errors

### **Image Upload Issues**
- Verify storage bucket was created
- Check storage policies are active
- Try smaller image files (under 5MB)

### **Admin Access Issues**
- Confirm you used jeremy@lyzr.ai or admin@lyzr.ai email
- Check user_profiles table in Supabase for role assignment
- Try logging out and back in

### **Missing Data**
- Check demos table in Supabase database
- Verify RLS policies are active
- Check browser network tab for API errors

---

**🔗 Quick Links:**
- App: https://lyzr-concept-tracker.netlify.app
- Supabase Dashboard: https://supabase.com/dashboard
- Netlify Dashboard: https://app.netlify.com