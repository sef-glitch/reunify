import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  X,
  Check,
  Shield,
  Sparkles,
  FileText,
  Brain,
  Crown,
  Zap,
  Lock,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import {
  isRevenueCatEnabled,
  getOfferings,
  purchasePackage,
  restorePurchases,
  hasEntitlement,
} from '@/lib/revenuecatClient';
import type { PurchasesPackage } from 'react-native-purchases';

const PREMIUM_FEATURES = [
  {
    icon: Brain,
    title: 'AI Case Analysis',
    description: 'Get strategic insights and identify gaps',
  },
  {
    icon: Sparkles,
    title: 'AI Action Plans',
    description: 'Prioritized tasks and evidence to gather',
  },
  {
    icon: FileText,
    title: 'Document Drafting',
    description: 'AI-assisted legal document creation',
  },
  {
    icon: Shield,
    title: 'Court Packet Export',
    description: 'Professional exports for court submission',
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedScale = useSharedValue(1);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    setIsLoading(true);
    setError(null);

    if (!isRevenueCatEnabled()) {
      setError('Subscriptions are only available on mobile devices.');
      setIsLoading(false);
      return;
    }

    const result = await getOfferings();
    if (result.ok && result.data.current) {
      const availablePackages = result.data.current.availablePackages;
      setPackages(availablePackages);
      // Default select annual if available
      const annual = availablePackages.find((p) => p.identifier === '$rc_annual');
      const monthly = availablePackages.find((p) => p.identifier === '$rc_monthly');
      setSelectedPackage(annual?.identifier ?? monthly?.identifier ?? null);
    } else {
      setError('Unable to load subscription options. Please try again.');
    }
    setIsLoading(false);
  };

  const handleSelectPackage = useCallback((identifier: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPackage(identifier);
    selectedScale.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );
  }, []);

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    const pkg = packages.find((p) => p.identifier === selectedPackage);
    if (!pkg) return;

    setIsPurchasing(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await purchasePackage(pkg);

    if (result.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } else {
      if (result.reason === 'sdk_error') {
        // User cancelled or other error
        const errorMessage = result.error instanceof Error ? result.error.message : '';
        if (!errorMessage.includes('cancelled') && !errorMessage.includes('canceled')) {
          setError('Purchase failed. Please try again.');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    }
    setIsPurchasing(false);
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await restorePurchases();

    if (result.ok) {
      const premiumResult = await hasEntitlement('premium');
      if (premiumResult.ok && premiumResult.data) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      } else {
        setError('No active subscription found.');
      }
    } else {
      setError('Unable to restore purchases. Please try again.');
    }
    setIsRestoring(false);
  };

  const getPackagePrice = (pkg: PurchasesPackage) => {
    return pkg.product.priceString;
  };

  const getPackagePeriod = (pkg: PurchasesPackage) => {
    if (pkg.identifier === '$rc_annual') return '/year';
    if (pkg.identifier === '$rc_monthly') return '/month';
    return '';
  };

  const getMonthlySavings = () => {
    const annual = packages.find((p) => p.identifier === '$rc_annual');
    const monthly = packages.find((p) => p.identifier === '$rc_monthly');
    if (!annual || !monthly) return null;

    const annualMonthly = annual.product.price / 12;
    const monthlyPrice = monthly.product.price;
    const savings = Math.round((1 - annualMonthly / monthlyPrice) * 100);
    return savings > 0 ? savings : null;
  };

  const savings = getMonthlySavings();

  return (
    <View className="flex-1 bg-stone-950">
      <LinearGradient
        colors={['#0d9488', '#0f766e', '#115e59', '#0c0a09']}
        locations={[0, 0.3, 0.6, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 400 }}
      />

      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeIn.delay(100)}
          className="flex-row items-center justify-between px-5 py-3"
        >
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
            accessibilityLabel="Close"
          >
            <X size={20} color="#fff" />
          </Pressable>
          <Pressable
            onPress={handleRestore}
            disabled={isRestoring}
            className="px-4 py-2 rounded-full bg-white/10"
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white/80 text-sm font-medium">Restore</Text>
            )}
          </Pressable>
        </Animated.View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            className="items-center px-6 pt-4 pb-8"
          >
            <View className="w-20 h-20 rounded-2xl bg-white/20 items-center justify-center mb-5">
              <Crown size={40} color="#fbbf24" strokeWidth={1.5} />
            </View>
            <Text className="text-3xl font-bold text-white text-center mb-2">
              Unlock Reunify Pro
            </Text>
            <Text className="text-white/70 text-center text-base leading-6 px-4">
              Explain a Term is free for everyone. Upgrade for the full suite of AI tools.
            </Text>
          </Animated.View>

          {/* Features */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            className="mx-5 mb-6"
          >
            <BlurView
              intensity={40}
              tint="dark"
              style={{
                borderRadius: 20,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
              }}
            >
              <View className="p-5">
                {PREMIUM_FEATURES.map((feature, index) => (
                  <Animated.View
                    key={feature.title}
                    entering={FadeInDown.delay(400 + index * 80).springify()}
                    className={`flex-row items-center ${index < PREMIUM_FEATURES.length - 1 ? 'mb-4 pb-4 border-b border-white/10' : ''}`}
                  >
                    <View className="w-11 h-11 rounded-xl bg-teal-500/20 items-center justify-center mr-4">
                      <feature.icon size={22} color="#5eead4" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold text-base">
                        {feature.title}
                      </Text>
                      <Text className="text-white/60 text-sm mt-0.5">
                        {feature.description}
                      </Text>
                    </View>
                    <Check size={18} color="#5eead4" />
                  </Animated.View>
                ))}
              </View>
            </BlurView>
          </Animated.View>

          {/* Pricing Options */}
          {isLoading ? (
            <View className="py-10 items-center">
              <ActivityIndicator size="large" color="#5eead4" />
              <Text className="text-white/60 mt-3">Loading options...</Text>
            </View>
          ) : error && packages.length === 0 ? (
            <Animated.View entering={FadeIn} className="mx-5 p-5">
              <View className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                <Text className="text-red-300 text-center">{error}</Text>
                {Platform.OS === 'web' && (
                  <Text className="text-white/50 text-center text-sm mt-2">
                    Please use the mobile app to subscribe.
                  </Text>
                )}
              </View>
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeInUp.delay(500).springify()}
              className="mx-5 mb-6"
            >
              {packages.map((pkg) => {
                const isSelected = selectedPackage === pkg.identifier;
                const isAnnual = pkg.identifier === '$rc_annual';

                return (
                  <Pressable
                    key={pkg.identifier}
                    onPress={() => handleSelectPackage(pkg.identifier)}
                    className={`mb-3 rounded-2xl overflow-hidden ${isSelected ? 'border-2 border-teal-400' : 'border border-white/20'}`}
                  >
                    <BlurView intensity={30} tint="dark">
                      <View className="p-4 flex-row items-center">
                        <View
                          className={`w-6 h-6 rounded-full border-2 mr-4 items-center justify-center ${isSelected ? 'border-teal-400 bg-teal-400' : 'border-white/40'}`}
                        >
                          {isSelected && <Check size={14} color="#0c0a09" strokeWidth={3} />}
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center">
                            <Text className="text-white font-semibold text-lg">
                              {isAnnual ? 'Annual' : 'Monthly'}
                            </Text>
                            {isAnnual && savings && (
                              <View className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/20">
                                <Text className="text-amber-400 text-xs font-semibold">
                                  SAVE {savings}%
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-white/50 text-sm mt-0.5">
                            {isAnnual ? '7-day free trial included' : 'Cancel anytime'}
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-white font-bold text-xl">
                            {getPackagePrice(pkg)}
                          </Text>
                          <Text className="text-white/50 text-sm">
                            {getPackagePeriod(pkg)}
                          </Text>
                        </View>
                      </View>
                    </BlurView>
                  </Pressable>
                );
              })}
            </Animated.View>
          )}

          {/* Error Message */}
          {error && packages.length > 0 && (
            <Animated.View entering={FadeIn} className="mx-5 mb-4">
              <View className="bg-red-500/20 border border-red-500/30 rounded-xl p-3">
                <Text className="text-red-300 text-center text-sm">{error}</Text>
              </View>
            </Animated.View>
          )}

          {/* CTA Button */}
          {packages.length > 0 && (
            <Animated.View
              entering={FadeInUp.delay(600).springify()}
              className="mx-5 mb-6"
            >
              <Pressable
                onPress={handlePurchase}
                disabled={isPurchasing || !selectedPackage}
                className="overflow-hidden rounded-2xl"
              >
                <LinearGradient
                  colors={isPurchasing ? ['#57534e', '#44403c'] : ['#14b8a6', '#0d9488']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
                >
                  {isPurchasing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Zap size={20} color="#fff" fill="#fff" />
                      <Text className="text-white font-bold text-lg ml-2">
                        {selectedPackage === '$rc_annual' ? 'Start Free Trial' : 'Subscribe Now'}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* Terms & Privacy */}
          <Animated.View
            entering={FadeIn.delay(700)}
            className="px-6"
          >
            <Text className="text-white/40 text-xs text-center leading-5">
              {selectedPackage === '$rc_annual'
                ? 'After your 7-day free trial, you will be charged. '
                : ''}
              Cancel anytime. By subscribing, you agree to our{' '}
              <Text
                className="text-white/60 underline"
                onPress={() => Linking.openURL('https://reunify.app/terms')}
              >
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text
                className="text-white/60 underline"
                onPress={() => Linking.openURL('https://reunify.app/privacy')}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </Animated.View>

          {/* Security Badge */}
          <Animated.View
            entering={FadeIn.delay(800)}
            className="flex-row items-center justify-center mt-6"
          >
            <Lock size={14} color="#6b7280" />
            <Text className="text-white/40 text-xs ml-1.5">
              Secure payment via {Platform.OS === 'ios' ? 'App Store' : 'Google Play'}
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
