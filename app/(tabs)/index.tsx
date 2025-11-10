import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PostCard } from '@/components/PostCard';
import { StoriesBar } from '@/components/StoriesBar';
import { CreatePostModal } from '@/components/CreatePostModal';
import { CreateStoryModal } from '@/components/CreateStoryModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import { usePostsStore } from '@/store/postsStore';
import { useStoriesStore } from '@/store/storiesStore';
import { useUserStore } from '@/store/userStore';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Story } from '@/types';

export default function PostsScreen() {
  const { user } = useAuthStore();
  const { posts, loading, fetchPosts } = usePostsStore();
  const { fetchStories } = useStoriesStore();
  const { fetchUserProfile } = useUserStore();
  const { isDark, toggleTheme } = useThemeStore();
  const colors = isDark ? Colors.dark : Colors.light;

  const [modalVisible, setModalVisible] = useState(false);
  const [storyModalVisible, setStoryModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const loadInitialData = useCallback(async () => {
    try {
      await Promise.all([
        fetchPosts(),
        fetchStories(),
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }, [fetchPosts, fetchStories]);

  useEffect(() => {
  loadInitialData();
}, [loadInitialData]);


  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchPosts(),
        fetchStories(),
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPosts, fetchStories]);

  const handleUserPress = useCallback(async (userId: string) => {
    try {
      await fetchUserProfile(userId);
      router.push('/profile');
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  }, [fetchUserProfile]);

  const handleStoryPress = useCallback((story: Story) => {
    // Navigate to story viewer
    console.log('Story pressed:', story.id);
    // You can implement a story viewer modal here
  }, []);

  const handleAddStoryPress = useCallback(() => {
    setStoryModalVisible(true);
  }, []);

  const renderPost = useCallback(({ item }: { item: any }) => (
    <PostCard 
      post={item} 
      onUserPress={handleUserPress}
    />
  ), [handleUserPress]);

  if (loading && posts.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Framez</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.iconButton, { backgroundColor: colors.background }]}
          >
            <Text style={styles.iconText}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/search')}
            style={[styles.iconButton, { backgroundColor: colors.background }]}
          >
            <Text style={styles.iconText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            style={[styles.avatar, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stories */}
      <StoriesBar
        onStoryPress={handleStoryPress}
        onAddStoryPress={handleAddStoryPress}
      />

      {/* Posts Feed */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No posts yet. Be the first to share!
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={10}
        windowSize={10}
      />

      {/* Create Post FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <LinearGradient
          colors={['#FF8C42', '#FFD93D']}
          style={styles.fabGradient}
        >
          <Text style={styles.fabText}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Modals */}
      <CreatePostModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />

      <CreateStoryModal
        visible={storyModalVisible}
        onClose={() => setStoryModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 12,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: '300',
  },
});