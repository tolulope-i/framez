import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { StatusBar } from 'expo-status-bar';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { View } from 'react-native';

export default function RootLayout() {
  const { initialize, loading: authLoading, user } = useAuthStore();
  const { initializeTheme, isDark } = useThemeStore();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        await initializeTheme();
        await initialize();
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setAppReady(true);
      }
    };

    initApp();
  }, []);

  // Show loading while initializing
  if (!appReady || authLoading) {
    return (
      <View style={{ flex: 1 }}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}