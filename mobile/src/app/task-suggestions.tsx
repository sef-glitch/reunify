import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  X,
  Lightbulb,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { useAuth, Case } from '@/lib/auth-context';
import {
  suggestTasks,
  isAIServiceAvailable,
  TaskSuggestionsResult,
  TaskSuggestion,
} from '@/lib/ai-service';
import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function TaskSuggestionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ caseId?: string }>();
  const { cases, tasks, addTask, refreshData } = useAuth();

  const [selectedCase, setSelectedCase] = useState<Case | null>(
    params.caseId ? cases.find((c) => c.id === params.caseId) ?? null : null
  );
  const [suggestionsResult, setSuggestionsResult] = useState<TaskSuggestionsResult | null>(null);
  const [addedTasks, setAddedTasks] = useState<Set<number>>(new Set());

  const aiAvailable = isAIServiceAvailable();

  const caseTasks = selectedCase
    ? tasks.filter((t) => t.caseId === selectedCase.id)
    : [];

  const suggestionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCase) throw new Error('Please select a case');
      return suggestTasks(
        {
          name: selectedCase.name,
          state: selectedCase.state,
          county: selectedCase.county,
          caseType: selectedCase.caseType,
          stage: selectedCase.stage,
          nextHearingDate: selectedCase.nextHearingDate,
          goals: selectedCase.goals,
        },
        caseTasks.map((t) => ({
          title: t.title,
          status: t.status,
          priority: t.priority,
        }))
      );
    },
    onSuccess: (data) => {
      setSuggestionsResult(data);
      setAddedTasks(new Set());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const handleAddTask = useCallback(
    (suggestion: TaskSuggestion, index: number) => {
      if (!selectedCase || addedTasks.has(index)) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      addTask({
        caseId: selectedCase.id,
        title: suggestion.title,
        description: suggestion.description,
        priority: suggestion.priority,
        status: 'pending',
        dueDate: null,
      });

      setAddedTasks((prev) => new Set([...prev, index]));
      refreshData();
    },
    [selectedCase, addedTasks, addTask, refreshData]
  );

  const handleAddAll = useCallback(() => {
    if (!selectedCase || !suggestionsResult) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const allIndexes = new Set<number>();
    suggestionsResult.suggestions.forEach((suggestion, index) => {
      if (!addedTasks.has(index)) {
        addTask({
          caseId: selectedCase.id,
          title: suggestion.title,
          description: suggestion.description,
          priority: suggestion.priority,
          status: 'pending',
          dueDate: null,
        });
        allIndexes.add(index);
      }
    });

    setAddedTasks(
      (prev) => new Set([...prev, ...allIndexes])
    );
    refreshData();
  }, [selectedCase, suggestionsResult, addedTasks, addTask, refreshData]);

  const handleBack = useCallback(() => {
    if (suggestionsResult) {
      setSuggestionsResult(null);
      setAddedTasks(new Set());
    } else {
      router.back();
    }
  }, [suggestionsResult, router]);

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          text: 'text-red-700 dark:text-red-400',
        };
      case 'high':
        return {
          bg: 'bg-orange-100 dark:bg-orange-900/30',
          text: 'text-orange-700 dark:text-orange-400',
        };
      case 'medium':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-700 dark:text-blue-400',
        };
      default:
        return {
          bg: 'bg-stone-100 dark:bg-stone-800',
          text: 'text-stone-600 dark:text-stone-400',
        };
    }
  };

  const renderForm = () => (
    <View className="px-5 pt-6">
      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        <View className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200/60 dark:border-teal-800/40 rounded-2xl p-4 mb-6">
          <View className="flex-row items-center mb-1.5">
            <Lightbulb size={18} color="#0d9488" />
            <Text className="text-teal-800 dark:text-teal-300 font-semibold text-sm ml-2">
              AI Task Suggestions
            </Text>
          </View>
          <Text className="text-teal-700 dark:text-teal-400 text-xs leading-5">
            AI will analyze your case and existing tasks to suggest new tasks that fill gaps in your preparation.
          </Text>
        </View>
      </Animated.View>

      {/* Case Selection */}
      <Animated.View entering={FadeInDown.duration(400).delay(200)}>
        <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2.5">
          Select Case
        </Text>
        {cases.length === 0 ? (
          <View className="bg-stone-100 dark:bg-stone-800/50 rounded-xl p-4 items-center">
            <Text className="text-stone-500 dark:text-stone-400 text-sm">
              Create a case first to get suggestions
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            {cases.map((c) => {
              const caseTaskCount = tasks.filter((t) => t.caseId === c.id).length;
              return (
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
                    {caseTaskCount} tasks
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </Animated.View>

      {/* Current tasks summary */}
      {selectedCase && caseTasks.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(300)} className="mt-5">
          <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
            Existing Tasks ({caseTasks.length})
          </Text>
          <View className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/60 dark:border-stone-800 p-3">
            {caseTasks.slice(0, 5).map((t) => (
              <View key={t.id} className="flex-row items-center py-1.5">
                <View
                  className={`w-2 h-2 rounded-full ${
                    t.status === 'completed'
                      ? 'bg-emerald-500'
                      : t.priority === 'urgent'
                      ? 'bg-red-500'
                      : t.priority === 'high'
                      ? 'bg-orange-500'
                      : 'bg-blue-500'
                  }`}
                />
                <Text
                  className={`text-sm ml-2.5 flex-1 ${
                    t.status === 'completed'
                      ? 'text-stone-400 dark:text-stone-500 line-through'
                      : 'text-stone-700 dark:text-stone-200'
                  }`}
                  numberOfLines={1}
                >
                  {t.title}
                </Text>
              </View>
            ))}
            {caseTasks.length > 5 && (
              <Text className="text-stone-400 dark:text-stone-500 text-xs mt-1">
                +{caseTasks.length - 5} more
              </Text>
            )}
          </View>
        </Animated.View>
      )}

      {/* Suggest Button */}
      <Animated.View entering={FadeInDown.duration(400).delay(400)} className="mt-6">
        <Pressable
          onPress={() => suggestionMutation.mutate()}
          disabled={!selectedCase || suggestionMutation.isPending}
          className={`py-4 rounded-xl items-center flex-row justify-center ${
            selectedCase && !suggestionMutation.isPending
              ? 'bg-teal-600 dark:bg-teal-500 active:opacity-80'
              : 'bg-stone-300 dark:bg-stone-700'
          }`}
        >
          {suggestionMutation.isPending ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text className="text-white font-semibold ml-2">Thinking...</Text>
            </>
          ) : (
            <>
              <Sparkles size={18} color="#fff" />
              <Text className="text-white font-semibold ml-2">Suggest Tasks</Text>
            </>
          )}
        </Pressable>
      </Animated.View>

      {suggestionMutation.isError && (
        <Animated.View entering={FadeInDown.duration(300)} className="mt-4">
          <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
            <Text className="text-red-700 dark:text-red-400 text-sm">
              {suggestionMutation.error instanceof Error
                ? suggestionMutation.error.message
                : 'Failed to generate suggestions. Please try again.'}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );

  const allAdded = suggestionsResult
    ? suggestionsResult.suggestions.every((_, i) => addedTasks.has(i))
    : false;

  const renderResult = () => {
    if (!suggestionsResult) return null;

    return (
      <View className="px-5 pt-5 pb-10">
        {/* Context Summary */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <View className="bg-stone-100 dark:bg-stone-800/50 rounded-2xl p-4 mb-5">
            <Text className="text-stone-500 dark:text-stone-400 text-xs font-medium uppercase mb-1">
              Analysis
            </Text>
            <Text className="text-stone-700 dark:text-stone-200 text-sm leading-5">
              {suggestionsResult.contextSummary}
            </Text>
          </View>
        </Animated.View>

        {/* Add All Button */}
        {!allAdded && suggestionsResult.suggestions.length > 1 && (
          <Animated.View entering={FadeInDown.duration(400).delay(150)}>
            <Pressable
              onPress={handleAddAll}
              className="bg-teal-600 dark:bg-teal-500 py-3 rounded-xl items-center flex-row justify-center mb-4 active:opacity-80"
            >
              <Plus size={16} color="#fff" />
              <Text className="text-white font-semibold text-sm ml-1.5">
                Add All {suggestionsResult.suggestions.length - addedTasks.size} Tasks
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {allAdded && (
          <Animated.View entering={FadeInDown.duration(400).delay(150)}>
            <View className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl p-3 mb-4 flex-row items-center justify-center">
              <CheckCircle2 size={16} color="#059669" />
              <Text className="text-emerald-700 dark:text-emerald-400 font-medium text-sm ml-2">
                All tasks added to your case!
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Suggestions */}
        {suggestionsResult.suggestions.map((suggestion, index) => {
          const isAdded = addedTasks.has(index);
          const priorityStyle = getPriorityStyle(suggestion.priority);

          return (
            <Animated.View
              key={index}
              entering={FadeInDown.duration(400).delay(200 + index * 80)}
            >
              <View
                className={`bg-white dark:bg-stone-900 rounded-xl p-4 mb-3 border ${
                  isAdded
                    ? 'border-emerald-200 dark:border-emerald-800/40'
                    : 'border-stone-200/60 dark:border-stone-800'
                }`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center mb-1.5">
                      <View className={`px-2 py-0.5 rounded-full ${priorityStyle.bg}`}>
                        <Text className={`text-xs font-medium ${priorityStyle.text}`}>
                          {suggestion.priority.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text
                      className={`font-medium text-base ${
                        isAdded
                          ? 'text-stone-400 dark:text-stone-500'
                          : 'text-stone-800 dark:text-stone-100'
                      }`}
                    >
                      {suggestion.title}
                    </Text>
                    <Text className="text-stone-500 dark:text-stone-400 text-sm mt-1 leading-5">
                      {suggestion.description}
                    </Text>
                    {suggestion.reasoning ? (
                      <View className="mt-2.5 bg-stone-50 dark:bg-stone-800/50 rounded-lg p-2.5">
                        <Text className="text-stone-500 dark:text-stone-400 text-xs leading-4 italic">
                          {suggestion.reasoning}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => handleAddTask(suggestion, index)}
                    disabled={isAdded}
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      isAdded
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : 'bg-teal-100 dark:bg-teal-900/30 active:opacity-60'
                    }`}
                  >
                    {isAdded ? (
                      <CheckCircle2 size={20} color="#059669" />
                    ) : (
                      <Plus size={20} color="#0d9488" />
                    )}
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          );
        })}

        {/* Disclaimer */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200 + suggestionsResult.suggestions.length * 80)}
        >
          <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mt-2">
            <View className="flex-row items-center mb-2">
              <AlertTriangle size={16} color="#d97706" />
              <Text className="font-medium text-amber-700 dark:text-amber-400 ml-2 text-sm">
                Important
              </Text>
            </View>
            <Text className="text-amber-700 dark:text-amber-400 text-xs leading-5">
              {suggestionsResult.disclaimer}
            </Text>
          </View>
        </Animated.View>

        {/* Bottom Actions */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(300 + suggestionsResult.suggestions.length * 80)}
          className="mt-5 flex-row"
        >
          <Pressable
            onPress={() => {
              setSuggestionsResult(null);
              setAddedTasks(new Set());
            }}
            className="flex-1 py-3.5 rounded-xl items-center border border-stone-300 dark:border-stone-600 active:opacity-80 mr-3"
          >
            <Text className="text-stone-600 dark:text-stone-300 font-semibold text-sm">
              Get More
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(tabs)/tasks')}
            className="flex-1 bg-teal-600 dark:bg-teal-500 py-3.5 rounded-xl items-center flex-row justify-center active:opacity-80"
          >
            <Text className="text-white font-semibold text-sm">View Tasks</Text>
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
            Task Suggestions
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
          {!suggestionsResult ? renderForm() : renderResult()}
        </ScrollView>
      )}
    </View>
  );
}
