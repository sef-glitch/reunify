import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Dimensions, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Heart, Shield, FileText, Sparkles, ChevronRight, Play } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ONBOARDING_COMPLETE_KEY = 'reunify_onboarding_complete';

interface OnboardingStep {
  id: number;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  accentColor: string;
  gradientColors: readonly [string, string, string];
}

const steps: OnboardingStep[] = [
  {
    id: 0,
    icon: <Heart size={48} color="#0d9488" strokeWidth={1.5} />,
    title: 'Welcome to Reunify',
    subtitle: "You're not alone",
    description:
      'A safe, private space to organize your family court or CPS case. Everything stays on your device.',
    accentColor: '#0d9488',
    gradientColors: ['#f0fdfa', '#ccfbf1', '#99f6e4'] as const,
  },
  {
    id: 1,
    icon: <FileText size={48} color="#2563eb" strokeWidth={1.5} />,
    title: 'Organize Everything',
    subtitle: 'Cases, tasks, documents',
    description:
      'Track court dates, manage tasks, draft documents, and store evidence — all in one place.',
    accentColor: '#2563eb',
    gradientColors: ['#eff6ff', '#dbeafe', '#bfdbfe'] as const,
  },
  {
    id: 2,
    icon: <Sparkles size={48} color="#7c3aed" strokeWidth={1.5} />,
    title: 'AI-Powered Help',
    subtitle: 'Smart assistance when you need it',
    description:
      'Generate action plans, draft documents, and understand legal terms with AI assistance.',
    accentColor: '#7c3aed',
    gradientColors: ['#faf5ff', '#f3e8ff', '#e9d5ff'] as const,
  },
  {
    id: 3,
    icon: <Shield size={48} color="#059669" strokeWidth={1.5} />,
    title: 'Private & Secure',
    subtitle: 'Your data, your control',
    description:
      'All data is stored securely on your device. Export court packets when ready to share.',
    accentColor: '#059669',
    gradientColors: ['#ecfdf5', '#d1fae5', '#a7f3d0'] as const,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [currentStep, setCurrentStep] = useState(0);
  const buttonScale = useSharedValue(1);

  const step = steps[currentStep];

  const handleNext = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      router.replace('/auth');
    }
  }, [currentStep, router]);

  const handleSkip = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    router.replace('/auth');
  }, [router]);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const onPressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const onPressOut = () => {
    buttonScale.value = withSpring(1);
  };

  const darkGradient = ['#0c0a09', '#1c1917', '#292524'] as const;

  return (
    <View className="flex-1">
      <LinearGradient
        colors={isDark ? darkGradient : step.gradientColors}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView className="flex-1">
          {/* Skip Button */}
          <Animated.View
            entering={FadeIn.delay(300)}
            className="absolute top-4 right-5 z-10"
          >
            <SafeAreaView edges={['top']}>
              <Pressable
                onPress={handleSkip}
                className="px-4 py-2 rounded-full bg-white/20 dark:bg-white/10"
                accessibilityLabel="Skip onboarding"
                accessibilityRole="button"
              >
                <Text className="text-stone-600 dark:text-stone-300 font-medium text-sm">
                  Skip
                </Text>
              </Pressable>
            </SafeAreaView>
          </Animated.View>

          {/* Progress Dots */}
          <View className="flex-row justify-center mt-16 mb-8">
            {steps.map((s, index) => (
              <Animated.View
                key={s.id}
                entering={FadeInDown.delay(100 * index)}
                style={{
                  width: index === currentStep ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  marginHorizontal: 4,
                  backgroundColor:
                    index === currentStep
                      ? step.accentColor
                      : isDark
                        ? 'rgba(255,255,255,0.2)'
                        : 'rgba(0,0,0,0.1)',
                }}
              />
            ))}
          </View>

          {/* Content */}
          <View className="flex-1 px-8 justify-center">
            <Animated.View
              key={`icon-${currentStep}`}
              entering={SlideInRight.springify().damping(15)}
              exiting={SlideOutLeft.duration(200)}
              className="items-center mb-8"
            >
              <View
                className="w-28 h-28 rounded-full items-center justify-center"
                style={{
                  backgroundColor: isDark
                    ? `${step.accentColor}20`
                    : `${step.accentColor}15`,
                  shadowColor: step.accentColor,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                }}
              >
                {step.icon}
              </View>
            </Animated.View>

            <Animated.View
              key={`text-${currentStep}`}
              entering={FadeInUp.delay(100).springify()}
              exiting={FadeOut.duration(150)}
              className="items-center"
            >
              <Text
                className="text-stone-400 dark:text-stone-500 text-sm font-medium tracking-wider uppercase mb-2"
                accessibilityRole="header"
              >
                {step.subtitle}
              </Text>
              <Text
                className="text-3xl font-bold text-stone-800 dark:text-stone-100 text-center mb-4"
                accessibilityRole="header"
              >
                {step.title}
              </Text>
              <Text className="text-stone-600 dark:text-stone-400 text-center text-base leading-6 px-4">
                {step.description}
              </Text>
            </Animated.View>
          </View>

          {/* Bottom Section */}
          <View className="px-8 pb-8">
            <Animated.View style={buttonAnimatedStyle}>
              <Pressable
                onPress={handleNext}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                accessibilityLabel={
                  currentStep === steps.length - 1 ? 'Get started' : 'Continue to next step'
                }
                accessibilityRole="button"
                className="overflow-hidden rounded-2xl"
              >
                <LinearGradient
                  colors={[step.accentColor, `${step.accentColor}dd`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingVertical: 18,
                    paddingHorizontal: 32,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      <Play size={20} color="#fff" fill="#fff" />
                      <Text className="text-white font-semibold text-lg ml-2">
                        Get Started
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text className="text-white font-semibold text-lg">Continue</Text>
                      <ChevronRight size={20} color="#fff" style={{ marginLeft: 4 }} />
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* Legal Note */}
            <Animated.View entering={FadeIn.delay(500)} className="mt-6">
              <Text className="text-stone-400 dark:text-stone-500 text-xs text-center leading-5">
                Reunify is not a substitute for legal advice.{'\n'}
                Always consult with a qualified attorney.
              </Text>
            </Animated.View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

export { ONBOARDING_COMPLETE_KEY };
