// Production setup verification utilities with aggressive timeout handling
import { supabase } from './supabase';

// Very short timeout wrapper for database calls
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 3000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

export async function verifyDatabaseSetup() {
  console.log('🔍 Starting simplified database verification...');
  
  try {
    // Step 1: Check if environment variables exist
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing environment variables');
      return { success: false, error: 'Missing environment variables' };
    }
    
    console.log('✅ Environment variables present');

    // Step 2: Quick connectivity test using fetch (more reliable than Supabase client)
    console.log('🔍 Testing basic connectivity...');
    try {
      const response = await withTimeout(
        fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        }),
        2000 // Very short timeout
      );
      
      if (!response.ok) {
        console.error('❌ API connectivity failed:', response.status);
        return { success: false, error: `API returned ${response.status}` };
      }
      
      console.log('✅ Basic connectivity successful');
    } catch (error: any) {
      console.error('❌ Connectivity test failed:', error.message);
      return { success: false, error: `Connection failed: ${error.message}` };
    }

    // Step 3: Very simple database test - just check if we can query
    console.log('🔍 Testing database access...');
    try {
      const { error } = await withTimeout(
        supabase.from('demos').select('count', { count: 'exact', head: true }),
        2000
      );
      
      if (error) {
        console.error('❌ Database access failed:', error.message);
        return { success: false, error: `Database error: ${error.message}` };
      }
      
      console.log('✅ Database accessible');
    } catch (error: any) {
      console.error('❌ Database test failed:', error.message);
      return { success: false, error: `Database test failed: ${error.message}` };
    }

    console.log('🎉 Database verification complete!');
    return { success: true };
    
  } catch (error: any) {
    console.error('❌ Database verification failed:', error);
    return { success: false, error: `Verification failed: ${error.message}` };
  }
}

// Simplified functionality test
export async function testBasicFunctionality() {
  console.log('🧪 Testing basic functionality...');
  
  try {
    // Just test auth state - don't try to fetch demos
    const { data: { user }, error } = await withTimeout(
      supabase.auth.getUser(),
      2000
    );
    
    if (error && error.message !== 'Auth session missing!') {
      throw new Error('Auth system issue: ' + error.message);
    }
    
    console.log('✅ Basic functionality working!');
    return { success: true, user };
    
  } catch (error: any) {
    console.error('❌ Functionality test failed:', error);
    return { success: false, error: error.message };
  }
}

// Emergency fallback - skip all checks and just try to connect
export async function skipDatabaseVerification() {
  console.log('⚠️ Skipping database verification - using fallback mode');
  
  // Just check if we have environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return { success: false, error: 'Missing environment variables' };
  }
  
  return { success: true };
}