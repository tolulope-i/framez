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
    }
  },

  createPost: async (content: string, imageUri?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let imageUrl: string | undefined;

      if (imageUri) {
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const fileName = `${user.id}_${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, decode(base64), {
            contentType: 'image/jpeg',
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            user_id: user.id,
            content,
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

      set((state) => ({
        posts: [data, ...state.posts],
      }));
    } catch (error: any) {
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
      throw new Error(error.message || 'Failed to delete post');
    }
  },

  updatePost: async (postId: string, content: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({ content })
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
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update post');
    }
  },
}));