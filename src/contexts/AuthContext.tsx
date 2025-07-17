import { createContext, useContext, useEffect, useState } from 'react';
import { authService, userService, UserProfile } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (user) {
      try {
        console.log('🔍 Loading user profile for:', user.email);
        const profile = await userService.getCurrentUserProfile();
        if (profile) {
          console.log('✅ Profile loaded successfully:', profile.display_name);
          setUserProfile(profile);
        } else {
          // Create profile if it doesn't exist
          console.log('⚠️ No profile found, using fallback...');
          // Use fallback profile immediately to avoid RLS policy violations
          setUserProfile({
            id: user.id,
            user_id: user.id,
            email: user.email!,
            display_name: user.user_metadata?.display_name || user.email!.split('@')[0],
            role: user.email === 'jeremy@lyzr.ai' || user.email === 'admin@lyzr.ai' ? 'admin' : 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_login: null,
            is_active: true,
            avatar_url: null
          });
        }
      } catch (error) {
        console.warn('⚠️ Profile loading failed, using fallback:', error);
        // If any error occurs, use fallback profile to keep app functional
        if (user) {
          setUserProfile({
            id: user.id,
            user_id: user.id,
            email: user.email!,
            display_name: user.user_metadata?.display_name || user.email!.split('@')[0],
            role: user.email === 'jeremy@lyzr.ai' || user.email === 'admin@lyzr.ai' ? 'admin' : 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_login: null,
            is_active: true,
            avatar_url: null
          });
        }
      }
    } else {
      setUserProfile(null);
    }
  };

  useEffect(() => {
    // Get initial session
    authService.getCurrentUser().then(setUser);

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(setUser);

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    console.log('🔍 Auth state changed, user:', !!user);
    if (user) {
      refreshProfile().finally(() => {
        console.log('✅ Profile refresh complete, setting loading to false');
        setLoading(false);
      });
    } else {
      setUserProfile(null);
      setLoading(false);
    }
  }, [user]);

  // Aggressive timeout to prevent infinite loading
  useEffect(() => {
    const timeout1 = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Auth loading timeout at 2s, forcing completion');
        setLoading(false);
      }
    }, 2000); // 2 second timeout
    
    // Emergency timeout
    const timeout2 = setTimeout(() => {
      if (loading) {
        console.error('🚨 Emergency timeout at 5s, forcing app to load');
        setLoading(false);
        if (user && !userProfile) {
          // Create emergency fallback profile
          setUserProfile({
            id: user.id,
            user_id: user.id,
            email: user.email!,
            display_name: user.email!.split('@')[0],
            role: user.email === 'jeremy@lyzr.ai' || user.email === 'admin@lyzr.ai' ? 'admin' : 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_login: null,
            is_active: true,
            avatar_url: null
          });
        }
      }
    }, 5000); // 5 second emergency timeout

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [loading, user]);

  const signIn = async (email: string, password: string) => {
    const { user } = await authService.signIn(email, password);
    setUser(user);
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { user } = await authService.signUp(email, password, displayName);
    setUser(user);
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setUserProfile(null);
  };

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}