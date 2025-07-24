import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Add console logs to debug configuration
console.log('Supabase Configuration:');
console.log('- URL:', supabaseUrl);
console.log('- Key exists:', !!supabaseKey);
console.log('- URL configured:', supabaseUrl.length > 0);
console.log('- Key configured:', supabaseKey.length > 0);

// Only create client if both URL and key are provided
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
}) : null;

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl.length > 0 && supabaseKey.length > 0 && !supabaseUrl.includes('your-project-id');
};

export const signIn = async (email: string, password: string) => {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signUp = async (email: string, password: string, fullName: string) => {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        full_name: fullName,
      },
    },
  });
  return { data, error };
};

export const signOut = async () => {
  if (!supabase) {
    return { error: { message: 'Supabase not configured' } };
  }
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  if (!supabase) {
    return null;
  }
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};