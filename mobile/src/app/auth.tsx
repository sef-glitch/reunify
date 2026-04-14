import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Mail, Lock, Eye, EyeOff, ChevronRight, Play } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function AuthScreen() {
  const { signIn, signUp, seedDemoData } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTryDemo = async () => {
    setError(null);
    setIsDemoLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Create a demo account with random email
      const demoEmail = `demo_${Date.now()}@reunify.app`;
      const demoPassword = 'demo123456';

      const result = await signUp(demoEmail, demoPassword);

      if (result.success) {
        // Seed demo data after successful signup
        setTimeout(() => {
          seedDemoData();
        }, 100);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setError(result.error ?? 'Could not create demo account');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (e) {
      setError('An unexpected error occurred');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password);

      if (!result.success) {
        setError(result.error ?? 'Something went wrong');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      setError('An unexpected error occurred');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
    setConfirmPassword('');
    Haptics.selectionAsync();
  };

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 px-6 justify-center">
            {/* Logo & Title */}
            <Animated.View
              entering={FadeInDown.duration(600).delay(100)}
              className="items-center mb-10"
            >
              <View className="w-20 h-20 rounded-2xl bg-teal-600 dark:bg-teal-500 items-center justify-center mb-5 shadow-lg">
                <Shield size={40} color="#fff" />
              </View>
              <Text className="text-3xl font-bold text-stone-800 dark:text-stone-100">
                Reunify
              </Text>
              <Text className="text-stone-500 dark:text-stone-400 text-center mt-2 text-base">
                Organize your family court case
              </Text>
            </Animated.View>

            {/* Form */}
            <Animated.View
              entering={FadeInUp.duration(600).delay(200)}
              className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200/60 dark:border-stone-800 shadow-sm"
            >
              <Text className="text-xl font-semibold text-stone-800 dark:text-stone-100 mb-6">
                {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </Text>

              {/* Error Message */}
              {error && (
                <View className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4">
                  <Text className="text-red-600 dark:text-red-400 text-sm text-center">
                    {error}
                  </Text>
                </View>
              )}

              {/* Email */}
              <View className="mb-4">
                <View className="flex-row items-center bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3.5">
                  <Mail size={20} color="#6b7280" />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email address"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="flex-1 ml-3 text-stone-800 dark:text-stone-100 text-base"
                  />
                </View>
              </View>

              {/* Password */}
              <View className="mb-4">
                <View className="flex-row items-center bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3.5">
                  <Lock size={20} color="#6b7280" />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    className="flex-1 ml-3 text-stone-800 dark:text-stone-100 text-base"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} className="p-1">
                    {showPassword ? (
                      <EyeOff size={20} color="#6b7280" />
                    ) : (
                      <Eye size={20} color="#6b7280" />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Confirm Password (signup only) */}
              {mode === 'signup' && (
                <View className="mb-4">
                  <View className="flex-row items-center bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3.5">
                    <Lock size={20} color="#6b7280" />
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm password"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      className="flex-1 ml-3 text-stone-800 dark:text-stone-100 text-base"
                    />
                  </View>
                </View>
              )}

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={isLoading}
                className="bg-teal-600 dark:bg-teal-500 rounded-xl py-4 flex-row items-center justify-center active:opacity-80 mt-2"
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text className="text-white font-semibold text-base">
                      {mode === 'signin' ? 'Sign In' : 'Create Account'}
                    </Text>
                    <ChevronRight size={20} color="#fff" />
                  </>
                )}
              </Pressable>

              {/* Toggle Mode */}
              <Pressable onPress={toggleMode} className="mt-5 py-2 active:opacity-60">
                <Text className="text-center text-stone-500 dark:text-stone-400">
                  {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                  <Text className="text-teal-600 dark:text-teal-400 font-medium">
                    {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                  </Text>
                </Text>
              </Pressable>
            </Animated.View>

            {/* Privacy Note */}
            <Animated.View
              entering={FadeInUp.duration(600).delay(300)}
              className="mt-8 items-center"
            >
              <Text className="text-stone-400 dark:text-stone-500 text-xs text-center">
                Your data is stored securely on your device.{'\n'}
                We never share your information.
              </Text>
            </Animated.View>

            {/* Try Demo Button */}
            <Animated.View
              entering={FadeInUp.duration(600).delay(400)}
              className="mt-6"
            >
              <Pressable
                onPress={handleTryDemo}
                disabled={isDemoLoading || isLoading}
                accessibilityLabel="Try with sample demo data"
                accessibilityRole="button"
                className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-xl py-4 flex-row items-center justify-center active:opacity-80"
              >
                {isDemoLoading ? (
                  <ActivityIndicator color="#0d9488" />
                ) : (
                  <>
                    <Play size={18} color="#0d9488" fill="#0d9488" />
                    <Text className="text-teal-600 dark:text-teal-400 font-medium text-base ml-2">
                      Try with Sample Data
                    </Text>
                  </>
                )}
              </Pressable>
              <Text className="text-stone-400 dark:text-stone-500 text-xs text-center mt-2">
                Explore the app with a pre-filled demo case
              </Text>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
