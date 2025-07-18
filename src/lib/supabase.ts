import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  role: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_login: string | null;
  is_active: boolean | null;
}

export interface DatabaseDemo {
  id: string;
  title: string;
  description: string;
  tags: string[];
  netlify_url: string;
  excalidraw_url: string | null;
  supabase_url: string | null;
  admin_url: string | null;
  screenshot_url: string | null;
  owner: string;
  page_views: number;
  created_at: string;
  updated_at: string;
  status: string;
  is_featured: boolean;
  video_url: string | null;
}

export const authService = {
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string, displayName?: string) {
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

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null);
    });
  },
};

export const userService = {
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  async createUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([profile])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAllUserProfiles(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getActivityLogs(limit: number = 100) {
    try {
      const { data, error } = await supabase.rpc('get_real_time_activities', { p_limit: limit });
      if (error) throw error;
      
      // Map the data to match the expected structure
      return (data || []).map((activity: any) => ({
        ...activity,
        user_profiles: {
          display_name: activity.display_name,
          email: activity.email
        }
      }));
    } catch (error) {
      console.warn('Real-time activities function not available:', error);
      return [];
    }
  },

  async getUserLoginStats() {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get daily active users
      const { data: dailyActive, error: dailyError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .gte('last_login', today.toISOString());

      if (dailyError) throw dailyError;

      // Get weekly active users
      const { data: weeklyActive, error: weeklyError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .gte('last_login', sevenDaysAgo.toISOString());

      if (weeklyError) throw weeklyError;

      // Get monthly active users
      const { data: monthlyActive, error: monthlyError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .gte('last_login', thirtyDaysAgo.toISOString());

      if (monthlyError) throw monthlyError;

      // Get new users this week
      const { data: newUsers, error: newUsersError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .gte('created_at', sevenDaysAgo.toISOString());

      if (newUsersError) throw newUsersError;

      return {
        dailyActiveUsers: dailyActive?.length || 0,
        weeklyActiveUsers: weeklyActive?.length || 0,
        monthlyActiveUsers: monthlyActive?.length || 0,
        newUsersThisWeek: newUsers?.length || 0
      };
    } catch (error) {
      console.warn('User login stats not available:', error);
      return {
        dailyActiveUsers: 0,
        weeklyActiveUsers: 0,
        monthlyActiveUsers: 0,
        newUsersThisWeek: 0
      };
    }
  },

  async getDemoEngagementStats() {
    try {
      // Get most viewed demos
      const { data: topDemos, error: topDemosError } = await supabase
        .from('demos')
        .select('id, title, page_views, owner')
        .order('page_views', { ascending: false })
        .limit(10);

      if (topDemosError) throw topDemosError;

      // Get most favorited demos
      const { data: topFavorited, error: favoritedError } = await supabase
        .from('user_favorites')
        .select(`
          demo_id,
          demos!inner(title, owner),
          count:demo_id
        `)
        .limit(10);

      if (favoritedError) throw favoritedError;

      // Group favorites by demo
      const favoriteCounts = topFavorited?.reduce((acc: any, fav: any) => {
        const demoId = fav.demo_id;
        if (!acc[demoId]) {
          acc[demoId] = {
            demo_id: demoId,
            title: fav.demos.title,
            owner: fav.demos.owner,
            favorite_count: 0
          };
        }
        acc[demoId].favorite_count += 1;
        return acc;
      }, {});

      const topFavoritedDemos = Object.values(favoriteCounts || {})
        .sort((a: any, b: any) => b.favorite_count - a.favorite_count)
        .slice(0, 5);

      // Get recent activity counts
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const { data: recentActivity, error: activityError } = await supabase
        .from('activity_logs')
        .select('action')
        .gte('created_at', sevenDaysAgo.toISOString());

      if (activityError) throw activityError;

      // Count activity types
      const activityCounts = recentActivity?.reduce((acc: any, log: any) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {});

      return {
        topDemos: topDemos || [],
        topFavoritedDemos: topFavoritedDemos || [],
        recentActivityCounts: activityCounts || {},
        totalRecentActivities: recentActivity?.length || 0
      };
    } catch (error) {
      console.warn('Demo engagement stats not available:', error);
      return {
        topDemos: [],
        topFavoritedDemos: [],
        recentActivityCounts: {},
        totalRecentActivities: 0
      };
    }
  },

  async createUser(userData: {
    email: string;
    password: string;
    displayName: string;
    role: string;
  }) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      user_metadata: {
        display_name: userData.displayName
      },
      email_confirm: true
    });

    if (error) throw error;

    // Create user profile
    if (data.user) {
      await this.createUserProfile({
        user_id: data.user.id,
        email: userData.email,
        display_name: userData.displayName,
        role: userData.role
      });
    }

    return { data, error: null };
  },

  async updateUserRole(userId: string, newRole: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteUser(userId: string) {
    // Delete user profile first
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);

    if (profileError) throw profileError;

    // Delete auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) throw authError;
  }
};

export const demoService = {
  async getAllDemos(): Promise<DatabaseDemo[]> {
    try {
      const { data, error } = await supabase
        .from('demos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching demos:', error);
      return [];
    }
  },

  async addDemo(demo: Partial<DatabaseDemo>): Promise<DatabaseDemo> {
    const { data, error } = await supabase
      .from('demos')
      .insert([demo])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createDemo(demo: Partial<DatabaseDemo>): Promise<DatabaseDemo> {
    const { data, error } = await supabase
      .from('demos')
      .insert([demo])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateDemo(id: string, updates: Partial<DatabaseDemo>): Promise<DatabaseDemo> {
    const { data, error } = await supabase
      .from('demos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteDemo(id: string): Promise<void> {
    const { error } = await supabase
      .from('demos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async incrementPageViews(id: string): Promise<void> {
    try {
      // Try using the RPC function first
      const { error: rpcError } = await supabase.rpc('increment_page_views', { demo_id: id });
      
      if (rpcError) {
        // Fallback to direct update if RPC function doesn't exist
        const { error } = await supabase
          .from('demos')
          .update({ page_views: supabase.sql`page_views + 1` })
          .eq('id', id);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error incrementing page views:', error);
      throw error;
    }
  },
};

export const favoritesService = {
  async getUserFavorites(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          *,
          demos (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      return [];
    }
  },

  async toggleFavorite(userId: string, demoId: string) {
    try {
      // Check if favorite exists
      const { data: existing } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('demo_id', demoId)
        .single();

      if (existing) {
        // Remove favorite
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('demo_id', demoId);

        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Add favorite
        const { error } = await supabase
          .from('user_favorites')
          .insert([{ user_id: userId, demo_id: demoId }]);

        if (error) throw error;
        return { action: 'added' };
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return { action: 'error' };
    }
  },

  async toggleFavorite(demoId: string): Promise<boolean> {
    try {
      // Try using the RPC function first
      const { data, error } = await supabase.rpc('toggle_favorite', { p_demo_id: demoId });
      
      if (error) {
        // Fallback to manual toggle if RPC function doesn't exist
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        const result = await this.toggleFavorite(user.id, demoId);
        return result.action === 'added';
      }
      
      return data; // Boolean result from RPC function
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  },

  async isFavorited(userId: string, demoId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('demo_id', demoId)
        .single();

      return !!data;
    } catch (error) {
      console.error('Error checking if favorited:', error);
      return false;
    }
  },

  async getFavoritesWithFolders(): Promise<{ folders: any[], unorganized: DatabaseDemo[] }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { folders: [], unorganized: [] };

      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          *,
          demos (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Since we don't have folder support yet, return all demos as unorganized
      const unorganized = data?.map(fav => fav.demos).filter(Boolean) || [];
      
      return {
        folders: [],
        unorganized: unorganized
      };
    } catch (error) {
      console.error('Error fetching favorites with folders:', error);
      return { folders: [], unorganized: [] };
    }
  },
};

export const analyticsService = {
  async startSession(userAgent?: string, ipAddress?: string, referrer?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      try {
        // Try using the RPC function first
        const { data, error } = await supabase.rpc('start_user_session', {
          p_user_agent: userAgent,
          p_ip_address: ipAddress,
          p_referrer: referrer
        });
        
        if (error) throw error;
        return data;
      } catch (rpcError) {
        // Fallback to direct insert if RPC function doesn't exist
        const { data, error } = await supabase
          .from('user_sessions')
          .insert([{
            user_id: user.id,
            session_start: new Date().toISOString(),
            user_agent: userAgent,
            ip_address: ipAddress,
            referrer: referrer
          }])
          .select()
          .single();

        if (error) throw error;
        return data.id;
      }
    } catch (error) {
      console.error('Error starting session:', error);
      return null;
    }
  },

  async endSession(sessionId: string) {
    try {
      try {
        // Try using the RPC function first
        const { error } = await supabase.rpc('end_user_session', { p_session_id: sessionId });
        if (error) throw error;
      } catch (rpcError) {
        // Fallback to direct update if RPC function doesn't exist
        const { error } = await supabase
          .from('user_sessions')
          .update({
            session_end: new Date().toISOString(),
            duration_ms: supabase.sql`EXTRACT(EPOCH FROM (NOW() - session_start)) * 1000`
          })
          .eq('id', sessionId);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error ending session:', error);
    }
  },

  async logActivity(
    sessionId: string,
    activityType: string,
    resourceType: string,
    resourceId?: string,
    activityData?: any,
    durationMs?: number
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        // Try using the RPC function first
        const { error } = await supabase.rpc('log_user_activity', {
          p_action: activityType,
          p_resource_type: resourceType,
          p_resource_id: resourceId,
          p_details: activityData
        });
        
        if (error) throw error;
      } catch (rpcError) {
        // Fallback to direct insert if RPC function doesn't exist
        const { data, error } = await supabase
          .from('activity_logs')
          .insert([{
            user_id: user.id,
            action: activityType,
            resource_type: resourceType,
            resource_id: resourceId,
            details: activityData,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  },

  async getDemoHealthScores() {
    try {
      const { data, error } = await supabase
        .from('demo_health_scores')
        .select(`
          *,
          demos!inner(id, title, owner, page_views, is_featured, created_at)
        `)
        .order('health_score', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Demo health scores table not available:', error);
      return [];
    }
  },

  async updateAllDemoHealthScores() {
    try {
      const { error } = await supabase.rpc('update_all_demo_health_scores');
      if (error) throw error;
    } catch (error) {
      console.warn('Health score update function not available:', error);
    }
  },

  async getRealTimeActivities(limit: number = 50) {
    try {
      const { data, error } = await supabase.rpc('get_real_time_activities', { p_limit: limit });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Real-time activities function not available:', error);
      return [];
    }
  },

  async getUserSessionMetrics() {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get session counts by time period
      const [todaySessions, weekSessions, monthSessions] = await Promise.all([
        supabase
          .from('user_sessions')
          .select('id')
          .gte('session_start', today.toISOString()),
        supabase
          .from('user_sessions')
          .select('id')
          .gte('session_start', sevenDaysAgo.toISOString()),
        supabase
          .from('user_sessions')
          .select('id')
          .gte('session_start', thirtyDaysAgo.toISOString())
      ]);

      // Get average session duration
      const { data: avgDuration } = await supabase
        .from('user_sessions')
        .select('duration_ms')
        .not('duration_ms', 'is', null)
        .gte('session_start', sevenDaysAgo.toISOString());

      const averageSessionDuration = avgDuration?.length
        ? avgDuration.reduce((sum, session) => sum + (session.duration_ms || 0), 0) / avgDuration.length
        : 0;

      return {
        todaySessions: todaySessions.data?.length || 0,
        weekSessions: weekSessions.data?.length || 0,
        monthSessions: monthSessions.data?.length || 0,
        averageSessionDuration: Math.round(averageSessionDuration / 1000 / 60) // Convert to minutes
      };
    } catch (error) {
      console.warn('Session metrics not available:', error);
      return {
        todaySessions: 0,
        weekSessions: 0,
        monthSessions: 0,
        averageSessionDuration: 0
      };
    }
  },

  async getDemoEngagementMetrics() {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Get demo view activities
      const { data: viewActivities } = await supabase
        .from('activity_logs')
        .select('resource_id, created_at')
        .eq('action', 'view_demo')
        .gte('created_at', sevenDaysAgo.toISOString());

      // Get try app activities
      const { data: tryAppActivities } = await supabase
        .from('activity_logs')
        .select('resource_id, created_at')
        .eq('action', 'try_app')
        .gte('created_at', sevenDaysAgo.toISOString());

      // Get favorite activities
      const { data: favoriteActivities } = await supabase
        .from('activity_logs')
        .select('resource_id, created_at, details')
        .eq('action', 'favorite_demo')
        .gte('created_at', sevenDaysAgo.toISOString());

      // Get search activities
      const { data: searchActivities } = await supabase
        .from('activity_logs')
        .select('details, created_at')
        .eq('action', 'search')
        .gte('created_at', sevenDaysAgo.toISOString());

      // Calculate engagement metrics
      const totalViews = viewActivities?.length || 0;
      const totalTryApps = tryAppActivities?.length || 0;
      const totalFavorites = favoriteActivities?.filter(f => f.details?.action === 'add').length || 0;
      const totalSearches = searchActivities?.length || 0;

      // Calculate conversion rate (try app / views)
      const conversionRate = totalViews > 0 ? ((totalTryApps / totalViews) * 100) : 0;

      return {
        totalViews,
        totalTryApps,
        totalFavorites,
        totalSearches,
        conversionRate: Math.round(conversionRate * 100) / 100
      };
    } catch (error) {
      console.warn('Demo engagement metrics not available:', error);
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