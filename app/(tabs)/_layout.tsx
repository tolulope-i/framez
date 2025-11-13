import { Tabs, useRouter, useSegments } from "expo-router";
import { Text, View, Dimensions, Platform } from "react-native";
import { useThemeStore } from "@/store/themeStore";
import { Colors } from "@/constants/Colors";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useRef } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function TabsLayout() {
  const { isDark } = useThemeStore();
  const { user, loading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const colors = isDark ? Colors.dark : Colors.light;
  const hasNavigated = useRef(false); // ADDED: Prevent multiple navigations

  const windowWidth = Dimensions.get("window").width;
  const isWebLarge = Platform.OS === "web" && windowWidth > 768;

  useEffect(() => {
    if (loading) return;
    
    // CHANGED: Only navigate once when user is not authenticated
    if (!user && segments[0] === "(tabs)" && !hasNavigated.current) {
      hasNavigated.current = true;
      setTimeout(() => {
        router.replace("/(auth)/landing");
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

  if (!user) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
          display: isWebLarge ? "none" : "flex",
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>🔍</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
}