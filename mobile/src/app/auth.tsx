import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Mail, Lock, Eye, EyeOff, Play } from 'lucide-react-native';
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
      const demoEmail = `demo_${Date.now()}@reunify.app`;
      const demoPassword = 'demo123456';
      const result = await signUp(demoEmail, demoPassword);
      if (result.success) {
        setTimeout(() => seedDemoData(), 100);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setError(result.error ?? 'Could not start demo');
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
      setError('Please fill in all fields');
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
    <View className="flex-1 bg-stone-50">
      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 justify-center px-6">
            {/* Header */}
            <Animated.View
              entering={FadeInDown.duration(700).delay(50)}
              className="items-center mb-8"
            >
              <View className="w-20 h-20 rounded-3xl bg-teal-600 items-center justify-center mb-5 shadow-lg">
                <Shield size={40} color="#fff" strokeWidth={1.5} />
              </View>
              <Text className="text-3xl font-bold text-stone-800">Reunify</Text>
              <Text className="text-stone-400 text-base mt-2 text-center px-4">
                {mode === 'signin'
                  ? 'Welcome back. Your cases are ready.'
                  : 'Start organizing your case today.'}
              </Text>
            </Animated.View>

            {/* Form Card */}
            <Animated.View
              entering={FadeInUp.duration(600).delay(150)}
              className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100"
            >
              {/* Error */}
              {error && (
                <View className="bg-red-50 rounded-2xl p-3 mb-4 border border-red-100">
                  <Text className="text-red-600 text-sm text-center">{error}</Text>
                </View>
              )}

              {/* Email */}
              <View className="mb-3">
                <Text className="text-stone-500 text-xs font-medium uppercase tracking-wide mb-2 ml-1">Email</Text>
                <View className="flex-row items-center bg-stone-50 rounded-2xl px-4 py-3.5 border border-stone-200 focus:border-teal-400">
                  <Mail size={18} color="#9ca3af" />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="#d1d5db"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="flex-1 ml-3 text-stone-800 text-base"
                  />
                </View>
              </View>

              {/* Password */}
              <View className="mb-3">
                <Text className="text-stone-500 text-xs font-medium uppercase tracking-wide mb-2 ml-1">Password</Text>
                <View className="flex-row items-center bg-stone-50 rounded-2xl px-4 py-3.5 border border-stone-200">
                  <Lock size={18} color="#9ca3af" />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#d1d5db"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    className="flex-1 ml-3 text-stone-800 text-base"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    {showPassword
                      ? <EyeOff size={18} color="#9ca3af" />
                      : <Eye size={18} color="#9ca3af" />}
                  </Pressable>
                </View>
              </View>

              {/* Confirm Password (signup only) */}
              {mode === 'signup' && (
                <View className="mb-4">
                  <Text className="text-stone-500 text-xs font-medium uppercase tracking-wide mb-2 ml-1">Confirm Password</Text>
                  <View className="flex-row items-center bg-stone-50 rounded-2xl px-4 py-3.5 border border-stone-200">
                    <Lock size={18} color="#9ca3af" />
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#d1d5db"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      className="flex-1 ml-3 text-stone-800 text-base"
                    />
                  </View>
                </View>
              )}

              {/* Submit */}
              <Pressable
                onPress={handleSubmit}
                disabled={isLoading}
                className="bg-teal-600 rounded-2xl py-4 items-center mt-2 active:opacity-80 shadow-sm"
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-base">
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </Pressable>

              {/* Toggle */}
              <Pressable onPress={toggleMode} className="mt-4 py-2 active:opacity-60">
                <Text className="text-center text-stone-400 text-sm">
                  {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                  <Text className="text-teal-600 font-medium">
                    {mode === 'signin' ? 'Sign up' : 'Sign in'}
                  </Text>
                </Text>
              </Pressable>
            </Animated.View>

            {/* Demo */}
            <Animated.View entering={FadeInUp.duration(600).delay(300)} className="mt-6">
              <Pressable
                onPress={handleTryDemo}
                disabled={isDemoLoading || isLoading}
                className="flex-row items-center justify-center py-3"
              >
                {isDemoLoading ? (
                  <ActivityIndicator color="#0d9488" />
                ) : (
                  <>
                    <Play size={16} color="#0d9488" fill="#0d9488" />
                    <Text className="text-teal-600 font-medium text-base ml-2">Try with sample data</Text>
                  </>
                )}
              </Pressable>
              <Text className="text-stone-300 text-xs text-center mt-1">
                No account needed — explore with demo content
              </Text>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
