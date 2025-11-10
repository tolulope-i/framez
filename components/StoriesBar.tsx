import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Story } from '@/types';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/Colors';
import { useStoriesStore } from '@/store/storiesStore';

interface StoriesBarProps {
  onStoryPress: (story: Story) => void;
  onAddStoryPress: () => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({ 
  onStoryPress, 
  onAddStoryPress 
}) => {
  const { isDark } = useThemeStore();
  const { stories } = useStoriesStore();
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Add Story Button */}
        <TouchableOpacity 
          style={styles.storyItem} 
          onPress={onAddStoryPress}
        >
          <View style={[styles.addStoryCircle, { borderColor: colors.primary }]}>
            <Text style={[styles.addStoryText, { color: colors.primary }]}>+</Text>
          </View>
          <Text style={[styles.storyUsername, { color: colors.text }]}>
            Your Story
          </Text>
        </TouchableOpacity>

        {/* Other Stories */}
        {stories.map((story) => (
          <TouchableOpacity
            key={story.id}
            style={styles.storyItem}
            onPress={() => onStoryPress(story)}
          >
            <View style={[
              styles.storyCircle,
              { 
                borderColor: story.seen ? colors.border : colors.primary,
                borderWidth: story.seen ? 2 : 3,
              }
            ]}>
              <Image
                source={{ 
                  uri: story.user?.profile_image_url || 
                       story.user?.avatar_url || 
                       'https://via.placeholder.com/100'
                }}
                style={styles.storyImage}
              />
            </View>
            <Text 
              style={[
                styles.storyUsername, 
                { color: colors.text },
                story.seen && { opacity: 0.7 }
              ]}
              numberOfLines={1}
            >
              {story.user?.name.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  scrollContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 100,
  },
  addStoryCircle: {
    width: 100,
    height: 150,
    borderRadius: 15,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  addStoryText: {
    fontSize: 24,
    fontWeight: '300',
  },
  storyCircle: {
    width: 100,
    height: 150,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    padding: 3,
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  storyUsername: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});