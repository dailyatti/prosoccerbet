import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      if (!isSupabaseConfigured()) {
        // Fallback to localStorage for demo mode
        checkLocalSession();
        return;
      }

      try {
        const { data: { session }, error } = await supabase!.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          return;
        }

        if (session?.user) {
          await fetchUserProfile(session.user.id);
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase!.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            await fetchUserProfile(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
        });

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Error initializing auth:', error);
        checkLocalSession();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const checkLocalSession = () => {
    try {
      const savedUser = localStorage.getItem('prosofthub_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading saved session:', error);
      localStorage.removeItem('prosofthub_user');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase!
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      if (data) {
        setUser(data);
      } else {
        // Create user profile if it doesn't exist
        const { data: authUser } = await supabase!.auth.getUser();
        if (authUser.user) {
          const newUser = {
            id: authUser.user.id,
            email: authUser.user.email!,
            full_name: authUser.user.user_metadata?.full_name || '',
            subscription_active: false,
            trial_expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            is_trial_used: false,
            is_admin: false,
            created_at: new Date().toISOString()
          };

          const { error: insertError } = await supabase!
            .from('users')
            .insert(newUser);

          if (!insertError) {
            setUser(newUser);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return signInDemo(email, password);
    }

    try {
      const { data, error } = await supabase!.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        await fetchUserProfile(data.user.id);
      }

      return { error: null };
    } catch (error) {
      return { error: { message: 'Login failed' } };
    }
  };

  const signInDemo = async (email: string, password: string) => {
    try {
      // Simple demo authentication
      const demoUser: User = {
        id: 'user-' + Date.now(),
        email: email,
        full_name: email.split('@')[0],
        whop_user_id: null,
        subscription_active: false, // Demo users start with trial only
        subscription_expires_at: null,
        trial_expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 day trial
        is_trial_used: false,
        is_admin: email.includes('admin'),
        created_at: new Date().toISOString()
      };
      
      // Save to localStorage
      localStorage.setItem('prosofthub_user', JSON.stringify(demoUser));
      setUser(demoUser);
      
      return { error: null };
    } catch (error) {
      return { error: { message: 'Login failed' } };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured()) {
      return signUpDemo(email, password, fullName);
    }

    try {
      const { data, error } = await supabase!.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { error };
      }

      // User will be created in the database via trigger or manual creation
      if (data.user) {
        await fetchUserProfile(data.user.id);
      }

      return { error: null };
    } catch (error) {
      return { error: { message: 'Signup failed' } };
    }
  };

  const signUpDemo = async (email: string, password: string, fullName: string) => {
    try {
      // Create demo user with trial
      const demoUser: User = {
        id: 'user-' + Date.now(),
        email: email,
        full_name: fullName,
        whop_user_id: null,
        subscription_active: false,
        subscription_expires_at: null,
        trial_expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 day trial
        is_trial_used: false,
        is_admin: false,
        created_at: new Date().toISOString()
      };
      
      // Save to localStorage
      localStorage.setItem('prosofthub_user', JSON.stringify(demoUser));
      setUser(demoUser);
      
      return { error: null };
    } catch (error) {
      return { error: { message: 'Signup failed' } };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase!.auth.signOut();
    }
    localStorage.removeItem('prosofthub_user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}