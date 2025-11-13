import { create } from "zustand";
import { AuthState } from "@/types";
import { supabase } from "@/services/supabase";
import { Platform } from "react-native";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  connectionError: null,

  initialize: async () => {
    try {
      set({ loading: true, connectionError: null });
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const { data: userData, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.warn("User profile not found, creating one...");
          const { data: newUser } = await supabase
            .from("users")
            .insert([
              {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name || "User",
                created_at: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          set({
            user: newUser || null,
            session,
            loading: false,
            connectionError: null,
          });
        } else {
          set({
            user: userData,
            session,
            loading: false,
            connectionError: null,
          });
        }
      } else {
        set({ loading: false, connectionError: null });
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth event:", event);

        if (event === "SIGNED_IN" && session?.user) {
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const { data: userData } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          set({
            user: userData || {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.name || "User",
              created_at: new Date().toISOString(),
            },
            session,
            connectionError: null,
          });
        } else if (event === "SIGNED_OUT") {
          set({
            user: null,
            session: null,
            connectionError: null,
          });
        } else if (event === "USER_UPDATED") {
          if (session?.user) {
            const { data: userData } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .single();

            if (userData) {
              set({ user: userData });
            }
          }
        }
      });
    } catch (error: any) {
      console.error("Auth initialization error:", error);
      set({
        loading: false,
        connectionError: error.message || "Cannot connect to server",
      });
    } finally{
      set({loading: false})
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
        if (
          error.message.includes("Failed to fetch") ||
          error.message.includes("Network error")
        ) {
          throw new Error(
            "Network error: Cannot connect to server. Please check your internet connection."
          );
        }
        throw error;
      }

      if (data.user) {
        if (data.session) {
          await new Promise((resolve) => setTimeout(resolve, 1500));

          const { data: userData } = await supabase
            .from("users")
            .select("*")
            .eq("id", data.user.id)
            .single();

          if (!userData) {
            const { data: newUser } = await supabase
              .from("users")
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
          throw new Error(
            "Please check your email to confirm your account before signing in."
          );
        }
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      const errorMessage = error.message || "Sign up failed. Please try again.";
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
        if (
          error.message.includes("Failed to fetch") ||
          error.message.includes("Network error")
        ) {
          throw new Error(
            "Network error: Cannot connect to server. Please check your internet connection."
          );
        }
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. Please try again.");
        }
        throw error;
      }

      console.log("Sign in successful");
    } catch (error: any) {
      console.error("Sign in error:", error);
      const errorMessage =
        error.message || "Sign in failed. Please check your credentials.";
      set({ connectionError: errorMessage });
      throw new Error(errorMessage);
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      set({ user: null, session: null });
    } catch (error: any) {
      console.error("Sign out error:", error);
      throw new Error(error.message || "Sign out failed. Please try again.");
    }
  },

  resetPassword: async (email: string) => {
    try {
      const redirectTo = Platform.select({
        web: `${window.location.origin}/reset-password`,
        default: 'framezapp://reset-password', 
      });

      const finalRedirect = `${redirectTo}?email=${encodeURIComponent(email)}`;
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: finalRedirect }
      );

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send reset link');
    }
  },

  verifyOTP: async (email: string, tokenHash: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: tokenHash,
        type: 'recovery',
      });
      if (error) throw error;
      if (data.session) set({ session: data.session });
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Invalid or expired link');
    }
  },
  updatePassword: async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: password.trim(),
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Update password error:', error);
      throw new Error(error.message || 'Password update failed. Please try again.');
    }
  },

  clearError: () => set({ connectionError: null }),
}));
