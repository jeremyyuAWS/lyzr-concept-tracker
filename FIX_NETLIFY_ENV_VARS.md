## 🔑 Update Netlify Environment Variables

### **Step 1: Go to Netlify Environment Variables**
1. **Open:** https://app.netlify.com
2. **Find your site:** `lyzr-concept-tracker`
3. **Click:** Site settings → Environment variables

### **Step 2: Delete Old Variables (if any)**
1. **Delete any existing** `VITE_SUPABASE_URL` 
2. **Delete any existing** `VITE_SUPABASE_ANON_KEY`

### **Step 3: Add New Variables with EXACT Values**

**Variable 1:**
- **Key:** `VITE_SUPABASE_URL`
- **Value:** `https://hypapdrapycaqwaszuoy.supabase.co`
- **Click:** Create variable

**Variable 2:**
- **Key:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5cGFwZHJhcHljYXF3YXN6dW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTI2MzYsImV4cCI6MjA2ODA4ODYzNn0.OSCt6qWqOG6cWQq4nuWgsmyk3-vle-WBvMCaPCMS9t0`
- **Click:** Create variable

### **Step 4: Force Fresh Deployment**
1. **Click:** Deploys tab
2. **Click:** Trigger deploy → **"Clear cache and deploy site"**
3. **Wait for green checkmark** ✅ (2-3 minutes)

### **Step 5: Test Your App**
1. **Go to:** https://lyzr-concept-tracker.netlify.app
2. **Expected:** Login form appears (no database errors)
3. **If still error:** Check browser console (F12) for new error messages

---

## **🎯 This Should Fix It:**

Your values look correct and match the project ID from the error messages. The issue is likely that Netlify isn't using your new Supabase project credentials.

**After the deployment completes, the app should work perfectly!**