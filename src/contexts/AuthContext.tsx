import React, { createContext, useContext, useEffect, useState } from 'react';
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
    // Check localStorage for existing session
    const checkSession = () => {
      try {
        const savedUser = localStorage.getItem('prosofthub_user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading saved session:', error);
        localStorage.removeItem('prosofthub_user');
      }
      
      // Always finish loading after check
      setLoading(false);
    };

    // Immediate check
    checkSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Simple demo authentication
      const demoUser: User = {
          subscription_active: false, // New users start with trial
          subscription_expires_at: null,
        full_name: email.split('@')[0],
        whop_user_id: null,
        subscription_active: true, // Demo users get active subscription
        subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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