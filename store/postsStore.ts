import { create } from "zustand";
import { PostsState, Post } from "@/types";
import { supabase } from "@/services/supabase";
import { uploadImage } from "@/utils/imageUpload";

interface PostWithCounts extends Omit<Post, "comments"> {
  likes: { user_id: string }[];
  comments: {
    id: string;
    content: string;
    user_id: string;
    post_id?: string;
    created_at: string;
    user?: { name: string; profile_image_url?: string };
  }[];
  saved_posts: { user_id: string }[];
}


export const usePostsStore = create<PostsState>((set, get) => ({
  posts: [],
  userPosts: [],
  savedPosts: [],
  loading: false,

  fetchPosts: async () => {
    try {
      set({ loading: true });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          user:users(*),
          likes(user_id),
          comments( *, user:users(name, profile_image_url) ),
          saved_posts(user_id)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const transformedPosts: Post[] = (data || []).map(
        (post: PostWithCounts) => ({
          ...post,
          likes_count: post.likes?.length || 0,
          comments_count: post.comments?.length || 0,
          is_liked:
            post.likes?.some((like) => like.user_id === user.id) || false,
          is_saved:
            post.saved_posts?.some((saved) => saved.user_id === user.id) ||
            false,
        })
      );

      set({ posts: transformedPosts, loading: false });
    } catch (error) {
      console.error("Fetch posts error:", error);
      set({ loading: false });
      throw new Error("Failed to fetch posts");
    }
  },

  fetchUserPosts: async (userId: string) => {
    try {
      set({ loading: true });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          user:users(*),
          likes(user_id),
          comments( *, user:users(name, profile_image_url) ),
          saved_posts(user_id)
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const transformedPosts: Post[] = (data || []).map(
        (post: PostWithCounts) => ({
          ...post,
          likes_count: post.likes?.length || 0,
          comments_count: post.comments?.length || 0,
          is_liked:
            post.likes?.some((like) => like.user_id === user.id) || false,
          is_saved:
            post.saved_posts?.some((saved) => saved.user_id === user.id) ||
            false,
        })
      );

      set({ userPosts: transformedPosts, loading: false });
    } catch (error) {
      console.error("Fetch user posts error:", error);
      set({ loading: false });
      throw new Error("Failed to fetch your posts");
    }
  },

  fetchSavedPosts: async () => {
    try {
      set({ loading: true });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("saved_posts")
        .select(
          `
          post:posts(
            *,
            user:users(*),
            likes(user_id),
            comments( *, user:users(name, profile_image_url) ),
            saved_posts(user_id)
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const savedPosts: Post[] = (data || []).map((item: any) => ({
        ...item.post,
        likes_count: item.post.likes?.length || 0,
        comments_count: item.post.comments?.length || 0,
        is_liked:
          item.post.likes?.some((like: any) => like.user_id === user.id) ||
          false,
        is_saved: true,
      }));

      set({ savedPosts, loading: false });
    } catch (error) {
      console.error("Fetch saved posts error:", error);
      set({ loading: false });
      throw new Error("Failed to fetch saved posts");
    }
  },

  createPost: async (content: string, imageUri?: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let imageUrl: string | undefined;

      if (imageUri) {
        imageUrl = await uploadImage(imageUri, user.id);
      }

      const { data, error } = await supabase
        .from("posts")
        .insert([
          {
            user_id: user.id,
            content: content.trim(),
            image_url: imageUrl,
            created_at: new Date().toISOString(),
          },
        ])
        .select(
          `
          *,
          user:users(*)
        `
        )
        .single();

      if (error) throw error;

      const newPost: Post = {
        ...data,
        likes_count: 0,
        comments_count: 0,
        is_liked: false,
        is_saved: false,
      };

      set((state) => ({
        posts: [newPost, ...state.posts],
        userPosts: [newPost, ...state.userPosts],
      }));

      return data;
    } catch (error: any) {
      console.error("Create post error:", error);
      throw new Error(error.message || "Failed to create post");
    }
  },

  deletePost: async (postId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Clean up dependencies
      await supabase.from("likes").delete().eq("post_id", postId);
      await supabase.from("comments").delete().eq("post_id", postId);
      await supabase.from("saved_posts").delete().eq("post_id", postId);

      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", user.id);

      if (error) throw error;

      set((state) => ({
        posts: state.posts.filter((p) => p.id !== postId),
        userPosts: state.userPosts.filter((p) => p.id !== postId),
        savedPosts: state.savedPosts.filter((p) => p.id !== postId),
      }));
    } catch (error: any) {
      console.error("Delete post error:", error);
      throw error;
    }
  },

  updatePost: async (postId: string, content: string) => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .update({
          content: content.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId)
        .select(
          `
          *,
          user:users(*)
        `
        )
        .single();

      if (error) throw error;

      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? {
              ...data,
              likes_count: p.likes_count,
              comments_count: p.comments_count,
              is_liked: p.is_liked,
              is_saved: p.is_saved,
            }
            : p
        ),
        userPosts: state.userPosts.map((p) =>
          p.id === postId
            ? {
              ...data,
              likes_count: p.likes_count,
              comments_count: p.comments_count,
              is_liked: p.is_liked,
              is_saved: p.is_saved,
            }
            : p
        ),
      }));

      return data;
    } catch (error: any) {
      console.error("Update post error:", error);
      throw new Error(error.message || "Failed to update post");
    }
  },

  likePost: async (postId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("likes")
        .insert([{ user_id: user.id, post_id: postId }]);

      if (error) throw error;

      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? { ...p, likes_count: (p.likes_count || 0) + 1, is_liked: true }
            : p
        ),
        userPosts: state.userPosts.map((p) =>
          p.id === postId
            ? { ...p, likes_count: (p.likes_count || 0) + 1, is_liked: true }
            : p
        ),
      }));
    } catch (error: any) {
      console.error("Like post error:", error);
      throw new Error(error.message || "Failed to like post");
    }
  },

  unlikePost: async (postId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", postId);

      if (error) throw error;

      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? {
              ...p,
              likes_count: Math.max(0, (p.likes_count || 1) - 1),
              is_liked: false,
            }
            : p
        ),
        userPosts: state.userPosts.map((p) =>
          p.id === postId
            ? {
              ...p,
              likes_count: Math.max(0, (p.likes_count || 1) - 1),
              is_liked: false,
            }
            : p
        ),
      }));
    } catch (error: any) {
      console.error("Unlike post error:", error);
      throw new Error(error.message || "Failed to unlike post");
    }
  },

  savePost: async (postId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("saved_posts")
        .insert([{ user_id: user.id, post_id: postId }]);

      if (error) throw error;

      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, is_saved: true } : p
        ),
        userPosts: state.userPosts.map((p) =>
          p.id === postId ? { ...p, is_saved: true } : p
        ),
      }));
    } catch (error: any) {
      console.error("Save post error:", error);
      throw new Error(error.message || "Failed to save post");
    }
  },

  unsavePost: async (postId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("saved_posts")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", postId);

      if (error) throw error;

      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, is_saved: false } : p
        ),
        userPosts: state.userPosts.map((p) =>
          p.id === postId ? { ...p, is_saved: false } : p
        ),
        savedPosts: state.savedPosts.filter((p) => p.id !== postId),
      }));
    } catch (error: any) {
      console.error("Unsave post error:", error);
      throw new Error(error.message || "Failed to unsave post");
    }
  },

  addComment: async (postId: string, content: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("comments")
        .insert([
          {
            user_id: user.id,
            post_id: postId,
            content: content.trim(),
          },
        ])
        .select(
          `
          *,
          user:users(name, profile_image_url)
        `
        )
        .single();

      if (error) throw error;

      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? {
              ...p,
              comments_count: (p.comments_count || 0) + 1,
              comments: [...(p.comments || []), data],
            }
            : p
        ),
        userPosts: state.userPosts.map((p) =>
          p.id === postId
            ? {
              ...p,
              comments_count: (p.comments_count || 0) + 1,
              comments: [...(p.comments || []), data],
            }
            : p
        ),
      }));

      return data;
    } catch (error: any) {
      console.error("Add comment error:", error);
      throw new Error(error.message || "Failed to add comment");
    }
  },

  deleteComment: async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
    } catch (error: any) {
      console.error("Delete comment error:", error);
      throw new Error(error.message || "Failed to delete comment");
    }
  },
}));
