import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PostCard } from '@/components/PostCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import { usePostsStore } from '@/store/postsStore';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { userPosts, loading, fetchUserPosts } = usePostsStore();
  const { isDark } = useThemeStore();
  const colors = isDark ? Colors.dark : Colors.light;

  const [activeTab, setActiveTab] = useState<'posts' | 'videos'>('posts');

  useEffect(() => {
    if (user) {
      fetchUserPosts(user.id);
    }
  }, [user]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  if (loading && userPosts.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={[styles.logoutButton, { color: colors.error }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={userPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.profileHeader}>
              <LinearGradient
                colors={['#FF8C42', '#FFD93D', '#4CAF50', '#2196F3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.coverGradient}
              />
              
              <View style={styles.profileInfo}>
                <View style={[styles.avatarLarge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarLargeText}>
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>

                <Text style={[styles.name, { color: colors.text }]}>
                  {user?.name || 'User'}
                </Text>

                <Text style={[styles.email, { color: colors.textSecondary }]}>
                  {user?.email}
                </Text>

                <View style={styles.statsContainer}>
                  <View style={styles.stat}>
                    <Text style={[styles.statNumber, { color: colors.text }]}>
                      {userPosts.length}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Posts
                    </Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.statNumber, { color: colors.text }]}>
                      0
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Followers
                    </Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.statNumber, { color: colors.text }]}>
                      0
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Following
                    </Text>
                  </View>
                </View>

                <View style={styles.tabsContainer}>
                  <TouchableOpacity
                    onPress={() => setActiveTab('posts')}
                    style={[
                      styles.tab,
                      activeTab === 'posts' && {
                        backgroundColor: colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        {
                          color:
                            activeTab === 'posts' ? '#FFF' : colors.textSecondary,
                        },
                      ]}
                    >
                      Posts {userPosts.length}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setActiveTab('videos')}
                    style={[
                      styles.tab,
                      activeTab === 'videos' && {
                        backgroundColor: colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        {
                          color:
                            activeTab === 'videos' ? '#FFF' : colors.textSecondary,
                        },
                      ]}
                    >
                      Videos 0
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {userPosts.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No posts yet. Start sharing your moments!
                </Text>
              </View>
            )}
          </View>
        }
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    fontSize: 28,
    fontWeight: '300',
  },
  logoutButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  profileHeader: {
    marginBottom: 24,
  },
  coverGradient: {
    height: 150,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: -50,
    paddingHorizontal: 20,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
    marginBottom: 16,
  },
  avatarLargeText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFF',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});