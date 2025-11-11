import { create } from "zustand";
import { UserState, User } from "@/types";
import { supabase } from "@/services/supabase";
import { uploadImage } from "@/utils/imageUpload";

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  currentProfile: null,
  followers: [],
  following: [],
  loading: false,

  searchUsers: async (query: string) => {
    try {
      set({ loading: true });

      if (!query.trim()) {
        set({ users: [], loading: false });
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select(
          `
          *,
          followers_count:followers!followers_follower_id_fkey(count),
          following_count:followers!followers_following_id_fkey(count)
        `
        )
        .ilike("name", `%${query}%`)
        .limit(20);

      if (error) throw error;



      const usersWithCounts =
        data?.map((user) => ({
          ...user,
          followers_count: user.followers_count?.[0]?.count || 0,
          following_count: user.following_count?.[0]?.count || 0,
          is_following: false, // Separate query if needed for performance
        })) || [];

      set({ users: usersWithCounts, loading: false });
    } catch (error) {
      console.error("Search users error:", error);
      set({ loading: false });
      throw new Error("Failed to search users");
    }
  },

  fetchUserProfile: async (userId: string) => {
  try {
    set({ loading: true });

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("users")
      .select(`
        *,
        posts(count),
        followers_count:followers!followers_following_id_fkey(count),
        following_count:followers!followers_follower_id_fkey(count)
      `)
      .eq("id", userId)
      .maybeSingle(); // ← Use maybeSingle() instead of .single()

    if (error) throw error;
    if (!data) throw new Error("User not found");

    // Check if current user follows this profile
    let isFollowing = false;
    if (currentUser?.id && currentUser.id !== userId) {
      const { data: followData } = await supabase
        .from("followers")
        .select("follower_id")
        .eq("follower_id", currentUser.id)
        .eq("following_id", userId)
        .maybeSingle();
      isFollowing = !!followData;
    }

    const userWithCounts = {
      ...data,
      posts_count: data.posts?.[0]?.count || 0,
      followers_count: data.followers_count?.[0]?.count || 0,
      following_count: data.following_count?.[0]?.count || 0,
      is_following: isFollowing,
    };

    set({ currentProfile: userWithCounts, loading: false });
  } catch (error: any) {
    console.error("Fetch user profile error:", error);
    set({ loading: false });
    throw new Error(error.message || "Failed to fetch user profile");
  }
},

  followUser: async (userId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("followers")
        .insert([{ follower_id: user.id, following_id: userId }]);

      if (error) throw error;

      const { currentProfile } = get();
      if (currentProfile && currentProfile.id === userId) {
        set({
          currentProfile: {
            ...currentProfile,
            followers_count: (currentProfile.followers_count || 0) + 1,
            is_following: true,
          },
        });
      }

      set((state) => ({
        users: state.users.map((u) =>
          u.id === userId
            ? {
              ...u,
              followers_count: (u.followers_count || 0) + 1,
              is_following: true,
            }
            : u
        ),
      }));
    } catch (error: any) {
      console.error("Follow user error:", error);
      throw new Error(error.message || "Failed to follow user");
    }
  },

  unfollowUser: async (userId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("followers")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", userId);

      if (error) throw error;

      const { currentProfile } = get();
      if (currentProfile && currentProfile.id === userId) {
        set({
          currentProfile: {
            ...currentProfile,
            followers_count: Math.max(
              0,
              (currentProfile.followers_count || 1) - 1
            ),
            is_following: false,
          },
        });
      }

      set((state) => ({
        users: state.users.map((u) =>
          u.id === userId
            ? {
              ...u,
              followers_count: Math.max(0, (u.followers_count || 1) - 1),
              is_following: false,
            }
            : u
        ),
      }));
    } catch (error: any) {
      console.error("Unfollow user error:", error);
      throw new Error(error.message || "Failed to unfollow user");
    }
  },

  // store/userStore.ts  (replace the whole function)

  updateProfile: async (updates: Partial<User>) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Update auth user name (optional)
     

      // 2. Update the `users` row
      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      // 3. Optimistically update the store
      set((state) => ({
        currentProfile:
          state.currentProfile?.id === user.id
            ? { ...state.currentProfile, ...updates }
            : state.currentProfile,
      }));

      return data;
    } catch (error: any) {
      console.error("Update profile error:", error);
      throw error;          // <-- let the UI handle it
    }
  },

  uploadProfileImage: async (imageUri: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const imageUrl = await uploadImage(imageUri, user.id);

      const { data, error } = await supabase
        .from("users")
        .update({ profile_image_url: imageUrl })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      const { currentProfile } = get();
      if (currentProfile && currentProfile.id === user.id) {
        set({
          currentProfile: { ...currentProfile, profile_image_url: imageUrl },
        });
      }

      return data;
    } catch (error: any) {
      console.error("Upload profile image error:", error);
      throw new Error(error.message || "Failed to upload profile image");
    }
  },

  fetchFollowers: async (userId: string) => {
    try {
      set({ loading: true });

      const { data, error } = await supabase
        .from("followers")
        .select(
          `
          follower:users!followers_follower_id_fkey(*)
        `
        )
        .eq("following_id", userId);

      if (error) throw error;

      const followers =
        data?.map((item: any) => item.follower).filter(Boolean) || [];
      set({ followers, loading: false });
    } catch (error) {
      console.error("Fetch followers error:", error);
      set({ loading: false });
      throw new Error("Failed to fetch followers");
    }
  },

  fetchFollowing: async (userId: string) => {
    try {
      set({ loading: true });

      const { data, error } = await supabase
        .from("followers")
        .select(
          `
          following:users!followers_following_id_fkey(*)
        `
        )
        .eq("follower_id", userId);

      if (error) throw error;

      const following =
        data?.map((item: any) => item.following).filter(Boolean) || [];
      set({ following, loading: false });
    } catch (error) {
      console.error("Fetch following error:", error);
      set({ loading: false });
      throw new Error("Failed to fetch following");
    }
  },
}));
