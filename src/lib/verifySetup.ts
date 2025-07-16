// Production setup verification utilities
import { supabase } from './supabase';

export async function verifyDatabaseSetup() {
  console.log('🔍 Verifying database setup...');
  
  try {
    // First check if supabase client is properly initialized
    if (!supabase) {
      console.error('❌ Supabase client not initialized');
      return { success: false, error: 'Supabase client not initialized' };
    }

    // Check environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing environment variables');
      return { success: false, error: 'Missing environment variables' };
    }

    console.log('✅ Environment variables present');
    console.log('🔗 Supabase URL:', supabaseUrl);

    // Check if tables exist and are accessible
    const { data: demoCount, error: demoError } = await supabase
      .from('demos')
      .select('count', { count: 'exact', head: true });
    
    if (demoError) {
      console.error('❌ Demos table not accessible:', demoError);
      return { success: false, error: 'Demos table not accessible' };
    }
    
    // Check if user_profiles table exists
    const { data: profileCount, error: profileError } = await supabase
      .from('user_profiles')
      .select('count', { count: 'exact', head: true });
    
    if (profileError) {
      console.error('❌ User profiles table not accessible:', profileError);
      return { success: false, error: 'User profiles table not accessible' };
    }
    
    // Check if functions exist
    const { error: functionError } = await supabase.rpc('uid').single();
    if (functionError) {
      console.error('❌ Database functions not available:', functionError);
      // Don't fail setup if functions are missing, just warn
      console.warn('⚠️ Database functions not available, but continuing...');
    }
    
    // Check storage bucket (optional)
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError) {
        console.warn('⚠️ Storage not accessible:', bucketError);
      } else {
        console.log('✅ Storage accessible');
      }
    } catch (storageError) {
      console.warn('⚠️ Storage check failed:', storageError);
    }

    console.log('✅ Database setup verified!');
    return { success: true };
    
  } catch (error: any) {
    console.error('❌ Database setup verification failed:', error);
    return { success: false, error: error.message };
  }
}

export async function testBasicFunctionality() {
  console.log('🧪 Testing basic functionality...');
  
  try {
    // Test demo fetching
    const { data: demos, error: fetchError } = await supabase
      .from('demos')
      .select('*')
      .limit(1);
    
    if (fetchError) {
      throw new Error('Demo fetching failed: ' + fetchError.message);
    }
    
    // Test auth state
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError && authError.message !== 'Auth session missing!') {
      throw new Error('Auth system issue: ' + authError.message);
    }
    
    console.log('✅ Basic functionality working!');
    return { success: true, user, demoCount: demos?.length || 0 };
    
  } catch (error) {
    console.error('❌ Functionality test failed:', error);
    return { success: false, error: error.message };
  }
}