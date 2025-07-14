# 🔍 Supabase Configuration Verification Checklist

## **Step 1: Verify Database Tables Exist** (2 mins)

### **1.1 Check Tables:**
1. Go to https://supabase.com/dashboard
2. Open your **lyzr-demos** project
3. Click **"Table Editor"** in left sidebar
4. Verify these tables exist:
   - ✅ `demos`
   - ✅ `user_profiles` 
   - ✅ `activity_logs`

**❌ If tables are missing:** The initial migrations didn't run. We need to create them.

---

## **Step 2: Verify Database Functions Exist** (2 mins)

### **2.1 Check Functions:**
1. In Supabase, click **"Database"** → **"Functions"**
2. Look for these functions:
   - ✅ `increment_page_views(demo_id uuid)`
   - ✅ `log_user_activity(...)`
   - ✅ `uid()`
   - ✅ `email()`

**❌ If functions are missing:** We need to run the SQL migration for functions.

---

## **Step 3: Verify Storage Bucket** (1 min)

### **3.1 Check Storage:**
1. In Supabase, click **"Storage"** in left sidebar
2. Look for bucket: ✅ **demo-screenshots**
3. Verify it's marked as **"Public"**

**❌ If bucket is missing:** We need to create the storage bucket.

---

## **Step 4: Verify RLS (Row Level Security)** (2 mins)

### **4.1 Check RLS Status:**
1. Go to **"Table Editor"**
2. Click on **demos** table
3. Click **"Authentication"** → **"RLS"**
4. Verify: ✅ **"Enable RLS"** is turned ON

Repeat for `user_profiles` and `activity_logs` tables.

**❌ If RLS is off:** We need to enable it and add policies.

---

## **Step 5: Test Database Connection** (1 min)

### **5.1 Run Test Query:**
1. Go to **"SQL Editor"**
2. Run this simple test:
```sql
-- Test basic connection
SELECT COUNT(*) FROM demos;
SELECT COUNT(*) FROM user_profiles;
```

**✅ Success:** Shows numbers (even if 0)  
**❌ Error:** Shows permission or table errors

---

## **🚨 Most Common Missing Pieces:**

### **Issue 1: Tables Don't Exist**
- **Cause:** Initial database migrations weren't run
- **Fix:** Need to create tables first

### **Issue 2: Functions Don't Exist** 
- **Cause:** Function migrations weren't run
- **Fix:** Run the SQL function creation script

### **Issue 3: Storage Bucket Missing**
- **Cause:** Storage setup wasn't run
- **Fix:** Create bucket and policies

### **Issue 4: RLS Policies Missing**
- **Cause:** Security policies weren't set up
- **Fix:** Enable RLS and add policies

---

## **🎯 Quick Diagnosis:**

**Start by checking Step 1 (Tables)** - if tables don't exist, that's the root cause.

**Report back what you see for:**
1. ✅/❌ Tables exist?
2. ✅/❌ Functions exist? 
3. ✅/❌ Storage bucket exists?
4. ✅/❌ Test query works?

**Based on what's missing, I'll provide the exact SQL to fix it!**

---

## **💡 Pro Tip:**
If multiple things are missing, we likely need to run the **complete database setup** from scratch. I have all the SQL ready to go!