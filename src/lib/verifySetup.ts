// Production setup verification utilities with timeout handling
import { supabase } from './supabase';

// Timeout wrapper for database calls
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

export async function verifyDatabaseSetup() {
  console.log('🔍 Starting database verification...');
  
  try {
    // Step 1: Check if supabase client exists
    if (!supabase) {
      console.error('❌ Supabase client not initialized');
      return { success: false, error: 'Supabase client not initialized' };
    }
    console.log('✅ Supabase client initialized');

    // Step 2: Check environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing environment variables');
      console.error('URL exists:', !!supabaseUrl);
      console.error('Key exists:', !!supabaseKey);
      return { success: false, error: 'Missing environment variables' };
    }
    
    console.log('✅ Environment variables present');
    console.log('🔗 Supabase URL:', supabaseUrl);
    console.log('🔑 Anon Key length:', supabaseKey.length);

    // Step 3: Test basic connectivity with timeout
    console.log('🔍 Testing database connectivity...');
    try {
      const connectivityTest = await withTimeout(
        supabase.from('demos').select('count', { count: 'exact', head: true }),
        5000
      );
      
      if (connectivityTest.error) {
        console.error('❌ Database connectivity failed:', connectivityTest.error.message);
        return { success: false, error: `Database connectivity failed: ${connectivityTest.error.message}` };
      }
      
      console.log('✅ Database connectivity successful');
    } catch (error: any) {
      console.error('❌ Database connectivity timeout or error:', error.message);
      return { success: false, error: `Database connectivity failed: ${error.message}` };
    }

    // Step 4: Check if user_profiles table exists (with timeout)
    console.log('🔍 Checking user_profiles table...');
    try {
      const profileTest = await withTimeout(
        supabase.from('user_profiles').select('count', { count: 'exact', head: true }),
        5000
      );
      
      if (profileTest.error) {
        console.error('❌ User profiles table not accessible:', profileTest.error.message);
        return { success: false, error: `User profiles table not accessible: ${profileTest.error.message}` };
      }
      
      console.log('✅ User profiles table accessible');
    } catch (error: any) {
      console.error('❌ User profiles table check timeout:', error.message);
      return { success: false, error: `User profiles table check failed: ${error.message}` };
    }

    // Step 5: Test auth functionality (with timeout)
    console.log('🔍 Testing auth functionality...');
    try {
      const authTest = await withTimeout(
        supabase.auth.getUser(),
        5000
      );
      
      if (authTest.error && authTest.error.message !== 'Auth session missing!') {
        console.error('❌ Auth system issue:', authTest.error.message);
        return { success: false, error: `Auth system issue: ${authTest.error.message}` };
      }
      
      console.log('✅ Auth system working');
    } catch (error: any) {
      console.error('❌ Auth test timeout:', error.message);
      return { success: false, error: `Auth test failed: ${error.message}` };
    }

    // Step 6: Test database functions (optional, with timeout)
    console.log('🔍 Testing database functions...');
    try {
      const functionTest = await withTimeout(
        supabase.rpc('uid'),
        3000
      );
      
      if (functionTest.error) {
        console.warn('⚠️ Database functions not available:', functionTest.error.message);
        // Don't fail setup for missing functions
      } else {
        console.log('✅ Database functions working');
      }
    } catch (error: any) {
      console.warn('⚠️ Database function test timeout:', error.message);
      // Don't fail setup for missing functions
    }

    // Step 7: Check storage (optional, with timeout)
    console.log('🔍 Checking storage...');
    try {
      const storageTest = await withTimeout(
        supabase.storage.listBuckets(),
        3000
      );
      
      if (storageTest.error) {
        console.warn('⚠️ Storage not accessible:', storageTest.error.message);
      } else {
        console.log('✅ Storage accessible');
      }
    } catch (error: any) {
      console.warn('⚠️ Storage check timeout:', error.message);
    }

    console.log('🎉 Database setup verification complete!');
    return { success: true };
    
  } catch (error: any) {
    console.error('❌ Database setup verification failed:', error);
    return { success: false, error: `Verification failed: ${error.message}` };
  }
}

export async function testBasicFunctionality() {
  console.log('🧪 Testing basic functionality...');
  
  try {
    // Test demo fetching with timeout
    const demoTest = await withTimeout(
      supabase.from('demos').select('*').limit(1),
      5000
    );
    
    if (demoTest.error) {
      throw new Error('Demo fetching failed: ' + demoTest.error.message);
    }
    
    // Test auth state with timeout
    const authTest = await withTimeout(
      supabase.auth.getUser(),
      5000
    );
    
    if (authTest.error && authTest.error.message !== 'Auth session missing!') {
      throw new Error('Auth system issue: ' + authTest.error.message);
    }
    
    console.log('✅ Basic functionality working!');
    return { 
      success: true, 
      user: authTest.data.user, 
      demoCount: demoTest.data?.length || 0 
    };
    
  } catch (error: any) {
    console.error('❌ Functionality test failed:', error);
    return { success: false, error: error.message };
  }
}

// Additional utility to test specific database operations
export async function quickConnectivityTest() {
  console.log('⚡ Quick connectivity test...');
  
  try {
    const quickTest = await withTimeout(
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      }),
      3000
    );
    
    if (quickTest.ok) {
      console.log('✅ Quick connectivity test passed');
      return { success: true };
    } else {
      console.error('❌ Quick connectivity test failed:', quickTest.status);
      return { success: false, error: `HTTP ${quickTest.status}` };
    }
    
  } catch (error: any) {
    console.error('❌ Quick connectivity test failed:', error.message);
    return { success: false, error: error.message };
  }
}