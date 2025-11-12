import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useThemeStore } from "@/store/themeStore";
import { usePostsStore } from "@/store/postsStore";
import { Colors } from "@/constants/Colors";
import { LinearGradient } from "expo-linear-gradient";
import { validatePostContent } from "@/utils/validation";
interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  onClose,
}) => {
  const { isDark } = useThemeStore();
  const { createPost } = usePostsStore();
  const colors = isDark ? Colors.dark : Colors.light;

  const [content, setContent] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [contentError, setContentError] = useState("");

  const pickImage = async () => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Sorry, we need camera roll permissions to upload images.",
        [{ text: "OK" }]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      exif: false,
    });

    if (!result.canceled && result.assets[0]) {
      const selectedImage = result.assets[0];

      if (selectedImage.fileSize && selectedImage.fileSize > 10 * 1024 * 1024) {
        Alert.alert("Error", "Image size should be less than 10MB");
        return;
      }

      setImageUri(selectedImage.uri);
    }
  } catch (error) {
    console.error("Error picking image:", error);
    Alert.alert("Error", "Failed to pick image. Please try again.");
  }
};


  const handleSubmit = async () => {
    const contentValidation = validatePostContent(content);

    if (contentValidation) {
      setContentError(contentValidation);
      return;
    }

    if (!content.trim() && !imageUri) {
      setContentError("Please add some content or an image to your post");
      return;
    }

    setLoading(true);
    try {
      await createPost(content.trim(), imageUri || undefined);
      setContent("");
      setImageUri(null);
      setContentError("");
      onClose();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return; 

    setContent("");
    setImageUri(null);
    setContentError("");
    onClose();
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    if (contentError) {
      setContentError("");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
            },
          ]}
        >
          {/* Header */}
          <LinearGradient colors={["#FF8C42", "#FFD93D"]} style={styles.header}>
            <TouchableOpacity onPress={handleClose} disabled={loading}>
              <Text style={styles.headerButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Post</Text>
            <View style={{ width: 60 }} />
          </LinearGradient>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Content Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: contentError ? colors.error : colors.border,
                  },
                ]}
                value={content}
                onChangeText={handleContentChange}
                placeholder="What's on your mind?"
                placeholderTextColor={colors.textSecondary}
                multiline
                maxLength={500}
                editable={!loading}
              />
              <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                {content.length}/500
              </Text>
              {contentError ? (
                <Text style={[styles.error, { color: colors.error }]}>
                  {contentError}
                </Text>
              ) : null}
            </View>

            {/* Image Preview */}
            {imageUri && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.image}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => setImageUri(null)}
                  disabled={loading}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Add Image Button */}
            <TouchableOpacity
              onPress={pickImage}
              disabled={loading}
              style={[
                styles.imageButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  opacity: loading ? 0.6 : 1,
                },
              ]}
            >
              <Text style={[styles.imageButtonText, { color: colors.primary }]}>
                {imageUri ? "📷 Change Image" : "📷 Add Image"}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.submitButtonContainer}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading || (!content.trim() && !imageUri)}
              style={[
                styles.submitButton,
                {
                  opacity: loading || (!content.trim() && !imageUri) ? 0.6 : 1,
                },
              ]}
            >
              <LinearGradient
                colors={['#FF6B00', '#ffffff', '#FFD84D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Post</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  container: {
    height: "90%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  headerButton: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
  error: {
    fontSize: 13,
    marginTop: 8,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 300,
  },
  removeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  imageButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    marginBottom: 20,
  },
  imageButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  submitButtonContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  submitButtonGradient: {
    padding: 18,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
});
