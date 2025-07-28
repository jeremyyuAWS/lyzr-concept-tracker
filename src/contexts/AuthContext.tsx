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

  const addDebugInfo = (message: string) => {
    console.log('🔍 AUTH DEBUG:', message);
  };

  const refreshProfile = async () => {
    addDebugInfo('Starting profile refresh');
    if (user) {
      try {
        addDebugInfo(`Loading user profile for: ${user.email}`);
        const profile = await userService.getCurrentUserProfile(user.id);
        if (profile) {
          addDebugInfo(`Profile loaded successfully: ${profile.display_name}`);
          setUserProfile(profile);
        } else {
          // Profile doesn't exist - this shouldn't happen with the trigger, but handle it
          addDebugInfo('No profile found - this indicates the trigger may not be working');
          try {
            addDebugInfo('Attempting to create missing profile');
            const newProfile = await userService.createUserProfile({
              user_id: user.id,
              email: user.email!,
              display_name: user.user_metadata?.display_name || user.email!.split('@')[0],
              role: user.email === 'jeremy@lyzr.ai' || user.email === 'admin@lyzr.ai' ? 'admin' : 'user'
            });
            addDebugInfo('Missing profile created successfully');
            setUserProfile(newProfile);
          } catch (createError) {
            addDebugInfo(`Missing profile creation failed: ${createError}`);
            // Use fallback profile if creation fails
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
        // Add connection test before fetching profile
      } catch (error) {
        addDebugInfo(`Profile loading completely failed: ${error}`);
        addDebugInfo(`Profile loading failed, using fallback: ${error}`);
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
      addDebugInfo('No user, clearing profile');
      setUserProfile(null);
    }
  };

  useEffect(() => {
    addDebugInfo('Setting up auth listener');
    // Get initial session
    authService.getCurrentUser().then(async user => {
      addDebugInfo(`Initial user loaded: ${user ? user.email : 'null'}`);
      
      if (user) {
        // Verify user has profile before setting them as authenticated
        try {
          const profile = await userService.getCurrentUserProfile(user.id);
          if (!profile || !profile.is_active) {
            addDebugInfo(`User ${user.email} has no active profile, signing out`);
            await authService.signOut();
            setUser(null);
            return;
          }
          addDebugInfo(`User ${user.email} has valid profile, role: ${profile.role}`);
          setUser(user);
        } catch (error) {
          addDebugInfo(`Profile check failed for ${user.email}: ${error}`);
          
          // Handle specific error types
          if (error instanceof Error && error.message.includes('Failed to fetch')) {
            addDebugInfo('Database connection failed, keeping user but clearing profile');
            setUser(user); // Keep user authenticated but profile will be null
          } else {
            addDebugInfo('Profile verification failed, signing out');
            await authService.signOut();
            setUser(null);
          }
        }
      } else {
        setUser(user);
      }
    }).catch(error => {
      addDebugInfo(`Initial user load failed: ${error}`);
      // Don't crash the app, just log the error
      console.error('Failed to load initial user:', error);
      setUser(null);
    });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async user => {
      addDebugInfo(`Auth state changed: ${user ? user.email : 'null'}`);
      
      if (user) {
        // Verify user has profile before setting them as authenticated
        try {
          const profile = await userService.getCurrentUserProfile(user.id);
          if (!profile || !profile.is_active) {
            addDebugInfo(`User ${user.email} has no active profile, blocking access`);
            await authService.signOut();
            setUser(null);
            return;
          }
          addDebugInfo(`User ${user.email} has valid profile, allowing access`);
          setUser(user);
        } catch (error) {
          addDebugInfo(`Profile verification failed for ${user.email}, blocking access`);
          await authService.signOut();
          setUser(null);
        }
      } else {
        setUser(user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    addDebugInfo(`Auth state changed, user: ${!!user}`);
    if (user) {
      refreshProfile().finally(() => {
        addDebugInfo('Profile refresh complete, setting loading to false');
        setLoading(false);
      });
    } else {
      addDebugInfo('No user, setting loading to false');
      setUserProfile(null);
      setLoading(false);
    }
  }, [user]);

  // Aggressive timeout to prevent infinite loading
  useEffect(() => {
    const timeout1 = setTimeout(() => {
      if (loading) {
        addDebugInfo('Auth loading timeout at 2s, forcing completion');
        setLoading(false);
      }
    }, 3000); // 3 second timeout
    
    // Emergency timeout
    const timeout2 = setTimeout(() => {
      if (loading) {
        addDebugInfo('EMERGENCY timeout at 8s, forcing app to load');
        setLoading(false);
        if (user && !userProfile) {
          addDebugInfo('Creating emergency fallback profile');
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
    }, 8000); // 8 second emergency timeout
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [loading, user]);

  const signIn = async (email: string, password: string) => {
    addDebugInfo(`Starting sign-in for: ${email}`);
    const { user } = await authService.signIn(email, password);
    addDebugInfo(`Sign-in successful for: ${user?.email}`);
    setUser(user);
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    addDebugInfo(`Starting signup process for: ${email}`);
    
    try {
      const { user } = await authService.signUp(email, password, displayName);
      addDebugInfo(`Signup successful, user created: ${user?.id}`);
      
      if (!user) {
        throw new Error('User creation failed - no user returned');
      }

      // Set user immediately for better UX
      setUser(user);
      
      // Try to create profile if trigger didn't work
      setTimeout(async () => {
        await ensureUserProfile(user, displayName);
      }, 1000);
      
    } catch (error: any) {
      addDebugInfo(`Signup failed: ${error.message}`);
      throw new Error(`Account creation failed: ${error.message}`);
    }
  };

  // Helper function to ensure user profile exists
  const ensureUserProfile = async (user: any, displayName?: string) => {
    try {
      addDebugInfo('Checking if user profile exists...');
      let profile = await userService.getCurrentUserProfile(user.id);
      
      if (!profile) {
        addDebugInfo('Profile not found, creating manually...');
        profile = await userService.createUserProfile({
          user_id: user.id,
          email: user.email!,
          display_name: displayName || user.email!.split('@')[0],
          role: user.email === 'jeremy@lyzr.ai' || user.email === 'admin@lyzr.ai' ? 'admin' : 'user'
        });
        addDebugInfo('Profile created successfully via fallback');
      } else {
        addDebugInfo('Profile found successfully');
      }
      
      setUserProfile(profile);
      
    } catch (error: any) {
      addDebugInfo(`Profile creation failed: ${error.message}`);
      
      // Create emergency fallback profile
      setUserProfile({
        id: user.id,
        user_id: user.id,
        email: user.email!,
        display_name: displayName || user.email!.split('@')[0],
        role: user.email === 'jeremy@lyzr.ai' || user.email === 'admin@lyzr.ai' ? 'admin' : 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: null,
        is_active: true,
        avatar_url: null
      });
      addDebugInfo('Using emergency fallback profile');
    }
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