import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`Missing Supabase environment variables:

For LOCAL DEVELOPMENT:
1. Create a .env file in your project root
2. Add these lines:
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key"
3. Get values from Supabase Dashboard > Settings > API
4. Restart your development server: npm run dev

For PRODUCTION (Netlify):
Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify environment settings.

Current values:
- VITE_SUPABASE_URL: ${supabaseUrl || 'undefined'}
- VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'set' : 'undefined'}`);
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch {
  throw new Error(`Invalid VITE_SUPABASE_URL format: ${supabaseUrl}

Expected format: https://your-project-id.supabase.co
Received: ${supabaseUrl}

Please check your environment variables and ensure the URL is correct.`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Database types
export interface DatabaseDemo {
  id: string;
  title: string;
  description: string;
  tags: string[];
  netlify_url: string;
  excalidraw_url?: string;
  notion_url?: string;
  drive_url?: string;
  screenshot_url?: string;
  owner: string;
  page_views: number;
  created_at: string;
  updated_at: string;
  status: string;
  is_featured?: boolean;
  video_url?: string;
}

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

// Auth Service
export const authService = {
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  signUp: async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  onAuthStateChange: (callback: (user: any) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  },
};

// Demo Service
export const demoService = {
  getAllDemos: async (): Promise<DatabaseDemo[]> => {
    const { data, error } = await supabase
      .from('demos')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  addDemo: async (demoData: Omit<DatabaseDemo, 'id' | 'created_at' | 'updated_at' | 'page_views'>) => {
    const { data, error } = await supabase
      .from('demos')
      .insert([demoData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateDemo: async (id: string, updates: Partial<DatabaseDemo>) => {
    const { data, error } = await supabase
      .from('demos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteDemo: async (id: string) => {
    const { error } = await supabase
      .from('demos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  incrementPageViews: async (id: string) => {
    const { error } = await supabase.rpc('increment_page_views', {
      demo_id: id,
    });

    if (error) throw error;
  },
};

// User Service
export const userService = {
  getCurrentUserProfile: async (): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (error) {
        // Handle PGRST116 error specifically (no rows returned)
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error: any) {
      // Handle PGRST116 error specifically (no rows returned)
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
  },

  createUserProfile: async (profileData: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([profileData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getAllUserProfiles: async (): Promise<UserProfile[]> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  updateUserRole: async (userId: string, role: UserProfile['role']) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role })
      .eq('user_id', userId);

    if (error) throw error;
  },

  deleteUser: async (userId: string) => {
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  },

  createUser: async (userData: {
    email: string;
    password: string;
    displayName?: string;
    role: UserProfile['role'];
  }) => {
    // First create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      user_metadata: {
        display_name: userData.displayName,
      },
    });

    if (authError) throw authError;

    // Then create the profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert([{
        user_id: authData.user.id,
        email: userData.email,
        display_name: userData.displayName || userData.email.split('@')[0],
        role: userData.role,
      }])
      .select()
      .single();

    if (profileError) throw profileError;

    return { data: authData, error: null };
  },

  getActivityLogs: async (limit: number = 50) => {
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        *,
        user_profiles!inner(display_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  getUserLoginStats: async () => {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get all user profiles with login data
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('last_login, created_at, is_active')
        .eq('is_active', true);

      if (error) throw error;

      // Calculate stats from real data
      const dailyActiveUsers = (profiles || []).filter(p => 
        p.last_login && new Date(p.last_login) > oneDayAgo
      ).length;

      const weeklyActiveUsers = (profiles || []).filter(p => 
        p.last_login && new Date(p.last_login) > oneWeekAgo
      ).length;

      const monthlyActiveUsers = (profiles || []).filter(p => 
        p.last_login && new Date(p.last_login) > oneMonthAgo
      ).length;

      const newUsersThisWeek = (profiles || []).filter(p => 
        new Date(p.created_at) > oneWeekAgo
      ).length;

      return {
        dailyActiveUsers,
        weeklyActiveUsers,
        monthlyActiveUsers,
        newUsersThisWeek,
        totalActiveUsers: (profiles || []).length
      };
    } catch (error) {
      console.error('Error getting user login stats:', error);
      // Return fallback values
      return {
        dailyActiveUsers: 0,
        weeklyActiveUsers: 0,
        monthlyActiveUsers: 0,
        newUsersThisWeek: 0,
        totalActiveUsers: 0
      };
    }
  },

  getDemoEngagementStats: async () => {
    try {
      // Get top demos by views
      const { data: topDemos, error: topError } = await supabase
        .from('demos')
        .select('*')
        .eq('status', 'published')
        .order('page_views', { ascending: false })
        .limit(10);

      if (topError) throw topError;

      // Get most favorited demos with proper counting
      const { data: favoriteCounts, error: favError } = await supabase
        .from('user_favorites')
        .select(`
          demo_id,
          demos!inner(title, owner, page_views)
        `);

      if (favError) throw favError;

      // Count favorites per demo
      const favoriteMap = (favoriteCounts || []).reduce((acc, fav) => {
        const demoId = fav.demo_id;
        if (!acc[demoId]) {
          acc[demoId] = {
            demo_id: demoId,
            title: fav.demos.title,
            owner: fav.demos.owner,
            page_views: fav.demos.page_views,
            favorite_count: 0
          };
        }
        acc[demoId].favorite_count += 1;
        return acc;
      }, {} as Record<string, any>);

      const topFavorited = Object.values(favoriteMap)
        .sort((a: any, b: any) => b.favorite_count - a.favorite_count)
        .slice(0, 10);

      return {
        topDemos: topDemos || [],
        topFavoritedDemos: topFavorited
      };
    } catch (error) {
      console.error('Error getting demo engagement stats:', error);
      return {
        topDemos: [],
        topFavoritedDemos: []
      };
    }
  },

  getSessionStats: async () => {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get session data
      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('session_start, session_end, duration_ms')
        .order('session_start', { ascending: false });

      if (error) throw error;

      const todaySessions = (sessions || []).filter(s => {
        const sessionDate = new Date(s.session_start);
        return sessionDate >= oneDayAgo && sessionDate <= now;
      }).length;

      const weekSessions = (sessions || []).filter(s => {
        const sessionDate = new Date(s.session_start);
        return sessionDate >= oneWeekAgo && sessionDate <= now;
      }).length;

      const monthSessions = (sessions || []).filter(s => {
        const sessionDate = new Date(s.session_start);
        return sessionDate >= oneMonthAgo && sessionDate <= now;
      ).length;

      // Calculate average session duration (in minutes)
      const completedSessions = (sessions || []).filter(s => s.duration_ms && s.duration_ms > 0);
      const avgDuration = completedSessions.length > 0 
        ? Math.round(completedSessions.reduce((sum, s) => sum + (s.duration_ms || 0), 0) / completedSessions.length / 60000)
        : 0;

      return {
        todaySessions,
        weekSessions,
        monthSessions,
        averageSessionDuration: avgDuration
      };
    } catch (error) {
      console.error('Error getting session stats:', error);
      return {
        todaySessions: 0,
        weekSessions: 0,
        monthSessions: 0,
        averageSessionDuration: 0
      };
    }
  },

  getRealDemoEngagementMetrics: async () => {
    try {
      // Get real demo view data
      const { data: demos, error: demoError } = await supabase
        .from('demos')
        .select('page_views')
        .eq('status', 'published');

      if (demoError) throw demoError;

      // Get real favorites count
      const { data: favorites, error: favError } = await supabase
        .from('user_favorites')
        .select('id');

      if (favError) throw favError;

      // Get activity log data for try-app clicks and searches
      const { data: activities, error: actError } = await supabase
        .from('activity_logs')
        .select('action')
        .in('action', ['try_app', 'search']);

      if (actError) throw actError;

      const totalViews = (demos || []).reduce((sum, demo) => sum + (demo.page_views || 0), 0);
      const totalFavorites = (favorites || []).length;
      const totalTryApps = (activities || []).filter(a => a.action === 'try_app').length;
      const totalSearches = (activities || []).filter(a => a.action === 'search').length;
      
      const conversionRate = totalViews > 0 ? Math.round((totalTryApps / totalViews) * 100) : 0;

      return {
        totalViews,
        totalTryApps,
        totalFavorites,
        totalSearches,
        conversionRate
      };
    } catch (error) {
      console.error('Error getting real engagement metrics:', error);
      // Return estimated fallback
      return {
        totalViews: 0,
        totalTryApps: 0,
        totalFavorites: 0,
        totalSearches: 0,
        conversionRate: 0
      };
    }
  },
};

// Favorites Service
export const favoritesService = {
  getUserFavorites: async (userId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('demo_id')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map(f => f.demo_id);
  },

  getFavoritesWithFolders: async (userId: string) => {
    // For now, just get all favorites without folder organization
    // This can be expanded later with actual folder functionality
    const { data: favorites, error } = await supabase
      .from('user_favorites')
      .select(`
        demo_id,
        demos!inner(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const demos = (favorites || []).map(f => f.demos).filter(Boolean);
    
    return {
      folders: [], // No folders implemented yet
      unorganized: demos
    };
  },

  toggleFavorite: async (demoId: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('toggle_favorite', {
      p_demo_id: demoId,
    });

    if (error) throw error;
    return data;
  },
};

// Analytics Service
export const analyticsService = {
  startSession: async (userAgent?: string, ipAddress?: string, referrer?: string): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('start_user_session', {
        p_user_agent: userAgent,
        p_ip_address: ipAddress,
        p_referrer: referrer,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      // Fallback: insert directly if RPC function doesn't exist
      const { data: userData } = await supabase.auth.getUser();
      const { data, error: insertError } = await supabase
        .from('user_sessions')
        .insert([{
          user_id: userData.user?.id,
          user_agent: userAgent,
          ip_address: ipAddress || null,
          referrer: referrer,
          session_start: new Date().toISOString()
        }])
        .select('id')
        .single();
      
      if (insertError) throw insertError;
      return data.id;
    }
  },

  endSession: async (sessionId: string) => {
    try {
      const { error } = await supabase.rpc('end_user_session', {
        p_session_id: sessionId,
      });
      if (error) throw error;
    } catch (error) {
      // Fallback: update directly with proper duration calculation
      const { data: sessionData } = await supabase
        .from('user_sessions')
        .select('session_start')
        .eq('id', sessionId)
        .single();
      
      const sessionStart = sessionData ? new Date(sessionData.session_start).getTime() : Date.now();
      const duration = Date.now() - sessionStart;
      
      const { error: updateError } = await supabase
        .from('user_sessions')
        .update({
          session_end: new Date().toISOString(),
          duration_ms: duration
        })
        .eq('id', sessionId);
      
      if (updateError) throw updateError;
    }
  },

  logActivity: async (
    sessionId: string,
    activityType: string,
    resourceType: string,
    resourceId?: string,
    activityData?: any,
    durationMs?: number
  ) => {
    const { error } = await supabase.rpc('log_user_activity', {
      p_action: activityType,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_details: activityData,
    });

    if (error) throw error;
  },

  getRealTimeActivities: async (limit: number = 50) => {
    try {
      const { data, error } = await supabase.rpc('get_real_time_activities', {
        p_limit: limit,
      });

      if (error) {
        // If function doesn't exist, return empty array
        if (error.code === 'PGRST202') {
          console.log('Real-time activities function not available yet');
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      console.log('Real-time activities not available:', error);
      return [];
    }
  },

  getDemoHealthScores: async () => {
    try {
      const { data, error } = await supabase
        .from('demo_health_scores')
        .select(`
          *,
          demos!inner(*)
        `)
        .order('health_score', { ascending: false });

      if (error) {
        // If table/relationship doesn't exist, return empty array
        if (error.code === 'PGRST200' || error.code === 'PGRST106') {
          console.log('Demo health scores table not available yet');
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      console.log('Demo health scores not available:', error);
      return [];
    }
  },

  updateAllDemoHealthScores: async () => {
    try {
      const { error } = await supabase.rpc('update_all_demo_health_scores');
      if (error) {
        // If function doesn't exist, just log and continue
        if (error.code === 'PGRST202') {
          console.log('Health score update function not available yet');
          return;
        }
        throw error;
      }
    } catch (error) {
      console.log('Health score updates not available:', error);
    }
  },

  getDemoEngagementMetrics: async () => {
    try {
      // Calculate engagement metrics based on available data
      const { data: demos, error: demoError } = await supabase
        .from('demos')
        .select('id, page_views');

      if (demoError) throw demoError;

      const { data: favorites, error: favError } = await supabase
        .from('user_favorites')
        .select('demo_id');

      if (favError) throw favError;

      const totalViews = (demos || []).reduce((sum, demo) => sum + demo.page_views, 0);
      const totalFavorites = (favorites || []).length;
      
      // Calculate estimated try-app clicks (15% of views is typical)
      const estimatedTryApps = Math.round(totalViews * 0.15);
      const conversionRate = totalViews > 0 ? Math.round((estimatedTryApps / totalViews) * 100) : 0;

      return {
        totalViews,
        totalTryApps: estimatedTryApps,
        totalFavorites,
        totalSearches: 0, // Would need activity logs tracking
        conversionRate
      };
    } catch (error) {
      console.log('Engagement metrics calculation failed:', error);
      // Return safe defaults
      return {
        totalViews: 0,
        totalTryApps: 0,
        totalFavorites: 0,
        totalSearches: 0,
        conversionRate: 0
      };
    }
  },
};