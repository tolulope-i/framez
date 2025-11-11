import { create } from 'zustand';
import { StoriesState } from '@/types';
import { supabase } from '@/services/supabase';
import { uploadImage } from '@/utils/imageUpload';

export const useStoriesStore = create<StoriesState>((set, get) => ({
  stories: [],
  userStories: [],
  loading: false,

  fetchStories: async () => {
    try {
      set({ loading: true });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          user:users(*),
          story_views!story_views_story_id_fkey (user_id)
        `)
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const storiesWithSeen = data?.map(story => ({
        ...story,
        seen: story.story_views.some((view: any) => view.user_id === user.id)
      })) || [];

      set({ stories: storiesWithSeen, loading: false });
    } catch (error) {
      console.error('Fetch stories error:', error);
      set({ loading: false });
      throw new Error('Failed to fetch stories');
    }
  },

  fetchUserStories: async (userId: string) => {
    try {
      set({ loading: true });

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          user:users(*)
        `)
        .eq('user_id', userId)
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ userStories: data || [], loading: false });
    } catch (error) {
      console.error('Fetch user stories error:', error);
      set({ loading: false });
      throw new Error('Failed to fetch user stories');
    }
  },

  createStory: async (imageUri: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const imageUrl = await uploadImage(imageUri, user.id);

      const { data, error } = await supabase
        .from('stories')
        .insert([
          {
            user_id: user.id,
            image_url: imageUrl,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        ])
        .select(`
          *,
          user:users(*)
        `)
        .single();

      if (error) throw error;

      set((state) => ({
        stories: [data, ...state.stories],
        userStories: [data, ...state.userStories],
      }));

      return data;
    } catch (error: any) {
      console.error('Create story error:', error);
      throw new Error(error.message || 'Failed to create story');
    }
  },

  deleteStory: async (storyId: string) => {
    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;

      set((state) => ({
        stories: state.stories.filter((s) => s.id !== storyId),
        userStories: state.userStories.filter((s) => s.id !== storyId),
      }));
    } catch (error: any) {
      console.error('Delete story error:', error);
      throw new Error(error.message || 'Failed to delete story');
    }
  },

  markStoryAsSeen: async (storyId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Silently skip if not logged in

    const { error } = await supabase
      .from('story_views')
      .upsert(
        { user_id: user.id, story_id: storyId },
        { 
          onConflict: 'user_id,story_id',
          ignoreDuplicates: true 
        }
      );

    if (error && error.code !== '23505') {
      console.warn('Failed to mark story as seen:', error.message);
      return;
    }

    set((state) => ({
      stories: state.stories.map((s) =>
        s.id === storyId ? { ...s, seen: true } : s
      ),
    }));
  } catch (error: any) {
    console.warn('Mark story as seen error:', error.message);
  }
},

}));