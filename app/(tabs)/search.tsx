import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useThemeStore } from "@/store/themeStore";
import { useUserStore } from "@/store/userStore";
import { usePostsStore } from "@/store/postsStore";
import { useAuthStore } from "@/store/authStore";
import { Colors } from "@/constants/Colors";
import { User, Post } from "@/types";
import { PostCard } from "@/components/PostCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { supabase } from "@/services/supabase";

type SearchTab = "users" | "posts";

export default function SearchScreen() {
  const { isDark } = useThemeStore();
  const {
    users,
    searchUsers,
    followUser,
    unfollowUser,
    fetchUserProfile,
    loading: userLoading,
  } = useUserStore();
  const { posts } = usePostsStore();
  const { user: currentUser } = useAuthStore();
  const colors = isDark ? Colors.dark : Colors.light;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("users");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchedPosts, setSearchedPosts] = useState<Post[]>([]);
  const [postLoading, setPostLoading] = useState(false);

  
  const searchPosts = useCallback(
    async (query: string) => {
      setPostLoading(true);
      try {
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
          .ilike("content", `%${query}%`)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const transformedPosts: Post[] = (data || []).map((post: any) => ({
          ...post,
          likes_count: post.likes?.length || 0,
          comments_count: post.comments?.length || 0,
          is_liked:
            post.likes?.some((like: any) => like.user_id === currentUser?.id) ||
            false,
          is_saved:
            post.saved_posts?.some(
              (saved: any) => saved.user_id === currentUser?.id
            ) || false,
        }));

        setSearchedPosts(transformedPosts);
      } catch (error) {
        console.error("Search posts error:", error);
      } finally {
        setPostLoading(false);
      }
    },
    [currentUser?.id]
  );
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      if (activeTab === "users") {
        searchUsers(debouncedQuery);
      } else if (activeTab === "posts") {
        searchPosts(debouncedQuery);
      }
    } else {
      setSearchedPosts([]);
    }
  }, [debouncedQuery, activeTab, searchUsers, searchPosts]);

  const handleUserPress = useCallback(
    (userId: string) => {
      fetchUserProfile(userId).then(() => {
        router.push("/(tabs)/profile");
      });
    },
    [fetchUserProfile]
  );

  const handlePostUserPress = useCallback((userId: string) => {
    router.push("/(tabs)/profile");
  }, []);

  const handleFollowToggle = useCallback(
    async (user: User) => {
      try {
        if (user.is_following) {
          await unfollowUser(user.id);
        } else {
          await followUser(user.id);
        }
      } catch (error) {
        console.error("Follow/unfollow error:", error);
      }
    },
    [followUser, unfollowUser]
  );

  const renderUserItem = useCallback(
    ({ item }: { item: User }) => (
      <TouchableOpacity
        style={[styles.userItem, { backgroundColor: colors.surface }]}
        onPress={() => handleUserPress(item.id)}
      >
        {item.profile_image_url ? (
          <Image
            source={{ uri: item.profile_image_url }}
            style={styles.avatarImage}
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {item.name?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.userStats, { color: colors.textSecondary }]}>
            {item.followers_count || 0} followers • {item.posts_count || 0}{" "}
            posts
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleFollowToggle(item)}
          style={[
            styles.followButton,
            {
              backgroundColor: item.is_following
                ? colors.border
                : colors.primary,
              borderColor: colors.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.followButtonText,
              { color: item.is_following ? colors.text : "#FFF" },
            ]}
          >
            {item.is_following ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [colors, handleUserPress, handleFollowToggle]
  );

  const renderPostItem = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard post={item} onUserPress={handlePostUserPress} />
    ),
    [handlePostUserPress]
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {debouncedQuery.trim()
          ? `No ${activeTab} found for "${debouncedQuery}"`
          : activeTab === "users"
          ? "Search for users..."
          : "Explore posts from the community"}
      </Text>
    </View>
  );

  const displayPosts = debouncedQuery.trim() ? searchedPosts : posts;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Search Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search users or posts..."
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          onPress={() => setActiveTab("users")}
          style={[
            styles.tab,
            activeTab === "users" && { borderBottomColor: colors.primary },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "users" ? colors.primary : colors.textSecondary,
              },
            ]}
          >
            Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("posts")}
          style={[
            styles.tab,
            activeTab === "posts" && { borderBottomColor: colors.primary },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "posts" ? colors.primary : colors.textSecondary,
              },
            ]}
          >
            Posts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === "users" ? (
        userLoading && debouncedQuery.trim() ? (
          <LoadingSpinner />
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            maxToRenderPerBatch={15}
            windowSize={10}
          />
        )
      ) : postLoading && debouncedQuery.trim() ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={displayPosts}
          keyExtractor={(item) => item.id}
          renderItem={renderPostItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={15}
          windowSize={10}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    flexGrow: 1,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  userStats: {
    fontSize: 14,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: "600",
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
    paddingHorizontal: 40,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
});
