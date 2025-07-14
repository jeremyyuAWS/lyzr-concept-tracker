# 🔍 Troubleshoot Deployment Errors

## **Step 1: Verify Environment Variables Match** (3 mins)

### **1.1 Get Current Supabase Values:**
1. **Go to Supabase** → **Settings** → **API**
2. **Copy these EXACT values:**
   - **Project URL:** `https://your-project-id.supabase.co`
   - **Anon Key:** The "anon public" key (starts with `eyJ`)

### **1.2 Check Netlify Environment Variables:**
1. **Go to Netlify** → **Your site** → **Site settings** → **Environment variables**
2. **Verify these EXACT values:**
   - `VITE_SUPABASE_URL` = Your Project URL (no trailing slash)
   - `VITE_SUPABASE_ANON_KEY` = Your anon key

### **1.3 Common Issues:**
- ❌ **Wrong project URL** (using old project)
- ❌ **Trailing slash** in URL
- ❌ **Wrong key** (using service_role instead of anon)
- ❌ **Extra spaces** in the values

---

## **Step 2: Force Fresh Deployment** (2 mins)

### **2.1 Clear Cache and Redeploy:**
1. **In Netlify** → **Deploys** tab
2. **Click "Trigger deploy"**
3. **Select "Clear cache and deploy site"** (not just "Deploy site")
4. **Wait for green checkmark** ✅

### **2.2 Check Deploy Log:**
1. **Click on the deploy** to see details
2. **Look for any errors** in the build log
3. **Verify it says "Site is live"**

---

## **Step 3: Test Database Connection** (2 mins)

### **3.1 Test in Supabase:**
1. **Go to Supabase** → **SQL Editor**
2. **Run this test:**
```sql
-- Test that all tables exist
SELECT 'demos' as table_name, COUNT(*) as count FROM demos
UNION ALL
SELECT 'user_profiles' as table_name, COUNT(*) as count FROM user_profiles
UNION ALL
SELECT 'activity_logs' as table_name, COUNT(*) as count FROM activity_logs;

-- Test that functions exist
SELECT 'uid function works' as test, uid() as result;
```

### **3.2 Expected Results:**
- Should show 3 tables with row counts
- Should show uid() function working
- If this fails, need to re-run migration

---

## **Step 4: Check Browser Console** (2 mins)

### **4.1 Open Browser Developer Tools:**
1. **Go to:** https://lyzr-concept-tracker.netlify.app
2. **Press F12** (or right-click → Inspect)
3. **Click Console tab**
4. **Look for red error messages**

### **4.2 Common Error Messages:**
- `404 Not Found` = Database tables missing
- `Invalid API key` = Wrong anon key
- `Project not found` = Wrong project URL
- `CORS error` = Wrong domain configuration

---

## **Step 5: Verify Supabase Project is Active** (1 min)

### **5.1 Check Project Status:**
1. **In Supabase Dashboard**
2. **Look for project status** (should be "Active")
3. **Not "Paused" or "Inactive"**

### **5.2 Test API Endpoint:**
1. **Open new browser tab**
2. **Go to:** `https://your-project-id.supabase.co/rest/v1/`
3. **Should show:** `{"message":"Hi from Supabase Edge Functions!"}`
4. **If 404 error:** Project URL is wrong

---

## **🚨 Quick Fixes for Common Issues:**

### **Fix 1: Wrong Environment Variables**
1. **Delete old variables** in Netlify
2. **Add new ones** with correct values
3. **Clear cache and deploy**

### **Fix 2: Database Not Set Up**
1. **Re-run the complete SQL migration**
2. **Check for any SQL errors**
3. **Verify tables exist**

### **Fix 3: Netlify Cache Issues**
1. **Use "Clear cache and deploy site"**
2. **Wait 5 minutes** for DNS propagation
3. **Try incognito/private browsing**

---

## **📋 Checklist - Tell Me Status:**

**Environment Variables:**
- [ ] Correct Supabase URL in Netlify
- [ ] Correct anon key in Netlify
- [ ] Values match current Supabase project

**Database:**
- [ ] SQL migration ran without errors
- [ ] Test query returns table data
- [ ] Functions exist and work

**Deployment:**
- [ ] Clear cache deploy completed
- [ ] Build log shows no errors
- [ ] Site shows "live" status

**What errors do you see when you check these items?**