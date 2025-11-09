import { create } from 'zustand';
import { AuthState, User } from '@/types';
import { supabase } from '@/services/supabase';
import { router } from 'expo-router';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  connectionError: null,

  initialize: async () => {
    try {
      set({ loading: true, connectionError: null });
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch user profile (created by trigger)
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({ 
          user: userData || null, 
          session,
          loading: false,
          connectionError: null
        });
      } else {
        set({ loading: false, connectionError: null });
      }

      // Auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth event:', event);
          
          if (session?.user) {
            // Give the trigger a moment to create the profile
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            set({ user: userData || null, session, connectionError: null });
            
            if (event === 'SIGNED_IN') {
              router.replace('/(tabs)');
            }
          } else {
            set({ user: null, session: null, connectionError: null });
            if (event === 'SIGNED_OUT') {
              router.replace('/(auth)/landing');
            }
          }
        }
      );

      return () => subscription.unsubscribe();
    } catch (error: any) {
      console.error('Auth initialization error:', error);
      set({ 
        loading: false, 
        connectionError: error.message || 'Cannot connect to server'
      });
    }
  },

  signUp: async (email: string, password: string, name: string) => {
    try {
      set({ connectionError: null });

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('Network error')) {
          throw new Error('Network error: Cannot connect to server. Please check your internet connection.');
        }
        throw error;
      }

      if (data.user) {
        // The database trigger will automatically create the user profile
        // Wait a moment for the trigger to execute
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // For immediate sign-in (if email confirmation is disabled in Supabase settings)
        if (data.session) {
          // Fetch the user profile created by the trigger
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          set({ user: userData, session: data.session });
          router.replace('/(tabs)');
        } else {
          // Email confirmation required
          throw new Error('Please check your email to confirm your account before signing in.');
        }
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      const errorMessage = error.message || 'Sign up failed. Please try again.';
      set({ connectionError: errorMessage });
      throw new Error(errorMessage);
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ connectionError: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('Network error')) {
          throw new Error('Network error: Cannot connect to server. Please check your internet connection.');
        }
        throw error;
      }

      // Auth state listener will handle the rest
    } catch (error: any) {
      console.error('Sign in error:', error);
      const errorMessage = error.message || 'Sign in failed. Please check your credentials.';
      set({ connectionError: errorMessage });
      throw new Error(errorMessage);
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Sign out failed. Please try again.');
    }
  },

  resetPassword: async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error(error.message || 'Password reset failed. Please try again.');
    }
  },

  clearError: () => set({ connectionError: null }),
}));