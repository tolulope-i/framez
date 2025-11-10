import { create } from 'zustand';
import { PostsState, Post } from '@/types';
import { supabase } from '@/services/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export const usePostsStore = create<PostsState>((set, get) => ({
  posts: [],
  userPosts: [],
  loading: false,

  fetchPosts: async () => {
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ posts: data || [], loading: false });
    } catch (error) {
      console.error('Fetch posts error:', error);
      set({ loading: false });
      throw new Error('Failed to fetch posts');
    }
  },

  fetchUserPosts: async (userId: string) => {
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ userPosts: data || [], loading: false });
    } catch (error) {
      console.error('Fetch user posts error:', error);
      set({ loading: false });
      throw new Error('Failed to fetch your posts');
    }
  },

  createPost: async (content: string, imageUri?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let imageUrl: string | undefined;

      // Upload image if provided
      if (imageUri) {
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: 'base64',
        });


        const fileName = `posts/${user.id}_${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, decode(base64), {
            contentType: 'image/jpeg',
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Create post
      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            user_id: user.id,
            content: content.trim(),
            image_url: imageUrl,
            created_at: new Date().toISOString(),
          },
        ])
        .select(`
          *,
          user:users(*)
        `)
        .single();

      if (error) throw error;

      // Update state
      set((state) => ({
        posts: [data, ...state.posts],
        userPosts: [data, ...state.userPosts],
      }));

      return data;
    } catch (error: any) {
      console.error('Create post error:', error);
      throw new Error(error.message || 'Failed to create post');
    }
  },

  deletePost: async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      set((state) => ({
        posts: state.posts.filter((p) => p.id !== postId),
        userPosts: state.userPosts.filter((p) => p.id !== postId),
      }));
    } catch (error: any) {
      console.error('Delete post error:', error);
      throw new Error(error.message || 'Failed to delete post');
    }
  },

  updatePost: async (postId: string, content: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({
          content: content.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select(`
          *,
          user:users(*)
        `)
        .single();

      if (error) throw error;

      set((state) => ({
        posts: state.posts.map((p) => (p.id === postId ? data : p)),
        userPosts: state.userPosts.map((p) => (p.id === postId ? data : p)),
      }));

      return data;
    } catch (error: any) {
      console.error('Update post error:', error);
      throw new Error(error.message || 'Failed to update post');
    }
  },
}));