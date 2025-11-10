import { create } from 'zustand';
import { UserState, User } from '@/types';
import { supabase } from '@/services/supabase';
import { uploadImage } from '@/utils/imageUpload';

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
                .from('users')
                .select(`
          *,
          followers!followers_follower_id_fkey(count),
          following!followers_following_id_fkey(count)
        `)
                .ilike('name', `%${query}%`)
                .limit(20);

            if (error) throw error;

            const { data: { user: currentUser } } = await supabase.auth.getUser();

            const usersWithCounts = data?.map(user => ({
                ...user,
                followers_count: user.followers[0]?.count || 0,
                following_count: user.following[0]?.count || 0,
                is_following: user.followers?.some((f: any) => f.follower_id === currentUser?.id) || false
            })) || [];

            set({ users: usersWithCounts, loading: false });
        } catch (error) {
            console.error('Search users error:', error);
            set({ loading: false });
            throw new Error('Failed to search users');
        }
    },

    fetchUserProfile: async (userId: string) => {
        try {
            set({ loading: true });

            const { data: { user: currentUser } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from('users')
                .select(`
          *,
          posts(count),
          followers!followers_following_id_fkey(count),
          following!followers_follower_id_fkey(count),
          followers!followers_follower_id_fkey(follower_id)
        `)
                .eq('id', userId)
                .single();

            if (error) throw error;

            const userWithCounts = {
                ...data,
                posts_count: data.posts[0]?.count || 0,
                followers_count: data.followers[0]?.count || 0,
                following_count: data.following[0]?.count || 0,
                is_following: data.followers?.some((f: any) => f.follower_id === currentUser?.id) || false
            };

            set({ currentProfile: userWithCounts, loading: false });
        } catch (error) {
            console.error('Fetch user profile error:', error);
            set({ loading: false });
            throw new Error('Failed to fetch user profile');
        }
    },

    followUser: async (userId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('followers')
                .insert([{ follower_id: user.id, following_id: userId }]);

            if (error) throw error;

            // Update current profile if it's the one being followed
            const { currentProfile } = get();
            if (currentProfile && currentProfile.id === userId) {
                set({
                    currentProfile: {
                        ...currentProfile,
                        followers_count: (currentProfile.followers_count || 0) + 1,
                        is_following: true
                    }
                });
            }

            // Update users list
            set((state) => ({
                users: state.users.map(u =>
                    u.id === userId
                        ? { ...u, followers_count: (u.followers_count || 0) + 1, is_following: true }
                        : u
                )
            }));
        } catch (error: any) {
            console.error('Follow user error:', error);
            throw new Error(error.message || 'Failed to follow user');
        }
    },

    unfollowUser: async (userId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('followers')
                .delete()
                .eq('follower_id', user.id)
                .eq('following_id', userId);

            if (error) throw error;

            // Update current profile
            const { currentProfile } = get();
            if (currentProfile && currentProfile.id === userId) {
                set({
                    currentProfile: {
                        ...currentProfile,
                        followers_count: Math.max(0, (currentProfile.followers_count || 1) - 1),
                        is_following: false
                    }
                });
            }

            // Update users list
            set((state) => ({
                users: state.users.map(u =>
                    u.id === userId
                        ? { ...u, followers_count: Math.max(0, (u.followers_count || 1) - 1), is_following: false }
                        : u
                )
            }));
        } catch (error: any) {
            console.error('Unfollow user error:', error);
            throw new Error(error.message || 'Failed to unfollow user');
        }
    },

    updateProfile: async (updates: Partial<User>) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', user.id)
                .select()
                .single();

            if (error) throw error;

            // Update current user in auth store and local state
            const { currentProfile } = get();
            if (currentProfile && currentProfile.id === user.id) {
                set({ currentProfile: { ...currentProfile, ...updates } });
            }

            return data;
        } catch (error: any) {
            console.error('Update profile error:', error);
            throw new Error(error.message || 'Failed to update profile');
        }
    },

    uploadProfileImage: async (imageUri: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const imageUrl = await uploadImage(imageUri, user.id);

            const { data, error } = await supabase
                .from('users')
                .update({ profile_image_url: imageUrl })
                .eq('id', user.id)
                .select()
                .single();

            if (error) throw error;

            // Update current user
            const { currentProfile } = get();
            if (currentProfile && currentProfile.id === user.id) {
                set({ currentProfile: { ...currentProfile, profile_image_url: imageUrl } });
            }

            return data;
        } catch (error: any) {
            console.error('Upload profile image error:', error);
            throw new Error(error.message || 'Failed to upload profile image');
        }
    },

    fetchFollowers: async (userId: string) => {
        try {
            set({ loading: true });

            const { data, error } = await supabase
                .from('followers')
                .select(`
          follower:users!followers_follower_id_fkey(*)
        `)
                .eq('following_id', userId);

            if (error) throw error;

            // In fetchFollowers method, replace lines around 233:
            const followers = data?.map((item: any) => item.follower).filter(Boolean) || [];
            set({ followers, loading: false });


        } catch (error) {
            console.error('Fetch followers error:', error);
            set({ loading: false });
            throw new Error('Failed to fetch followers');
        }
    },

    fetchFollowing: async (userId: string) => {
        try {
            set({ loading: true });

            const { data, error } = await supabase
                .from('followers')
                .select(`
          following:users!followers_following_id_fkey(*)
        `)
                .eq('follower_id', userId);

            if (error) throw error;

            // In fetchFollowing method, replace lines around 255:
            const following = data?.map((item: any) => item.following).filter(Boolean) || [];
            set({ following, loading: false });
        } catch (error) {
            console.error('Fetch following error:', error);
            set({ loading: false });
            throw new Error('Failed to fetch following');
        }
    },
}));