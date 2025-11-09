import React, { useState } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/Colors';
import { validateEmail } from '@/utils/validation';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuthStore();
  const { isDark } = useThemeStore();
  const colors = isDark ? Colors.dark : Colors.light;

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleResetPassword = async () => {
    const error = validateEmail(email);
    setEmailError(error || '');

    if (error) {
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      Alert.alert(
        'Check Your Email',
        'We have sent you a password reset link. Please check your email.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={isDark ? ['#1A1A1A', '#2A2A2A'] : ['#F5F5F5', '#FFFFFF']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={[styles.backText, { color: colors.text }]}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#FF8C42', '#FFD93D']}
              style={styles.icon}
            >
              <Text style={styles.iconText}>🔒</Text>
            </LinearGradient>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            Reset Your Password
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your email address and we will send you a link to reset your
            password
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: emailError ? colors.error : colors.border,
                  },
                ]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError('');
                }}
                placeholder="Enter your email"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {emailError ? (
                <Text style={[styles.error, { color: colors.error }]}>
                  {emailError}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={loading}
              style={styles.submitButton}
            >
              <LinearGradient
                colors={['#FF8C42', '#FFD93D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
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
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    width: 100,
    height: 100,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
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
    marginTop: 8,
  },
  buttonGradient: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});