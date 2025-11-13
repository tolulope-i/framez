import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { StatusBar } from "expo-status-bar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { View, Text } from "react-native";

export default function RootLayout() {
  const { initialize, loading: authLoading } = useAuthStore();
  const { initializeTheme, isDark } = useThemeStore();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        await initializeTheme();

        // Don't wait too long for auth
        const timeout = setTimeout(() => {
          if (!appReady) {
            console.log("Auth timeout, continuing without session");
            setAppReady(true);
          }
        }, 5000);

        await initialize();
        clearTimeout(timeout);
      } catch (error) {
        console.error("App initialization error:", error);
      } finally {
        setAppReady(true);
      }
    };
    initApp();
  }, []); // CHANGED: Remove dependencies to avoid infinite loop

  if (!appReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <LoadingSpinner />
        <Text style={{ marginTop: 20 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}