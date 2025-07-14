import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User Profile types
export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  display_name?: string;
  role: 'user' | 'admin' | 'super_admin';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
}

// Activity Log types
export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Database types
export interface DatabaseDemo {
  id: string;
  title: string;
  description: string;
  tags: string[];
  netlify_url: string;
  excalidraw_url?: string;
  supabase_url?: string;
  admin_url?: string;
  screenshot_url?: string;
  owner: string;
  page_views: number;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'published' | 'archived';
  is_featured?: boolean;
  video_url?: string;
}

// API functions
export const demoService = {
  // Get all demos
  async getDemos(): Promise<DatabaseDemo[]> {
    const { data, error } = await supabase
      .from('demos')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching demos:', error);
      throw error;
    }
    
    return data || [];
  },

  // Add a new demo
  async addDemo(demo: Omit<DatabaseDemo, 'id' | 'created_at' | 'updated_at' | 'page_views'>): Promise<DatabaseDemo> {
    console.log('Adding demo to Supabase:', demo);
    
    const { data, error } = await supabase
      .from('demos')
      .insert([{
        ...demo,
        page_views: 0,
        status: 'published'
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding demo:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('Demo added successfully:', data);

    // Log the activity
    try {
      await logActivity('create', 'demo', data.id, { title: demo.title });
    } catch (logError) {
      console.warn('Failed to log activity:', logError);
      // Don't throw here - demo was created successfully
    }
    
    return data;
  },

  // Update demo
  async updateDemo(id: string, updates: Partial<DatabaseDemo>): Promise<DatabaseDemo> {
    const { data, error } = await supabase
      .from('demos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating demo:', error);
      throw error;
    }

    // Log the activity
    await logActivity('update', 'demo', id, { updates });
    
    return data;
  },

  // Delete demo
  async deleteDemo(id: string): Promise<void> {
    const { error } = await supabase
      .from('demos')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting demo:', error);
      throw error;
    }

    // Log the activity
    await logActivity('delete', 'demo', id);
  },

  // Update demo page views
  async incrementPageViews(id: string): Promise<void> {
    const { error } = await supabase
      .rpc('increment_page_views', { demo_id: id });
    
    if (error) {
      console.error('Error incrementing page views:', error);
      throw error;
    }
  },

};

// User Profile Service
export const userService = {
  // Get current user profile
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return data;
  },

  // Get all user profiles (admin only)
  async getAllUserProfiles(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user profiles:', error);
      throw error;
    }
    
    return data || [];
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
    
    return data;
  },

  // Update user role (admin only)
  async updateUserRole(userId: string, role: UserProfile['role']): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating user role:', error);
      throw error;
    }

    // Log the activity
    await logActivity('update_role', 'user', userId, { role });
  },

  // Get activity logs
  async getActivityLogs(limit: number = 50): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }
    
    return data || [];
  }
};

// Auth functions
export const authService = {
  // Sign in with email/password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Error signing in:', error);
      throw error;
    }

    // Update last login
    if (data.user) {
      await supabase
        .from('user_profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', data.user.id);
    }
    
    return data;
  },

  // Sign up with email/password
  async signUp(email: string, password: string, displayName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0]
        }
      }
    });
    
    if (error) {
      console.error('Error signing up:', error);
      throw error;
    }
    
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        // Handle auth session missing as a normal unauthenticated state
        if (error.message === 'Auth session missing!') {
          return null;
        }
        console.error('Error getting user:', error);
        throw error;
      }
      
      return user;
    } catch (error: any) {
      // Handle auth session missing as a normal unauthenticated state
      if (error.message === 'Auth session missing!') {
        return null;
      }
      console.error('Error getting user:', error);
      throw error;
    }
  },

  // Check if user is admin
  async isAdmin(): Promise<boolean> {
    const profile = await userService.getCurrentUserProfile();
    return profile?.role === 'admin' || profile?.role === 'super_admin';
  },

  // Check if user has specific role
  async hasRole(role: UserProfile['role']): Promise<boolean> {
    const profile = await userService.getCurrentUserProfile();
    return profile?.role === role;
  },

  // Get auth state changes
  onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });
  }
};

// Activity logging helper
export const logActivity = async (
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: any
) => {
  try {
    await supabase.rpc('log_user_activity', {
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_details: details
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Database functions
export const createDatabaseFunctions = async () => {
  // Create increment page views function
  await supabase.rpc('create_increment_function', {
    sql: `
      CREATE OR REPLACE FUNCTION increment_page_views(demo_id uuid)
      RETURNS void AS $$
      BEGIN
        UPDATE demos SET page_views = page_views + 1 WHERE id = demo_id;
      END;
      $$ LANGUAGE plpgsql;
    `
  });
};

// Storage helpers
export const storageService = {
  // Get public URL for file
  getPublicUrl(bucket: string, path: string) {
    return supabase.storage.from(bucket).getPublicUrl(path);
  },

  // Upload file
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    return data;
  },

  // Delete file
  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) throw error;
  }
};