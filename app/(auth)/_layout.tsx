import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { View } from 'react-native';

export default function AuthLayout() {
  const { user, loading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const hasNavigated = useRef(false); // ADDED: Prevent multiple navigations

  useEffect(() => {
    if (loading) return;
    
    // CHANGED: Only navigate once when user is authenticated
    if (user && segments[0] === '(auth)' && !hasNavigated.current) {
      hasNavigated.current = true;
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
    }
  }, [user, loading, segments]);

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
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}