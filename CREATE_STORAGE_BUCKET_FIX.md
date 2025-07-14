# 🗂️ Create Storage Bucket in Supabase

## **Step 1: Go to Supabase SQL Editor** (1 min)

1. **Open:** https://supabase.com/dashboard
2. **Click your project**
3. **Click:** SQL Editor (left sidebar)

## **Step 2: Run Storage Setup SQL** (2 mins)

**Copy this SQL and paste it in the SQL Editor:**

```sql
-- Check if bucket exists first
SELECT id, name, public FROM storage.buckets WHERE id = 'demo-screenshots';

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('demo-screenshots', 'demo-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Verify bucket was created
SELECT id, name, public FROM storage.buckets WHERE id = 'demo-screenshots';
```

## **Step 3: Click RUN** (1 min)

1. **Click the RUN button** in the SQL Editor
2. **Should see:** `demo-screenshots | demo-screenshots | true`
3. **If you see this row, the bucket exists!**

## **Step 4: Test Your App** (1 min)

1. **Go to:** https://lyzr-concept-tracker.netlify.app
2. **Should now show:** Login form (no storage warnings)
3. **Create admin account:**
   - Email: `jeremy@lyzr.ai`
   - Password: `admin123456`
   - Display Name: `Jeremy`

## **✅ Expected Result:**

After creating the bucket, your app should work perfectly with:
- ✅ Login form appears
- ✅ Admin account creation works
- ✅ Image upload functionality ready
- ✅ All tabs accessible

**The bucket creation is the final step to make your app fully functional!**