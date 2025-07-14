# 🔑 Get Correct Supabase Keys

## **Step 1: Find the Correct Anon JWT Key**

### **1.1 Go to Supabase API Settings:**
1. **Open:** https://supabase.com/dashboard
2. **Click your project** (the one you're using)
3. **Click:** Settings → API (in left sidebar)

### **1.2 Find Project API Keys Section:**
Look for the **"Project API keys"** section (not "Project URL" section)

### **1.3 Copy the ANON Key:**
- **Look for:** `anon` `public` key
- **Format:** Starts with `eyJ...` (long JWT token)
- **NOT the publishable key** (starts with `sb_publishable_`)
- **Click the copy button** next to the anon key

## **Step 2: Update Netlify Environment Variables**

### **2.1 Go to Netlify:**
1. **Open:** https://app.netlify.com
2. **Find:** lyzr-concept-tracker site
3. **Click:** Site settings → Environment variables

### **2.2 Update the Keys:**
1. **Delete existing** `VITE_SUPABASE_ANON_KEY` (if any)
2. **Add new variable:**
   - **Key:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** Your anon JWT key (starts with `eyJ...`)
   - **Click:** Create variable

### **2.3 Also Update URL (if needed):**
1. **Make sure** `VITE_SUPABASE_URL` is your project URL
2. **Format:** `https://your-project-id.supabase.co`

## **Step 3: Redeploy**

1. **Click:** Deploys tab
2. **Click:** Trigger deploy → "Clear cache and deploy site"
3. **Wait for green checkmark** ✅

## **Expected Keys Format:**

✅ **Correct anon key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...` (JWT format)
❌ **Wrong publishable key:** `sb_publishable_jGTnxSl-fM2sy2C9BFA5bQ_pWDPkycl`

## **Why This Matters:**

- **Anon JWT key:** Used for client-side authentication and API calls
- **Publishable key:** Used for server-side and advanced integrations
- **Your Vite app needs the anon JWT key** for proper database access

**The publishable key won't work for this app - you need the anon JWT key!**