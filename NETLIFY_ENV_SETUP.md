# 🔑 Netlify Environment Variables Setup Guide

## **Step 1: Get Values from Supabase** (3 mins)

### **1.1 Open Supabase Dashboard:**
1. Go to https://supabase.com/dashboard
2. Click on your **lyzr-demos** project (or whatever you named it)
3. Wait for the project to load

### **1.2 Navigate to API Settings:**
1. In the left sidebar, click **Settings** (gear icon at bottom)
2. Click **API** from the settings menu
3. You should see the "Project API keys" section

### **1.3 Copy the Required Values:**
You need these two values:

**A. Project URL:**
- Look for "Project URL" section
- Copy the URL (looks like: `https://abcdefghijk.supabase.co`)
- **Save this** - you'll paste it as `VITE_SUPABASE_URL`

**B. API Key (anon/public):**
- Scroll down to "Project API keys" section
- Find the key labeled **"anon" "public"** 
- Click the **"Copy"** button next to it
- **Save this** - you'll paste it as `VITE_SUPABASE_ANON_KEY`

⚠️ **Important:** Do NOT copy the "service_role" key - that's private!

---

## **Step 2: Add Variables to Netlify** (3 mins)

### **2.1 Open Netlify Dashboard:**
1. Go to https://app.netlify.com
2. Sign in to your account
3. Find your **lyzr-concept-tracker** site
4. Click on the site name to open it

### **2.2 Navigate to Environment Variables:**
1. Click **"Site settings"** (in the top navigation)
2. In the left sidebar, click **"Environment variables"**
3. You should see the "Environment variables" page

### **2.3 Add First Variable (VITE_SUPABASE_URL):**
1. Click **"Add a variable"** button
2. In the popup:
   - **Key:** `VITE_SUPABASE_URL`
   - **Value:** Paste your Supabase Project URL
   - **Scopes:** Leave as "All deploy contexts" (default)
3. Click **"Create variable"**

### **2.4 Add Second Variable (VITE_SUPABASE_ANON_KEY):**
1. Click **"Add a variable"** button again
2. In the popup:
   - **Key:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** Paste your Supabase anon public key
   - **Scopes:** Leave as "All deploy contexts" (default)
3. Click **"Create variable"**

### **2.5 Verify Variables Were Added:**
You should now see both variables in the list:
- ✅ `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
- ✅ `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUz...` (long string)

---

## **Step 3: Trigger New Deployment** (2 mins)

### **3.1 Force Redeploy with New Variables:**
1. Still in your Netlify site dashboard
2. Click **"Deploys"** in the top navigation
3. Click **"Trigger deploy"** button (top right)
4. Select **"Deploy site"** from dropdown
5. Wait for deployment to complete (usually 2-3 minutes)

### **3.2 Watch Deployment Status:**
- You'll see the deploy in progress
- Wait for green checkmark ✅ "Published"
- Click the deploy to see details if needed

---

## **Step 4: Test the Fix** (1 min)

### **4.1 Open Your Site:**
1. Go to https://lyzr-concept-tracker.netlify.app
2. **It should now show the login form** instead of the error
3. If you still see "Database Setup Required", wait 1-2 minutes and refresh

### **4.2 Success Indicators:**
✅ **Working:** Login form appears  
✅ **Working:** No "Database Setup Required" error  
❌ **Still broken:** Red error message appears  

---

## **🚨 Troubleshooting Common Issues:**

### **Issue 1: "Auth session missing" error**
- **Cause:** Wrong anon key or URL
- **Fix:** Double-check you copied the "anon public" key, not "service_role"

### **Issue 2: Variables not taking effect**
- **Cause:** Cached deployment
- **Fix:** Try "Clear cache and deploy site" instead of regular deploy

### **Issue 3: Still showing setup error**
- **Cause:** SQL migrations might not have run properly
- **Fix:** Go back to Supabase SQL Editor and re-run the migration scripts

### **Issue 4: Can't find environment variables page**
- **Cause:** Different Netlify UI version
- **Fix:** Look for "Build & deploy" → "Environment" in some versions

---

## **✅ Expected Result:**

After completing these steps:
1. **Environment variables are set correctly**
2. **Site redeploys with new variables**
3. **Database connection works**
4. **Login form appears instead of error**

**Next step:** Create admin account with `jeremy@lyzr.ai`!

---

## **Quick Reference:**

**Supabase:** Dashboard → Settings → API  
**Netlify:** Site settings → Environment variables  
**Variables needed:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`