import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { PostCard } from "@/components/PostCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuthStore } from "@/store/authStore";
import { usePostsStore } from "@/store/postsStore";
import { useUserStore } from "@/store/userStore";
import { useThemeStore } from "@/store/themeStore";
import { Colors } from "@/constants/Colors";
import { LinearGradient } from "expo-linear-gradient";
import { Post } from "@/types";

type ProfileTab = "posts" | "images" | "saved";

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { userPosts, savedPosts, fetchUserPosts, fetchSavedPosts } =
    usePostsStore();
  const { updateProfile, uploadProfileImage } = useUserStore();
  const { isDark } = useThemeStore();
  const colors = isDark ? Colors.dark : Colors.light;

  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    website: user?.website || "",
    location: user?.location || "",
  });

  const loadProfileData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (activeTab === "posts") {
        await fetchUserPosts(user.id);
      } else if (activeTab === "saved") {
        await fetchSavedPosts();
      }
    } catch (error) {
      console.error("Failed to load profile data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, activeTab, fetchUserPosts, fetchSavedPosts]);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user, activeTab, loadProfileData]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error: any) {
            Alert.alert("Error", error.message);
          }
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    setEditForm({
      name: user?.name || "",
      bio: user?.bio || "",
      website: user?.website || "",
      location: user?.location || "",
    });
    setShowEditModal(true);
    setShowOptions(false);
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      await updateProfile(editForm);
      setShowEditModal(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProfileImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Camera roll permissions are needed to upload images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        await uploadProfileImage(result.assets[0].uri);
        Alert.alert("Success", "Profile image updated successfully");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to upload profile image");
    } finally {
      setLoading(false);
      setShowOptions(false);
    }
  };

  const getDisplayData = () => {
    switch (activeTab) {
      case "posts":
        return userPosts;
      case "images":
        return userPosts.filter((post) => post.image_url);
      case "saved":
        return savedPosts;
      default:
        return [];
    }
  };

  const renderPost = useCallback(
    ({ item }: { item: Post }) => <PostCard post={item} />,
    []
  );

  const renderImageGrid = useCallback(
    ({ item }: { item: Post }) => (
      <TouchableOpacity style={styles.imageGridItem}>
        <Image
          source={{ uri: item.image_url }}
          style={styles.gridImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    ),
    []
  );

  const displayData = getDisplayData();

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {user.name}
        </Text>
        <TouchableOpacity onPress={() => setShowOptions(true)}>
          <Text style={[styles.optionsButton, { color: colors.text }]}>
            •••
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={["#FF8C42", "#FFD93D", "#4CAF50", "#2196F3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coverGradient}
          />

          <View style={styles.profileInfo}>
            {/* Profile Image */}
            <TouchableOpacity
              onPress={handleUploadProfileImage}
              style={styles.profileImageContainer}
            >
              {user.profile_image_url ? (
                <Image
                  source={{ uri: user.profile_image_url }}
                  style={styles.profileImage}
                />
              ) : (
                <View
                  style={[
                    styles.profileImage,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.profileImageText}>
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </Text>
                </View>
              )}
              <View style={styles.editImageOverlay}>
                <Text style={styles.editImageText}>📷</Text>
              </View>
            </TouchableOpacity>

            {/* User Info */}
            <Text style={[styles.name, { color: colors.text }]}>
              {user.name}
            </Text>

            {user.bio && (
              <Text style={[styles.bio, { color: colors.textSecondary }]}>
                {user.bio}
              </Text>
            )}

            <View style={styles.userDetails}>
              {user.website && (
                <Text style={[styles.detail, { color: colors.primary }]}>
                  🌐 {user.website}
                </Text>
              )}
              {user.location && (
                <Text style={[styles.detail, { color: colors.textSecondary }]}>
                  📍 {user.location}
                </Text>
              )}
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.stat}>
                <Text style={[styles.statNumber, { color: colors.text }]}>
                  {userPosts.length}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Posts
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statNumber, { color: colors.text }]}>
                  {user.followers_count || 0}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Followers
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statNumber, { color: colors.text }]}>
                  {user.following_count || 0}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Following
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View
          style={[styles.tabsContainer, { backgroundColor: colors.surface }]}
        >
          {(["posts", "images", "saved"] as ProfileTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tab,
                activeTab === tab && {
                  borderBottomColor: colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === tab ? colors.primary : colors.textSecondary,
                  },
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {loading && displayData.length === 0 ? (
          <LoadingSpinner />
        ) : activeTab === "images" ? (
          <FlatList
            data={displayData}
            keyExtractor={(item) => item.id}
            renderItem={renderImageGrid}
            numColumns={3}
            contentContainerStyle={styles.gridContent}
            scrollEnabled={false}
          />
        ) : (
          <FlatList
            data={displayData}
            keyExtractor={(item) => item.id}
            renderItem={renderPost}
            contentContainerStyle={styles.listContent}
            scrollEnabled={false}
          />
        )}

        {displayData.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {activeTab === "posts" &&
                "No posts yet. Start sharing your moments!"}
              {activeTab === "images" &&
                "No images yet. Share your first photo!"}
              {activeTab === "saved" &&
                "No saved posts yet. Start saving your favorite content!"}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Options Modal */}
      <Modal visible={showOptions} transparent animationType="fade">
        <TouchableOpacity
          style={styles.optionsOverlay}
          onPress={() => setShowOptions(false)}
        >
          <View
            style={[styles.optionsMenu, { backgroundColor: colors.surface }]}
          >
            <TouchableOpacity
              onPress={handleEditProfile}
              style={styles.optionItem}
            >
              <Text style={[styles.optionText, { color: colors.text }]}>
                Edit Profile
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleUploadProfileImage}
              style={styles.optionItem}
            >
              <Text style={[styles.optionText, { color: colors.text }]}>
                Change Profile Photo
              </Text>
            </TouchableOpacity>
            <View
              style={[styles.separator, { backgroundColor: colors.border }]}
            />
            <TouchableOpacity onPress={handleLogout} style={styles.optionItem}>
              <Text style={[styles.optionText, { color: colors.error }]}>
                Logout
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowOptions(false)}
              style={styles.optionItem}
            >
              <Text
                style={[styles.optionText, { color: colors.textSecondary }]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Edit Profile
            </Text>

            <ScrollView style={styles.editForm}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={editForm.name}
                  onChangeText={(text) =>
                    setEditForm((prev) => ({ ...prev, name: text }))
                  }
                  placeholder="Your name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Bio</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.border,
                      minHeight: 80,
                    },
                  ]}
                  value={editForm.bio}
                  onChangeText={(text) =>
                    setEditForm((prev) => ({ ...prev, bio: text }))
                  }
                  placeholder="Tell us about yourself..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Website
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={editForm.website}
                  onChangeText={(text) =>
                    setEditForm((prev) => ({ ...prev, website: text }))
                  }
                  placeholder="https://example.com"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Location
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={editForm.location}
                  onChangeText={(text) =>
                    setEditForm((prev) => ({ ...prev, location: text }))
                  }
                  placeholder="Your location"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                disabled={loading}
                style={[styles.button, { backgroundColor: colors.border }]}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateProfile}
                disabled={loading}
                style={[styles.button, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.buttonText, { color: "#FFF" }]}>
                  {loading ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    fontSize: 18,
    fontWeight: "bold",
  },
  optionsButton: {
    fontSize: 20,
    fontWeight: "bold",
    padding: 8,
  },
  profileHeader: {
    marginBottom: 0,
  },
  coverGradient: {
    height: 120,
  },
  profileInfo: {
    alignItems: "center",
    marginTop: -40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFF",
  },
  profileImageText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFF",
  },
  editImageOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  editImageText: {
    fontSize: 16,
    color: "#FFF",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  bio: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 20,
  },
  userDetails: {
    alignItems: "center",
    marginBottom: 20,
  },
  detail: {
    fontSize: 14,
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 30,
  },
  stat: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    padding: 12,
  },
  gridContent: {
    padding: 1,
  },
  imageGridItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 1,
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  optionsOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  optionsMenu: {
    width: "80%",
    borderRadius: 12,
    padding: 8,
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  separator: {
    height: 1,
    marginVertical: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  editForm: {
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
