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

  // store/userStore.ts
 searchUsers: async (query: string) => {
  try {
    set({ loading: true });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Step 1: Search users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, profile_image_url, bio')
      .ilike('name', `%${query}%`)
      .neq('id', user.id);

    if (error) throw error;
    if (!users || users.length === 0) {
      set({ users: [], loading: false });
      return;
    }

    // Step 2: Fetch counts in parallel
    const userPromises = users.map(async (u) => {
      const [
        followersRes,
        followingRes,
        isFollowingRes,
        postsRes
      ] = await Promise.all([
        supabase.from('followers').select('id', { count: 'exact', head: true }).eq('following_id', u.id),
        supabase.from('followers').select('id', { count: 'exact', head: true }).eq('follower_id', u.id),
        supabase.from('followers').select('id').eq('follower_id', user.id).eq('following_id', u.id).maybeSingle(),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', u.id),
      ]);

      return {
        id: u.id,
        name: u.name,
        profile_image_url: u.profile_image_url,
        bio: u.bio,
        followers_count: followersRes.count || 0,
        following_count: followingRes.count || 0,
        is_following: !!isFollowingRes.data,
        posts_count: postsRes.count || 0,
        email: '', // optional
        created_at: '', // optional
      } as User;
    });

    const transformedUsers = await Promise.all(userPromises);
    set({ users: transformedUsers, loading: false });
  } catch (error: any) {
    console.error('Search users error:', error.message || error);
    set({ loading: false });
  }
},

fetchUserProfile: async (userId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile, error } = await supabase
      .from('users')
      .select('id, name, profile_image_url, bio')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const [
      followersRes,
      followingRes,
      isFollowingRes,
      postsRes
    ] = await Promise.all([
      supabase.from('followers').select('id', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('followers').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
      supabase.from('followers').select('id').eq('follower_id', user.id).eq('following_id', userId).maybeSingle(),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    const transformed: User = {
      id: profile.id,
      name: profile.name,
      profile_image_url: profile.profile_image_url,
      bio: profile.bio,
      followers_count: followersRes.count || 0,
      following_count: followingRes.count || 0,
      is_following: !!isFollowingRes.data,
      posts_count: postsRes.count || 0,
      email: '',
      created_at: '',
    };

    set({ currentProfile: transformed });
  } catch (error: any) {
    console.error('Fetch profile error:', error.message || error);
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
