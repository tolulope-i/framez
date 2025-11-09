import React, { useState } from 'react';
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
} from 'react-native';
import { Post } from '@/types';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { usePostsStore } from '@/store/postsStore';
import { Colors } from '@/constants/Colors';
import { validatePostContent } from '@/utils/validation';

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { isDark } = useThemeStore();
  const { user } = useAuthStore();
  const { deletePost, updatePost } = usePostsStore();
  const colors = isDark ? Colors.dark : Colors.light;

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editError, setEditError] = useState('');
  const [loading, setLoading] = useState(false);

  const isOwner = user?.id === post.user_id;

  const handleDelete = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deletePost(post.id);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete post');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
      setEditError('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  const cancelEdit = () => {
    setEditContent(post.content);
    setEditError('');
    setIsEditing(false);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {post.user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.name, { color: colors.text }]}>
              {post.user?.name || 'Unknown User'}
            </Text>
            <Text style={[styles.time, { color: colors.textSecondary }]}>
              {formatDate(post.created_at)}
            </Text>
          </View>
        </View>

        {isOwner && (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              style={styles.actionButton}
              disabled={loading}
            >
              <Text style={[styles.actionText, { color: colors.primary }]}>
                Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleDelete} 
              style={styles.actionButton}
              disabled={loading}
            >
              <Text style={[styles.actionText, { color: colors.error }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        )}
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

      {/* Edit Modal */}
      <Modal visible={isEditing} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
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
                if (editError) setEditError('');
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
                  <Text style={[styles.buttonText, { color: '#FFF' }]}>
                    Update
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  userDetails: {
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  time: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  error: {
    fontSize: 13,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});