import { create } from 'zustand';
import { AuthState } from '@/types';
import { supabase } from '@/services/supabase';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  connectionError: null,

  initialize: async () => {
    try {
      set({ loading: true, connectionError: null });
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Wait a bit for trigger to create user profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fetch user profile
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.warn('User profile not found, creating one...');
          // Create user profile if it doesn't exist
          const { data: newUser } = await supabase
            .from('users')
            .insert([
              {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name || 'User',
                created_at: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          set({ 
            user: newUser || null, 
            session, 
            loading: false,
            connectionError: null
          });
        } else {
          set({ 
            user: userData, 
            session, 
            loading: false,
            connectionError: null 
          });
        }
      } else {
        set({ loading: false, connectionError: null });
      }

      // Set up auth state listener
      supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth event:', event);
          
          if (event === 'SIGNED_IN' && session?.user) {
            // Wait for trigger
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            set({ 
              user: userData || {
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata?.name || 'User',
                created_at: new Date().toISOString(),
              }, 
              session,
              connectionError: null 
            });
          } else if (event === 'SIGNED_OUT') {
            set({ 
              user: null, 
              session: null, 
              connectionError: null 
            });
          } else if (event === 'USER_UPDATED') {
            // Refresh user data
            if (session?.user) {
              const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (userData) {
                set({ user: userData });
              }
            }
          }
        }
      );
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
        // For immediate sign-in (if email confirmation is disabled)
        if (data.session) {
          // Wait for the database trigger to create the user profile
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Fetch the user profile
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          // If profile doesn't exist, create it manually
          if (!userData) {
            const { data: newUser } = await supabase
              .from('users')
              .insert([
                {
                  id: data.user.id,
                  email: data.user.email!,
                  name: name.trim(),
                  created_at: new Date().toISOString(),
                },
              ])
              .select()
              .single();

            set({ user: newUser, session: data.session });
          } else {
            set({ user: userData, session: data.session });
          }
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
      
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('Network error')) {
          throw new Error('Network error: Cannot connect to server. Please check your internet connection.');
        }
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again.');
        }
        throw error;
      }

      console.log('Sign in successful');
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
      
      // Clear local state immediately
      set({ user: null, session: null });
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