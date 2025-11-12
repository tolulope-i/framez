import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { Colors } from "@/constants/Colors";
import { validatePassword } from "@/utils/validation";

export default function ResetPasswordScreen() {
  const { updatePassword, verifyOTP, session } = useAuthStore();
  const { isDark } = useThemeStore();
  const colors = isDark ? Colors.dark : Colors.light;
  const params = useLocalSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isTokenVerified, setIsTokenVerified] = useState(false);

  useEffect(() => {
    const handleTokenVerification = async () => {
      let tokenHash = "";
      let email = "";

      if (params.access_token_hash && params.email) {
        tokenHash = params.access_token_hash as string;
        email = params.email as string;
      }
      else {
        const url = await Linking.getInitialURL();
        if (url) {
          const parsed = new URL(url);
          tokenHash = parsed.searchParams.get("access_token_hash") || "";
          email = parsed.searchParams.get("email") || "";
        }
      }

      if (tokenHash && email) {
        setVerifying(true);
        try {
          await verifyOTP(email, tokenHash);
          setIsTokenVerified(true);
          Alert.alert("Success", "Ready to set new password!");
        } catch (err: any) {
          Alert.alert("Error", err.message);
          router.replace("/(auth)/forgot-password");
        } finally {
          setVerifying(false);
        }
      } else if (session) {
        setIsTokenVerified(true); 
      } else {
        router.replace("/(auth)/forgot-password");
      }
    };

    handleTokenVerification();
  }, [params, session, verifyOTP]);

  const handleResetPassword = async () => {
    const passwordError = validatePassword(password);
    let confirmPasswordError = "";

    if (password !== confirmPassword) {
      confirmPasswordError = "Passwords do not match";
    }

    setErrors({
      password: passwordError || "",
      confirmPassword: confirmPasswordError || "",
    });

    if (passwordError || confirmPasswordError) {
      return;
    }

    if (!session && !isTokenVerified) {
      Alert.alert(
        "Session Expired",
        "Your reset session has expired. Please request a new password reset link.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(auth)/forgot-password"),
          },
        ]
      );
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      Alert.alert("Success", "Your password has been updated successfully!", [
        {
          text: "OK",
          onPress: () => router.replace("/(auth)/signin"),
        },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: colors.text }}>Verifying reset link...</Text>
      </View>
    );
  }

  if (!isTokenVerified && !session) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: colors.text }}>Redirecting...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <LinearGradient
        colors={isDark ? ["#1A1A1A", "#2A2A2A"] : ["#F5F5F5", "#FFFFFF"]}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={[styles.backText, { color: colors.text }]}>
              ← Back
            </Text>
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <LinearGradient colors={["#FF8C42", "#FFD93D"]} style={styles.icon}>
              <Text style={styles.iconText}>🔑</Text>
            </LinearGradient>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            Create New Password
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your new password below
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>
                New Password
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: errors.password ? colors.error : colors.border,
                  },
                ]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrors((prev) => ({ ...prev, password: "" }));
                }}
                placeholder="Enter your new password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                autoCapitalize="none"
              />
              {errors.password ? (
                <Text style={[styles.error, { color: colors.error }]}>
                  {errors.password}
                </Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>
                Confirm New Password
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: errors.confirmPassword
                      ? colors.error
                      : colors.border,
                  },
                ]}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }}
                placeholder="Confirm your new password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                autoCapitalize="none"
              />
              {errors.confirmPassword ? (
                <Text style={[styles.error, { color: colors.error }]}>
                  {errors.confirmPassword}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={loading}
              style={styles.submitButton}
            >
              <LinearGradient
                colors={["#FF6B00", "#ffffff", "#FFD84D"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.textBlack}>
                  {loading ? "Updating Password..." : "Update Password"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text
                style={[styles.footerText, { color: colors.textSecondary }]}
              >
                Remember your password?{" "}
                <Text
                  style={{ color: colors.primary, fontWeight: "600" }}
                  onPress={() => router.push("/(auth)/signin")}
                >
                  Sign In
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
    fontWeight: "600",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  icon: {
    width: 100,
    height: 100,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  error: {
    fontSize: 13,
    marginTop: 4,
  },
  submitButton: {
    marginTop: 12,
  },
  buttonGradient: {
    padding: 18,
    borderRadius: 50,
    alignItems: "center",
  },
  textBlack: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
  footer: {
    alignItems: "center",
    marginTop: 8,
  },
  footerText: {
    fontSize: 15,
  },
});
