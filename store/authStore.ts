import { create } from 'zustand';
import { AuthState } from '@/types';
import { supabase } from '@/services/supabase';
import { router } from 'expo-router';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({ 
          user: userData, 
          session,
          loading: false 
        });
      } else {
        set({ loading: false });
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          set({ user: userData, session });
        } else {
          set({ user: null, session: null });
        }
      });
    } catch (error) {
      console.error('Initialize error:', error);
      set({ loading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        set({ user: userData, session: data.session });
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Sign in failed');
    }
  },

  signUp: async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email,
              name,
              created_at: new Date().toISOString(),
            },
          ]);

        if (profileError) throw profileError;

        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        set({ user: userData, session: data.session });
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Sign up failed');
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, session: null });
      router.replace('/(auth)/landing');
    } catch (error: any) {
      throw new Error(error.message || 'Sign out failed');
    }
  },

  resetPassword: async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'framez://reset-password',
      });

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Password reset failed');
    }
  },
}));