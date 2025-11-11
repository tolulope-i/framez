import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Platform,
  Modal,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { PostCard } from "@/components/PostCard";
import { StoriesBar } from "@/components/StoriesBar";
import { CreatePostModal } from "@/components/CreatePostModal";
import { CreateStoryModal } from "@/components/CreateStoryModal";
import { useAuthStore } from "@/store/authStore";
import { usePostsStore } from "@/store/postsStore";
import { useStoriesStore } from "@/store/storiesStore";
import { useUserStore } from "@/store/userStore";
import { useThemeStore } from "@/store/themeStore";
import { Colors } from "@/constants/Colors";
import { LinearGradient } from "expo-linear-gradient";
import { Story } from "@/types";

export default function PostsScreen() {
  const { user } = useAuthStore();
  const { posts, fetchPosts } = usePostsStore();
  const { fetchStories, markStoryAsSeen } = useStoriesStore();
  const { fetchUserProfile } = useUserStore();
  const { isDark, toggleTheme } = useThemeStore();
  const colors = isDark ? Colors.dark : Colors.light;

  const [modalVisible, setModalVisible] = useState(false);
  const [storyModalVisible, setStoryModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUserStories, setSelectedUserStories] = useState<
    Story[] | null
  >(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  const [windowWidth, setWindowWidth] = useState(
    Dimensions.get("window").width
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setWindowWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  const isWebLarge = Platform.OS === "web" && windowWidth > 768;

  const loadInitialData = useCallback(async () => {
    try {
      await Promise.all([fetchPosts(), fetchStories()]);
    } catch (error) {
      console.error("Failed to load initial data:", error);
    }
  }, [fetchPosts, fetchStories]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchPosts(), fetchStories()]);
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPosts, fetchStories]);

  const handleUserPress = useCallback(
    async (userId: string) => {
      try {
        await fetchUserProfile(userId);
        router.push("/(tabs)/profile");
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    },
    [fetchUserProfile]
  );

  const handleStoryPress = useCallback(
    (stories: Story[]) => {
      setSelectedUserStories(stories);
      setCurrentStoryIndex(0);
      markStoryAsSeen(stories[0].id);
    },
    [markStoryAsSeen]
  );

  const handleAddStoryPress = useCallback(() => {
    setStoryModalVisible(true);
  }, []);

  const handleNextStory = () => {
    if (
      selectedUserStories &&
      currentStoryIndex < selectedUserStories.length - 1
    ) {
      const nextIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(nextIndex);
      markStoryAsSeen(selectedUserStories[nextIndex].id);
    } else {
      setSelectedUserStories(null);
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  useEffect(() => {
    if (selectedUserStories) {
      const timer = setTimeout(handleNextStory, 5000);
      return () => clearTimeout(timer);
    }
  }, [selectedUserStories, currentStoryIndex]);

  const renderPost = useCallback(
    ({ item }: { item: any }) => (
      <PostCard post={item} onUserPress={handleUserPress} />
    ),
    [handleUserPress]
  );

  const mobileLayout = (
    <>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Framez</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.iconButton, { backgroundColor: colors.background }]}
          >
            <Text style={styles.iconText}>{isDark ? "☀️" : "🌙"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/search")}
            style={[styles.iconButton, { backgroundColor: colors.background }]}
          >
            <Text style={styles.iconText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile")}
            style={styles.avatarContainer}
          >
            {user?.profile_image_url ? (
              <Image
                source={{ uri: user.profile_image_url }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[styles.avatar, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </Text>
              </View>
            )}
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
          colors={["#FF8C42", "#FFD93D"]}
          style={styles.fabGradient}
        >
          <Text style={styles.fabText}>+</Text>
        </LinearGradient>
      </TouchableOpacity>
    </>
  );

  const webLayout = (
    <View style={styles.webContainer}>
      {/* Left Sidebar - Featured Posts */}
      <View style={[styles.sidebar, { borderColor: colors.border }]}>
        <Text style={[styles.sidebarTitle, { color: colors.text }]}>
          Navigation
        </Text>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/(tabs)")}
        >
          <Text style={[styles.navText, { color: colors.text }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/(tabs)/search")}
        >
          <Text style={[styles.navText, { color: colors.text }]}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <Text style={[styles.navText, { color: colors.text }]}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={toggleTheme}>
          <Text style={styles.iconText}>{isDark ? "☀️" : "🌙"}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>{mobileLayout}</View>

      {/* Right Sidebar - Navigation */}

      <View style={[styles.sidebar, { borderColor: colors.border }]}>
        <Text style={[styles.sidebarTitle, { color: colors.text }]}>
          Featured Posts
        </Text>
        <FlatList
          data={posts.slice(0, 5)} // Example featured: top 5 recent
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {isWebLarge ? webLayout : mobileLayout}

      {/* Modals */}
      <CreatePostModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />

      <CreateStoryModal
        visible={storyModalVisible}
        onClose={() => setStoryModalVisible(false)}
      />

      {/* Story Viewer Modal */}
      <Modal visible={!!selectedUserStories} animationType="fade" transparent>
        <View style={styles.storyModalOverlay}>
          {selectedUserStories && (
            <View style={styles.storyViewer}>
              <Image
                source={{
                  uri: selectedUserStories[currentStoryIndex].image_url,
                }}
                style={styles.storyViewerImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.storyCloseButton}
                onPress={() => setSelectedUserStories(null)}
              >
                <Text style={styles.storyCloseText}>×</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.storyPrevButton}
                onPress={handlePrevStory}
              />
              <TouchableOpacity
                style={styles.storyNextButton}
                onPress={handleNextStory}
              />
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webContainer: {
    flexDirection: "row",
    flex: 1,
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
  },
  sidebar: {
    width: 250,
    padding: 16,
    borderWidth: 1,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  navItem: {
    paddingVertical: 12,
  },
  navText: {
    fontSize: 16,
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 18,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  listContent: {
    padding: 12,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  fabText: {
    fontSize: 32,
    color: "#FFF",
    fontWeight: "300",
  },
  storyModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  storyViewer: {
    width: "90%",
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
  },
  storyViewerImage: {
    width: "100%",
    height: "100%",
  },
  storyCloseButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 1,
  },
  storyCloseText: {
    color: "#FFF",
    fontSize: 32,
  },
  storyPrevButton: {
    position: "absolute",
    left: 0,
    width: "40%",
    height: "100%",
  },
  storyNextButton: {
    position: "absolute",
    right: 0,
    width: "40%",
    height: "100%",
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden", // Important for image clipping
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
});
