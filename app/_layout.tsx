import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { StatusBar } from "expo-status-bar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { View, Text, TouchableOpacity } from "react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function RootLayout() {
  const {
    initialize,
    loading: authLoading,
    connectionError,
    clearError,
  } = useAuthStore();
  const { initializeTheme, isDark } = useThemeStore();
  const [appReady, setAppReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
     try {
        console.log("🚀 Initializing app...");
        await initializeTheme();
        console.log("✅ Theme initialized");
        await initialize();
        console.log("✅ Auth initialized");
        setInitError(null);
      } catch (error: any) {
        console.error("❌ App initialization failed:", error);
        setInitError(error.message || "Failed to initialize app");
      } finally {
        setAppReady(true);
      }
    };
    initApp();
  }, [initialize, initializeTheme]);

  if (!appReady) {
    return (
      <View style={{ flex: 1 }}>
        <LoadingSpinner />
      </View>
    );
  }

  if (initError || connectionError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
          backgroundColor: "#F5F5F5",
        }}
      >
        <Text
          style={{
            fontSize: 18,
            textAlign: "center",
            marginBottom: 20,
            color: "#666",
          }}
        >
          {initError || connectionError}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setInitError(null);
            clearError();
            initialize();
          }}
          style={{ backgroundColor: "#FF6B00", padding: 15, borderRadius: 8 }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ErrorBoundary>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </ErrorBoundary>
    </>
  );
}
