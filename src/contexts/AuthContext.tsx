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
        const profile = await userService.getCurrentUserProfile();
        if (profile) {
          setUserProfile(profile);
        } else {
          // Create profile if it doesn't exist
          console.log('No profile found, creating one...');
          const defaultProfile = {
            user_id: user.id,
            email: user.email!,
            display_name: user.user_metadata?.display_name || user.email!.split('@')[0],
            role: user.email === 'jeremy@lyzr.ai' || user.email === 'admin@lyzr.ai' ? 'admin' : 'user'
          };
          
          try {
            const newProfile = await userService.createUserProfile(defaultProfile);
            setUserProfile(newProfile);
          } catch (createError) {
            console.error('Failed to create profile:', createError);
            // Fallback to mock profile
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
      } catch (error) {
        console.error('Error refreshing profile:', error);
        // Fallback to mock profile based on user data
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
    if (user) {
      refreshProfile().finally(() => setLoading(false));
    } else {
      setUserProfile(null);
      setLoading(false);
    }
  }, [user]);

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