# 🚀 5-Minute Environment Variables Setup

## **Step 1: Get Supabase Values (2 mins)**

### **1.1 Go to Supabase:**
1. Open https://supabase.com/dashboard
2. Click your **lyzr-demos** project
3. Click **Settings** → **API**

### **1.2 Copy These Values:**
- **Project URL:** Copy the URL (looks like `https://abc123.supabase.co`)
- **API Key:** Copy the **"anon public"** key (long string starting with `eyJ`)

⚠️ **Don't copy the "service_role" key!**

---

## **Step 2: Add to Netlify (3 mins)**

### **2.1 Go to Netlify:**
1. Open https://app.netlify.com
2. Find your **lyzr-concept-tracker** site
3. Click **Site settings** → **Environment variables**

### **2.2 Add Variables:**
1. Click **"Add a variable"**
2. **Key:** `VITE_SUPABASE_URL`
3. **Value:** Paste your Supabase Project URL
4. Click **"Create variable"**

5. Click **"Add a variable"** again
6. **Key:** `VITE_SUPABASE_ANON_KEY`
7. **Value:** Paste your Supabase anon key
8. Click **"Create variable"**

### **2.3 Redeploy:**
1. Click **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait for green checkmark ✅

---

## **✅ Expected Result:**
After this, your app should show the **login form** instead of the database error.

**This should take about 5 minutes total - the environment variables are the missing piece!**