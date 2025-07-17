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
interface ActivityLog {
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
    console.log('🔍 Fetching demos from Supabase...');
    
    const { data, error } = await supabase
      .from('demos')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching demos:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    console.log('✅ Demos fetched successfully:', data?.length || 0, 'demos');
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

// Favorites Service
export const favoritesService = {
  // Get user's favorited demos
  async getUserFavorites(): Promise<string[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('user_favorites')
      .select('demo_id')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error fetching user favorites:', error);
      throw error;
    }
    
    return data?.map(f => f.demo_id) || [];
  },

  // Toggle favorite status for a demo
  async toggleFavorite(demoId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('toggle_favorite', { p_demo_id: demoId });
    
    if (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
    
    return data;
  },

  // Get favorite count for a demo
  async getDemoFavoriteCount(demoId: string): Promise<number> {
    const { count, error } = await supabase
      .from('user_favorites')
      .select('*', { count: 'exact' })
      .eq('demo_id', demoId);
    
    if (error) {
      console.error('Error getting favorite count:', error);
      throw error;
    }
    
    return count || 0;
  },

  // Get demos favorited by current user
  async getFavoritesDemos(): Promise<DatabaseDemo[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    // First get user's favorite demo IDs
    const favoriteIds = await this.getUserFavorites();
    
    if (favoriteIds.length === 0) {
      return [];
    }
    
    // Then get the actual demos
    const { data, error } = await supabase
      .from('demos')
      .select('*')
      .in('id', favoriteIds)
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching favorite demos:', error);
      throw error;
    }
    
    return data || [];
  }
};

// Session and Activity Tracking Service
export const analyticsService = {
  // Start a new user session
  async startSession(userAgent?: string, ipAddress?: string, referrer?: string): Promise<string> {
    const { data, error } = await supabase.rpc('start_user_session', {
      p_user_agent: userAgent,
      p_ip_address: ipAddress,
      p_referrer: referrer
    });
    
    if (error) {
      console.error('Error starting session:', error);
      throw error;
    }
    
    return data;
  },

  // End a user session
  async endSession(sessionId: string): Promise<void> {
    const { error } = await supabase.rpc('end_user_session', {
      p_session_id: sessionId
    });
    
    if (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  },

  // Log user activity
  async logActivity(
    sessionId: string,
    activityType: string,
    resourceType: string,
    resourceId?: string,
    activityData?: any,
    durationMs?: number
  ): Promise<void> {
    const { error } = await supabase.rpc('log_user_activity', {
      p_action: activityType,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_details: {
        session_id: sessionId,
        activity_data: activityData,
        duration_ms: durationMs
      }
    });
    
    if (error) {
      console.error('Error logging activity:', error);
      // Don't throw - activity logging should be non-blocking
    }
  },

  // Get real-time activities
  async getRealTimeActivities(limit: number = 50): Promise<any[]> {
    try {
      // Try to call the RPC function
      const { data, error } = await supabase.rpc('get_real_time_activities', {
        p_limit: limit
      });
      
      if (error) {
        // Handle all RPC function errors gracefully
        console.warn('Real-time activities function not available:', error);
        return [];
      }
      
      return data || [];
    } catch (error: any) {
      // Always return empty array for any RPC function errors
      console.warn('Real-time activities function not available:', error);
      return [];
    }
  },

  // Get user sessions
  async getUserSessions(limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .order('session_start', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching user sessions:', error);
      throw error;
    }
    
    return data || [];
  },

  // Get demo health scores
  async getDemoHealthScores(): Promise<any[]> {
    try {
      // Try to query the demo_health_scores table
      const { data, error } = await supabase
        .from('demo_health_scores')
        .select(`
          *,
          demos (
            id,
            title,
            owner,
            page_views,
            is_featured,
            created_at
          )
        `)
        .order('health_score', { ascending: false });
      
      if (error) {
        // Handle all database schema errors gracefully
        console.warn('Demo health scores not available:', error);
        return [];
      }
      
      return data || [];
    } catch (error: any) {
      // Always return empty array for any database schema errors
      console.warn('Demo health scores not available:', error);
      return [];
    }
  },

  // Calculate demo health score
  async calculateDemoHealthScore(demoId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calculate_demo_health_score', {
        p_demo_id: demoId
      });
      
      if (error) {
        console.error('Error calculating demo health score:', error);
        throw error;
      }
      
      return data || 0;
    } catch (error: any) {
      console.warn('Demo health score calculation function not available:', error);
      // Return 0 if function doesn't exist
      return 0;
    }
  },

  // Update all demo health scores
  async updateAllDemoHealthScores(): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_all_demo_health_scores');
      
      if (error) {
        console.error('Error updating all demo health scores:', error);
        throw error;
      }
    } catch (error: any) {
      console.warn('Demo health score update function not available:', error);
      // Silently fail if function doesn't exist
    }
  }
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

  // Create user profile
  async createUserProfile(profileData: Omit<UserProfile, 'id' | 'created_at' | 'updated_at' | 'last_login' | 'is_active' | 'avatar_url'>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        ...profileData,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
    
    return data;
  },

  // Update user role (admin only)
  async updateUserRole(userId: string, role: UserProfile['role']): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error updating user role:', error);
      throw error;
    }

    try {
      // Log the activity
      await logActivity('update_role', 'user', userId, { role });
    } catch (logError) {
      console.warn('Failed to log activity:', logError);
    }
  },

  // Create new user (admin only)
  async createUser(userData: {
    email: string;
    password: string;
    displayName?: string;
    role: UserProfile['role'];
  }): Promise<{ data: any; error: any }> {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          display_name: userData.displayName || userData.email.split('@')[0]
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        return { data: null, error: authError };
      }

      // Create user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          email: userData.email,
          display_name: userData.displayName || userData.email.split('@')[0],
          role: userData.role,
          is_active: true
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        return { data: null, error: profileError };
      }

      // Log the activity
      await logActivity('create_user', 'user', authData.user.id, { 
        email: userData.email,
        role: userData.role 
      });

      return { data: { user: authData.user, profile: profileData }, error: null };

    } catch (error) {
      console.error('Error in createUser:', error);
      return { data: null, error };
    }
  },

  // Delete user (admin only)
  async deleteUser(userId: string): Promise<void> {
    // First delete the user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);

    if (profileError) {
      console.error('Error deleting user profile:', profileError);
      throw profileError;
    }

    // Then delete the auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      throw authError;
    }

    // Log the activity
    await logActivity('delete_user', 'user', userId);
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

  // Reset password
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
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
        // Handle various auth errors as normal unauthenticated states
        if (error.message === 'Auth session missing!' || 
            error.message?.includes('session_not_found') ||
            error.message?.includes('Session from session_id claim in JWT does not exist')) {
          return null;
        }
        console.error('Error getting user:', error);
        // Return null instead of throwing for auth errors to prevent app crashes
        return null;
      }
      
      return user;
    } catch (error: any) {
      // Handle various auth errors as normal unauthenticated states
      if (error.message === 'Auth session missing!' || 
          error.message?.includes('session_not_found') ||
          error.message?.includes('Session from session_id claim in JWT does not exist')) {
        return null;
      }
      console.error('Error getting user:', error);
      // Return null instead of throwing for auth errors to prevent app crashes
      return null;
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
const logActivity = async (
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
const createDatabaseFunctions = async () => {
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
const storageService = {
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