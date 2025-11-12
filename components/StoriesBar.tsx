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
import { useAuthStore } from '@/store/authStore';

interface StoriesBarProps {
  onStoryPress: (stories: Story[]) => void;
  onAddStoryPress: () => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({
  onStoryPress,
  onAddStoryPress
}) => {
  const { isDark } = useThemeStore();
  const { stories } = useStoriesStore();
  const { user } = useAuthStore();
  const colors = isDark ? Colors.dark : Colors.light;
  const groupedStories = stories.reduce((acc: Record<string, Story[]>, story) => {
    const userId = story.user_id;
    if (!acc[userId]) acc[userId] = [];
    acc[userId].push(story);
    return acc;
  }, {});
  const sortedGroups = Object.entries(groupedStories)
    .sort(([, aStories], [, bStories]) => {
      const aLatest = new Date(Math.max(...aStories.map(s => new Date(s.created_at).getTime())));
      const bLatest = new Date(Math.max(...bStories.map(s => new Date(s.created_at).getTime())));
      return bLatest.getTime() - aLatest.getTime();
    });
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
            Add Story
          </Text>
        </TouchableOpacity>
        {/* Own Stories if exist */}
        {groupedStories[user?.id || ''] && (
          <TouchableOpacity
            style={styles.storyItem}
            onPress={() => onStoryPress(groupedStories[user?.id || ''])}
          >
            <View style={[
              styles.storyCircle,
              {
                borderColor: groupedStories[user?.id || ''].some(s => !s.seen) ? colors.primary : colors.border,
                borderWidth: groupedStories[user?.id || ''].some(s => !s.seen) ? 3 : 2,
              }
            ]}>
              {user?.profile_image_url ? (
                <Image
                  source={{ uri: user.profile_image_url }}
                  style={styles.storyImage}
                />
              ) : (
                <View style={[styles.storyImage, { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={styles.storyLetterText}>
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.storyUsername,
                { color: colors.text },
                !groupedStories[user?.id || ''].some(s => !s.seen) && { opacity: 0.7 }
              ]}
              numberOfLines={1}
            >
              You
            </Text>
          </TouchableOpacity>
        )}

        {sortedGroups.filter(([userId]) => userId !== user?.id).map(([userId, userStories]) => {
          const storyUser = userStories[0].user;
          const hasUnseen = userStories.some(s => !s.seen);
          return (
            <TouchableOpacity
              key={userId}
              style={styles.storyItem}
              onPress={() => onStoryPress(userStories)}
            >
              <View style={[
                styles.storyCircle,
                {
                  borderColor: hasUnseen ? colors.primary : colors.border,
                  borderWidth: hasUnseen ? 3 : 2,
                }
              ]}>
                {storyUser?.profile_image_url ? (
                  <Image
                    source={{ uri: storyUser.profile_image_url }}
                    style={styles.storyImage}
                  />
                ) : (
                  <View style={[styles.storyImage, { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={styles.storyLetterText}>
                      {storyUser?.name?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.storyUsername,
                  { color: colors.text },
                  !hasUnseen && { opacity: 0.7 }
                ]}
                numberOfLines={1}
              >
                {storyUser?.name.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
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
    width: 70,
  },
  addStoryCircle: {
    width: 70,
    height: 70,
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
    width: 70,
    height: 70,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    padding: 3,
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  storyLetterText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  storyUsername: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});