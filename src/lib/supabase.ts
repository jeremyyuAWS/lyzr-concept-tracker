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
};

export const demoService = {
  async getAllDemos(): Promise<DatabaseDemo[]> {
    const { data, error } = await supabase
      .from('demos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
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
    const { error } = await supabase
      .from('demos')
      .update({ page_views: supabase.sql`page_views + 1` })
      .eq('id', id);

    if (error) throw error;
  },
};

export const favoritesService = {
  async getUserFavorites(userId: string) {
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
  },

  async toggleFavorite(userId: string, demoId: string) {
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
  },

  async isFavorited(userId: string, demoId: string): Promise<boolean> {
    const { data } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('demo_id', demoId)
      .single();

    return !!data;
  },

  async getFavoritesWithFolders(): Promise<{ folders: any[], unorganized: DatabaseDemo[] }> {
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
  },
};

export const analyticsService = {
  async startSession(userId: string, sessionData: any) {
    const { data, error } = await supabase
      .from('user_sessions')
      .insert([{
        user_id: userId,
        session_start: new Date().toISOString(),
        user_agent: sessionData.userAgent,
        ip_address: sessionData.ipAddress,
        referrer: sessionData.referrer
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async endSession(sessionId: string) {
    const { data, error } = await supabase
      .from('user_sessions')
      .update({
        session_end: new Date().toISOString(),
        duration_ms: supabase.sql`EXTRACT(EPOCH FROM (now() - session_start)) * 1000`
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async logActivity(userId: string, action: string, resourceType: string, resourceId?: string, details?: any) {
    const { data, error } = await supabase
      .from('activity_logs')
      .insert([{
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getDemoHealthScores() {
    const { data, error } = await supabase
      .from('demos')
      .select('id, title, page_views, created_at, updated_at')
      .order('page_views', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateAllDemoHealthScores() {
    // This would typically call a stored procedure or function
    // For now, we'll just return the current demo data
    return this.getDemoHealthScores();
  },

  async getRealTimeActivities() {
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        *,
        user_profiles!inner(display_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  },
};