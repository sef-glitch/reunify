import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  X,
  TrendingUp,
  Shield,
  AlertTriangle,
  Target,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Info,
  Zap,
} from 'lucide-react-native';
import { useAuth, Case } from '@/lib/auth-context';
import {
  analyzeCase,
  isAIServiceAvailable,
  CaseAnalysis,
} from '@/lib/ai-service';
import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';

export default function CaseAnalysisScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ caseId?: string }>();
  const { cases, tasks, documents, evidence } = useAuth();

  const [selectedCase, setSelectedCase] = useState<Case | null>(
    params.caseId ? cases.find((c) => c.id === params.caseId) ?? null : null
  );
  const [additionalContext, setAdditionalContext] = useState('');
  const [analysisResult, setAnalysisResult] = useState<CaseAnalysis | null>(null);

  const aiAvailable = isAIServiceAvailable();

  const caseTasks = selectedCase
    ? tasks.filter((t) => t.caseId === selectedCase.id)
    : [];
  const caseDocs = selectedCase
    ? documents.filter((d) => d.caseId === selectedCase.id)
    : [];
  const caseEvidence = selectedCase
    ? evidence.filter((e) => e.caseId === selectedCase.id)
    : [];

  const analysisMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCase) throw new Error('Please select a case');
      return analyzeCase(
        {
          name: selectedCase.name,
          state: selectedCase.state,
          county: selectedCase.county,
          caseType: selectedCase.caseType,
          stage: selectedCase.stage,
          nextHearingDate: selectedCase.nextHearingDate,
          goals: selectedCase.goals,
          additionalContext: additionalContext || undefined,
        },
        caseTasks.length,
        caseDocs.length,
        caseEvidence.length
      );
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const handleBack = useCallback(() => {
    if (analysisResult) {
      setAnalysisResult(null);
    } else {
      router.back();
    }
  }, [analysisResult, router]);

  const renderForm = () => (
    <View className="px-5 pt-6">
      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl p-4 mb-6">
          <View className="flex-row items-center mb-1.5">
            <TrendingUp size={18} color="#d97706" />
            <Text className="text-amber-800 dark:text-amber-300 font-semibold text-sm ml-2">
              Smart Case Analysis
            </Text>
          </View>
          <Text className="text-amber-700 dark:text-amber-400 text-xs leading-5">
            AI will review your case details and preparation status to identify strengths, gaps, and next steps.
          </Text>
        </View>
      </Animated.View>

      {/* Case Selection */}
      <Animated.View entering={FadeInDown.duration(400).delay(200)}>
        <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2.5">
          Select Case
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
          {cases.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => {
                setSelectedCase(c);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className={`mr-2.5 px-4 py-3 rounded-xl border ${
                selectedCase?.id === c.id
                  ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedCase?.id === c.id
                    ? 'text-teal-700 dark:text-teal-400'
                    : 'text-stone-600 dark:text-stone-300'
                }`}
              >
                {c.name}
              </Text>
              <Text className="text-stone-400 dark:text-stone-500 text-xs mt-0.5">
                {c.caseType} - {c.stage}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Preparation Overview */}
      {selectedCase && (
        <Animated.View entering={FadeInDown.duration(400).delay(300)} className="mt-5">
          <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2.5">
            Current Preparation
          </Text>
          <View className="flex-row">
            <View className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3.5 mr-2 items-center">
              <Text className="text-blue-700 dark:text-blue-400 text-lg font-bold">
                {caseTasks.length}
              </Text>
              <Text className="text-blue-600 dark:text-blue-400 text-xs mt-0.5">Tasks</Text>
            </View>
            <View className="flex-1 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3.5 mr-2 items-center">
              <Text className="text-purple-700 dark:text-purple-400 text-lg font-bold">
                {caseDocs.length}
              </Text>
              <Text className="text-purple-600 dark:text-purple-400 text-xs mt-0.5">Docs</Text>
            </View>
            <View className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3.5 items-center">
              <Text className="text-emerald-700 dark:text-emerald-400 text-lg font-bold">
                {caseEvidence.length}
              </Text>
              <Text className="text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">Evidence</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Additional Context */}
      <Animated.View entering={FadeInDown.duration(400).delay(400)} className="mt-5">
        <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
          Additional Context (optional)
        </Text>
        <TextInput
          value={additionalContext}
          onChangeText={setAdditionalContext}
          placeholder="Recent developments, concerns, or specific areas to focus on..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 text-stone-800 dark:text-stone-100 min-h-[80px] text-sm"
        />
      </Animated.View>

      {/* Analyze Button */}
      <Animated.View entering={FadeInDown.duration(400).delay(500)} className="mt-6">
        <Pressable
          onPress={() => analysisMutation.mutate()}
          disabled={!selectedCase || analysisMutation.isPending}
          className={`py-4 rounded-xl items-center flex-row justify-center ${
            selectedCase && !analysisMutation.isPending
              ? 'bg-teal-600 dark:bg-teal-500 active:opacity-80'
              : 'bg-stone-300 dark:bg-stone-700'
          }`}
        >
          {analysisMutation.isPending ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text className="text-white font-semibold ml-2">Analyzing...</Text>
            </>
          ) : (
            <>
              <TrendingUp size={18} color="#fff" />
              <Text className="text-white font-semibold ml-2">Analyze Case</Text>
            </>
          )}
        </Pressable>
      </Animated.View>

      {analysisMutation.isError && (
        <Animated.View entering={FadeInDown.duration(300)} className="mt-4">
          <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
            <Text className="text-red-700 dark:text-red-400 text-sm">
              {analysisMutation.error instanceof Error
                ? analysisMutation.error.message
                : 'Failed to analyze. Please try again.'}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );

  const renderResult = () => {
    if (!analysisResult) return null;

    return (
      <View className="px-5 pt-5 pb-10">
        {/* Overall Assessment */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <View className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/60 dark:border-stone-800 mb-4">
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/40 items-center justify-center">
                <Info size={20} color="#0d9488" />
              </View>
              <Text className="text-stone-800 dark:text-stone-100 font-semibold text-base ml-3">
                Overall Assessment
              </Text>
            </View>
            <Text className="text-stone-600 dark:text-stone-300 text-sm leading-6">
              {analysisResult.overallAssessment}
            </Text>
          </View>
        </Animated.View>

        {/* Strengths */}
        {analysisResult.strengths.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            <View className="mb-4">
              <View className="flex-row items-center mb-3">
                <Shield size={18} color="#059669" />
                <Text className="text-stone-700 dark:text-stone-200 font-semibold text-sm ml-2 uppercase tracking-wide">
                  Strengths
                </Text>
              </View>
              {analysisResult.strengths.map((s, i) => (
                <View
                  key={i}
                  className="bg-emerald-50 dark:bg-emerald-900/15 rounded-xl p-3.5 mb-2 flex-row items-start"
                >
                  <CheckCircle2 size={16} color="#059669" style={{ marginTop: 2 }} />
                  <Text className="text-emerald-800 dark:text-emerald-300 text-sm ml-2.5 flex-1 leading-5">
                    {s}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Areas to Improve */}
        {analysisResult.areasToImprove.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(300)}>
            <View className="mb-4">
              <View className="flex-row items-center mb-3">
                <Target size={18} color="#2563eb" />
                <Text className="text-stone-700 dark:text-stone-200 font-semibold text-sm ml-2 uppercase tracking-wide">
                  Areas to Improve
                </Text>
              </View>
              {analysisResult.areasToImprove.map((a, i) => (
                <View
                  key={i}
                  className="bg-blue-50 dark:bg-blue-900/15 rounded-xl p-3.5 mb-2 flex-row items-start"
                >
                  <ArrowRight size={16} color="#2563eb" style={{ marginTop: 2 }} />
                  <Text className="text-blue-800 dark:text-blue-300 text-sm ml-2.5 flex-1 leading-5">
                    {a}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Risk Factors */}
        {analysisResult.riskFactors.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(400)}>
            <View className="mb-4">
              <View className="flex-row items-center mb-3">
                <AlertTriangle size={18} color="#d97706" />
                <Text className="text-stone-700 dark:text-stone-200 font-semibold text-sm ml-2 uppercase tracking-wide">
                  Risk Factors
                </Text>
              </View>
              {analysisResult.riskFactors.map((r, i) => (
                <View
                  key={i}
                  className="bg-amber-50 dark:bg-amber-900/15 rounded-xl p-3.5 mb-2 flex-row items-start"
                >
                  <AlertTriangle size={16} color="#d97706" style={{ marginTop: 2 }} />
                  <Text className="text-amber-800 dark:text-amber-300 text-sm ml-2.5 flex-1 leading-5">
                    {r}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Next Steps */}
        {analysisResult.nextStepsRecommendation ? (
          <Animated.View entering={FadeInDown.duration(400).delay(500)}>
            <View className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200/60 dark:border-teal-800/40 rounded-2xl p-4 mb-4">
              <View className="flex-row items-center mb-2">
                <Zap size={18} color="#0d9488" />
                <Text className="text-teal-800 dark:text-teal-300 font-semibold text-sm ml-2">
                  Recommended Next Steps
                </Text>
              </View>
              <Text className="text-teal-700 dark:text-teal-400 text-sm leading-6">
                {analysisResult.nextStepsRecommendation}
              </Text>
            </View>
          </Animated.View>
        ) : null}

        {/* Stage-Specific Advice */}
        {analysisResult.stageSpecificAdvice ? (
          <Animated.View entering={FadeInDown.duration(400).delay(600)}>
            <View className="bg-white dark:bg-stone-900 rounded-2xl p-4 mb-4 border border-stone-200/60 dark:border-stone-800">
              <Text className="text-stone-600 dark:text-stone-300 text-xs font-semibold uppercase tracking-wide mb-2">
                Stage-Specific Advice ({selectedCase?.stage})
              </Text>
              <Text className="text-stone-700 dark:text-stone-200 text-sm leading-6">
                {analysisResult.stageSpecificAdvice}
              </Text>
            </View>
          </Animated.View>
        ) : null}

        {/* Disclaimer */}
        <Animated.View entering={FadeInDown.duration(400).delay(700)}>
          <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mt-2">
            <View className="flex-row items-center mb-2">
              <AlertTriangle size={16} color="#d97706" />
              <Text className="font-medium text-amber-700 dark:text-amber-400 ml-2 text-sm">
                Important
              </Text>
            </View>
            <Text className="text-amber-700 dark:text-amber-400 text-xs leading-5">
              {analysisResult.disclaimer}
            </Text>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.duration(400).delay(800)} className="mt-5 flex-row">
          <Pressable
            onPress={() => setAnalysisResult(null)}
            className="flex-1 py-3.5 rounded-xl items-center border border-stone-300 dark:border-stone-600 active:opacity-80 mr-3"
          >
            <Text className="text-stone-600 dark:text-stone-300 font-semibold text-sm">
              Re-analyze
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (selectedCase) {
                router.replace({
                  pathname: '/ai-assistant',
                  params: { mode: 'plan', caseId: selectedCase.id },
                });
              }
            }}
            className="flex-1 bg-teal-600 dark:bg-teal-500 py-3.5 rounded-xl items-center flex-row justify-center active:opacity-80"
          >
            <Text className="text-white font-semibold text-sm">Create Plan</Text>
            <ChevronRight size={16} color="#fff" />
          </Pressable>
        </Animated.View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <SafeAreaView edges={['top']} className="bg-stone-50 dark:bg-stone-950">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800">
          <Pressable onPress={handleBack} className="active:opacity-60">
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-lg font-semibold text-stone-800 dark:text-stone-100">
            Case Analysis
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>

      {!aiAvailable ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 items-center justify-center mb-4">
            <AlertTriangle size={32} color="#d97706" />
          </View>
          <Text className="text-stone-600 dark:text-stone-300 text-lg font-medium text-center">
            AI Not Available
          </Text>
          <Text className="text-stone-400 dark:text-stone-500 text-sm text-center mt-2">
            Please check the API tab in Vibecode to configure your OpenAI API key.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
          {!analysisResult ? renderForm() : renderResult()}
        </ScrollView>
      )}
    </View>
  );
}
