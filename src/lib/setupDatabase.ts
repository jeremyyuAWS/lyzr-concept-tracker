import { supabase } from './supabase';

export async function setupDatabase() {
  console.log('Setting up database functions and storage...');
  
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('demos')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Database connection failed:', error);
      return false;
    }
    
    console.log('Database connected successfully');
    
    // Test storage bucket
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('Storage access failed:', bucketError);
      return false;
    }
    
    const screenshotBucket = buckets?.find(bucket => bucket.id === 'demo-screenshots');
    if (!screenshotBucket) {
      console.warn('demo-screenshots bucket not found - image uploads may fail');
    } else {
      console.log('Storage bucket configured successfully');
    }
    
    // Test functions by calling a simple one
    const { error: functionError } = await supabase.rpc('uid');
    if (functionError) {
      console.error('Database functions not available:', functionError);
      return false;
    }
    
    console.log('Database functions available');
    return true;
    
  } catch (error) {
    console.error('Database setup check failed:', error);
    return false;
  }
}

export async function createTestAdminUser(email: string, password: string = 'admin123456') {
  try {
    console.log(`Creating test admin user: ${email}`);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: email === 'jeremy@lyzr.ai' ? 'Jeremy' : 'Admin'
        }
      }
    });
    
    if (error) {
      console.error('Failed to create admin user:', error);
      return false;
    }
    
    console.log('Admin user created successfully');
    return true;
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    return false;
  }
}