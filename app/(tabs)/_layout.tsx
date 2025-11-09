import { Tabs, useRouter } from 'expo-router';
import { Text } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { View } from 'react-native';

export default function TabsLayout() {
  const { isDark } = useThemeStore();
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const colors = isDark ? Colors.dark : Colors.light;

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/(auth)/landing');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        <LoadingSpinner />
      </View>
    );
  }

  if (!user) {
    return null; // Will redirect due to useEffect
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
}