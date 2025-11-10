import { create } from 'zustand';
import { PostsState, Post } from '@/types';
import { supabase } from '@/services/supabase';
import { uploadImage } from '@/utils/imageUpload';

interface PostWithCounts extends Post {
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_saved: boolean;
  likes: Array<{ user_id: string }>;
  comments: Array<{ id: string }>;
  saved_posts: Array<{ user_id: string }>;
}

export const usePostsStore = create<PostsState>((set, get) => ({
  posts: [],
  userPosts: [],
  savedPosts: [],
  loading: false,

  fetchPosts: async () => {
    try {
      set({ loading: true });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(*),
          likes(count),
          comments(count),
          saved_posts!inner(user_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedPosts: PostWithCounts[] = (data || []).map((post: any) => ({
        ...post,
        likes_count: post.likes?.[0]?.count || 0,
        comments_count: post.comments?.[0]?.count || 0,
        is_liked: post.likes?.some((like: any) => like.user_id === user.id) || false,
        is_saved: post.saved_posts?.some((saved: any) => saved.user_id === user.id) || false
      }));

      set({ posts: transformedPosts, loading: false });
    } catch (error) {
      console.error('Fetch posts error:', error);
      set({ loading: false });
      throw new Error('Failed to fetch posts');
    }
  },

  fetchUserPosts: async (userId: string) => {
    try {
      set({ loading: true });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(*),
          likes(count),
          comments(count),
          saved_posts!inner(user_id)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedPosts: PostWithCounts[] = (data || []).map((post: any) => ({
        ...post,
        likes_count: post.likes?.[0]?.count || 0,
        comments_count: post.comments?.[0]?.count || 0,
        is_liked: post.likes?.some((like: any) => like.user_id === user.id) || false,
        is_saved: post.saved_posts?.some((saved: any) => saved.user_id === user.id) || false
      }));

      set({ userPosts: transformedPosts, loading: false });
    } catch (error) {
      console.error('Fetch user posts error:', error);
      set({ loading: false });
      throw new Error('Failed to fetch your posts');
    }
  },

  fetchSavedPosts: async () => {
    try {
      set({ loading: true });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('saved_posts')
        .select(`
          post:posts(
            *,
            user:users(*),
            likes(count),
            comments(count),
            saved_posts!inner(user_id)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const savedPosts: PostWithCounts[] = (data || []).map((item: any) => ({
        ...item.post,
        likes_count: item.post.likes?.[0]?.count || 0,
        comments_count: item.post.comments?.[0]?.count || 0,
        is_liked: item.post.likes?.some((like: any) => like.user_id === user.id) || false,
        is_saved: true
      }));

      set({ savedPosts, loading: false });
    } catch (error) {
      console.error('Fetch saved posts error:', error);
      set({ loading: false });
      throw new Error('Failed to fetch saved posts');
    }
  },

  createPost: async (content: string, imageUri?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let imageUrl: string | undefined;
     
      if (imageUri) {
        imageUrl = await uploadImage(imageUri, user.id);
      }

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

      const newPost: PostWithCounts = {
        ...data,
        likes_count: 0,
        comments_count: 0,
        is_liked: false,
        is_saved: false,
        likes: [],
        comments: [],
        saved_posts: []
      };

      set((state) => ({
        posts: [newPost, ...state.posts],
        userPosts: [newPost, ...state.userPosts],
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
        savedPosts: state.savedPosts.filter((p) => p.id !== postId),
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
        posts: state.posts.map((p) => {
          if (p.id === postId) {
            const currentPost = p as PostWithCounts;
            return { 
              ...data, 
              likes_count: currentPost.likes_count, 
              comments_count: currentPost.comments_count, 
              is_liked: currentPost.is_liked, 
              is_saved: currentPost.is_saved 
            };
          }
          return p;
        }),
        userPosts: state.userPosts.map((p) => {
          if (p.id === postId) {
            const currentPost = p as PostWithCounts;
            return { 
              ...data, 
              likes_count: currentPost.likes_count, 
              comments_count: currentPost.comments_count, 
              is_liked: currentPost.is_liked, 
              is_saved: currentPost.is_saved 
            };
          }
          return p;
        }),
      }));

      return data;
    } catch (error: any) {
      console.error('Update post error:', error);
      throw new Error(error.message || 'Failed to update post');
    }
  },

  likePost: async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('likes')
        .insert([{ user_id: user.id, post_id: postId }]);

      if (error) throw error;

      set((state) => ({
        posts: state.posts.map((p) => {
          if (p.id === postId) {
            const currentPost = p as PostWithCounts;
            return { 
              ...currentPost, 
              likes_count: (currentPost.likes_count || 0) + 1, 
              is_liked: true 
            };
          }
          return p;
        }),
        userPosts: state.userPosts.map((p) => {
          if (p.id === postId) {
            const currentPost = p as PostWithCounts;
            return { 
              ...currentPost, 
              likes_count: (currentPost.likes_count || 0) + 1, 
              is_liked: true 
            };
          }
          return p;
        }),
      }));
    } catch (error: any) {
      console.error('Like post error:', error);
      throw new Error(error.message || 'Failed to like post');
    }
  },

  unlikePost: async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);

      if (error) throw error;

      set((state) => ({
        posts: state.posts.map((p) => {
          if (p.id === postId) {
            const currentPost = p as PostWithCounts;
            return { 
              ...currentPost, 
              likes_count: Math.max(0, (currentPost.likes_count || 1) - 1), 
              is_liked: false 
            };
          }
          return p;
        }),
        userPosts: state.userPosts.map((p) => {
          if (p.id === postId) {
            const currentPost = p as PostWithCounts;
            return { 
              ...currentPost, 
              likes_count: Math.max(0, (currentPost.likes_count || 1) - 1), 
              is_liked: false 
            };
          }
          return p;
        }),
      }));
    } catch (error: any) {
      console.error('Unlike post error:', error);
      throw new Error(error.message || 'Failed to unlike post');
    }
  },

  savePost: async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('saved_posts')
        .insert([{ user_id: user.id, post_id: postId }]);

      if (error) throw error;

      set((state) => ({
        posts: state.posts.map((p) => {
          if (p.id === postId) {
            const currentPost = p as PostWithCounts;
            return { ...currentPost, is_saved: true };
          }
          return p;
        }),
        userPosts: state.userPosts.map((p) => {
          if (p.id === postId) {
            const currentPost = p as PostWithCounts;
            return { ...currentPost, is_saved: true };
          }
          return p;
        }),
      }));
    } catch (error: any) {
      console.error('Save post error:', error);
      throw new Error(error.message || 'Failed to save post');
    }
  },

  unsavePost: async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);

      if (error) throw error;

      set((state) => ({
        posts: state.posts.map((p) => {
          if (p.id === postId) {
            const currentPost = p as PostWithCounts;
            return { ...currentPost, is_saved: false };
          }
          return p;
        }),
        userPosts: state.userPosts.map((p) => {
          if (p.id === postId) {
            const currentPost = p as PostWithCounts;
            return { ...currentPost, is_saved: false };
          }
          return p;
        }),
        savedPosts: state.savedPosts.filter((p) => p.id !== postId),
      }));
    } catch (error: any) {
      console.error('Unsave post error:', error);
      throw new Error(error.message || 'Failed to unsave post');
    }
  },

  addComment: async (postId: string, content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            user_id: user.id,
            post_id: postId,
            content: content.trim(),
          },
        ])
        .select(`
          *,
          user:users(*)
        `)
        .single();

      if (error) throw error;

      set((state) => ({
        posts: state.posts.map((p) => {
          if (p.id === postId) {
            const currentPost = p as PostWithCounts;
            return { 
              ...currentPost, 
              comments_count: (currentPost.comments_count || 0) + 1 
            };
          }
          return p;
        }),
        userPosts: state.userPosts.map((p) => {
          if (p.id === postId) {
            const currentPost = p as PostWithCounts;
            return { 
              ...currentPost, 
              comments_count: (currentPost.comments_count || 0) + 1 
            };
          }
          return p;
        }),
      }));

      return data;
    } catch (error: any) {
      console.error('Add comment error:', error);
      throw new Error(error.message || 'Failed to add comment');
    }
  },

  deleteComment: async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Delete comment error:', error);
      throw new Error(error.message || 'Failed to delete comment');
    }
  },
}));