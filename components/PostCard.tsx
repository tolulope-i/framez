import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  Share,
} from "react-native";
import { Post } from "@/types";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";
import { usePostsStore } from "@/store/postsStore";
import { Colors } from "@/constants/Colors";
import { validatePostContent } from "@/utils/validation";
import { ConfirmDialog } from "./ConfirmDialog";
import { Ionicons, Feather } from "@expo/vector-icons";

interface PostCardProps {
  post: Post;
  onUserPress?: (userId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onUserPress }) => {
  const { isDark } = useThemeStore();
  const { user } = useAuthStore();
  const {
    deletePost,
    updatePost,
    likePost,
    unlikePost,
    savePost,
    unsavePost,
    addComment,
  } = usePostsStore();
  const colors = isDark ? Colors.dark : Colors.light;

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editError, setEditError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showOptions, setShowOptions] = useState(false);

  const isOwner = user?.id === post.user_id;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    setShowOptions(false);
    setShowDeleteConfirm(true);
  };

  const performDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      setLoading(true);
      await deletePost(post.id);
    } catch (error: any) {
      if (Platform.OS === "web") {
        alert(error.message ?? "Failed to delete post");
      } else {
        Alert.alert("Error", error.message ?? "Failed to delete post");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    const validationError = validatePostContent(editContent);

    if (validationError) {
      setEditError(validationError);
      return;
    }

    setLoading(true);
    try {
      await updatePost(post.id, editContent.trim());
      setIsEditing(false);
      setEditError("");
      setShowOptions(false);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update post");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      if (post.is_liked) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update like");
    }
  };

  const handleSave = async () => {
    try {
      if (post.is_saved) {
        await unsavePost(post.id);
      } else {
        await savePost(post.id);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update save");
    }
  };

  const handleShare = async () => {
    try {
      const message = `Check out this post from ${post.user?.name} on Framez: ${post.content}`;
      const shareOptions = {
        title: "Framez Post",
        message,
        url: post.image_url,
      };

      if (Platform.OS === "web") {
        if (navigator.share) {
          await navigator.share(shareOptions);
        } else {
          await navigator.clipboard.writeText(
            `${message} ${post.image_url || ""}`
          );
          Alert.alert("Copied to clipboard");
        }
      } else {
        await Share.share(shareOptions);
      }
    } catch (error: any) {
      console.error("Error sharing post:", error);
      Alert.alert("Error", "Failed to share post");
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      await addComment(post.id, commentText.trim());
      setCommentText("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add comment");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  const cancelEdit = () => {
    setEditContent(post.content);
    setEditError("");
    setIsEditing(false);
    setShowOptions(false);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => onUserPress?.(post.user_id)}
          disabled={!onUserPress}
        >
          {post.user?.profile_image_url ? (
            <Image
              source={{ uri: post.user.profile_image_url }}
              style={styles.profileImage}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {post.user?.name?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={[styles.name, { color: colors.text }]}>
              {post.user?.name || "Unknown User"}
            </Text>
            <Text style={[styles.time, { color: colors.textSecondary }]}>
              {formatDate(post.created_at)}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowOptions(true)}
          style={styles.optionsButton}
        >
          <Text style={[styles.optionsText, { color: colors.text }]}>•••</Text>
        </TouchableOpacity>
      </View>

      {/* Image */}
      {post.image_url && (
        <Image
          source={{ uri: post.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      {/* Content */}
      <Text style={[styles.content, { color: colors.text }]}>
        {post.content}
      </Text>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
            <Ionicons
              name={post.is_liked ? "heart" : "heart-outline"}
              size={22}
              color={post.is_liked ? colors.error : colors.text}
            />
            <Text style={[styles.actionCount, { color: colors.textSecondary }]}>
              {post.likes_count || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowComments(!showComments)}
            style={styles.actionButton}
          >
            <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
            <Text style={[styles.actionCount, { color: colors.textSecondary }]}>
              {post.comments_count || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <Feather name="share-2" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleSave} style={styles.actionButton}>
          <Ionicons
            name={post.is_saved ? "bookmark" : "bookmark-outline"}
            size={22}
            color={post.is_saved ? colors.primary : colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      {showComments && (
        <View style={styles.commentsSection}>
          {post.comments?.map((comment) => (
            <View key={comment.id} style={styles.comment}>
              <Text style={[styles.commentAuthor, { color: colors.text }]}>
                {comment.user?.name || "Anonymous"}:
              </Text>
              <Text style={[styles.commentContent, { color: colors.text }]}>
                {comment.content}
              </Text>
            </View>
          ))}
          <TextInput
            style={[
              styles.commentInput,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textSecondary}
            onSubmitEditing={handleAddComment}
          />
        </View>
      )}

      {/* Options Modal */}
      <Modal visible={showOptions} transparent animationType="fade">
        <TouchableOpacity
          style={styles.optionsOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[styles.optionsMenu, { backgroundColor: colors.surface }]}
          >
            {isOwner && (
              <>
                <TouchableOpacity
                  onPress={() => {
                    setIsEditing(true);
                    setShowOptions(false);
                  }}
                  style={styles.optionItem}
                >
                  <Text style={[styles.optionText, { color: colors.text }]}>
                    Edit Post
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  style={styles.optionItem}
                >
                  <Text style={[styles.optionText, { color: colors.error }]}>
                    Delete Post
                  </Text>
                </TouchableOpacity>

                <View
                  style={[styles.separator, { backgroundColor: colors.border }]}
                />
              </>
            )}

            <TouchableOpacity onPress={handleShare} style={styles.optionItem}>
              <Text style={[styles.optionText, { color: colors.text }]}>
                Share Post
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
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={isEditing} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Edit Post
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: editError ? colors.error : colors.border,
                },
              ]}
              value={editContent}
              onChangeText={(text) => {
                setEditContent(text);
                if (editError) setEditError("");
              }}
              multiline
              placeholder="What's on your mind?"
              placeholderTextColor={colors.textSecondary}
              maxLength={500}
              editable={!loading}
            />

            {editError ? (
              <Text style={[styles.error, { color: colors.error }]}>
                {editError}
              </Text>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={cancelEdit}
                disabled={loading}
                style={[styles.button, { backgroundColor: colors.border }]}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdate}
                disabled={loading}
                style={[styles.button, { backgroundColor: colors.primary }]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={[styles.buttonText, { color: "#FFF" }]}>
                    Update
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={performDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userDetails: {
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  time: {
    fontSize: 12,
  },
  optionsButton: {
    padding: 8,
  },
  optionsText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  image: {
    width: "100%",
    height: 400,
    borderRadius: 8,
    marginBottom: 12,
  },
  content: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionCount: {
    fontSize: 14,
    fontWeight: "500",
  },
  commentsSection: {
    marginTop: 8,
  },
  comment: {
    flexDirection: "row",
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  commentAuthor: {
    fontWeight: "600",
    marginRight: 4,
  },
  commentContent: {
    flex: 1,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 8,
  },
  error: {
    fontSize: 13,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
});
