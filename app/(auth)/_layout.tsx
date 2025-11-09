import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { View } from 'react-native';

export default function AuthLayout() {
  const { user, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)');
    }
  }, [user, loading]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="landing" />
      <Stack.Screen name="signin" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}