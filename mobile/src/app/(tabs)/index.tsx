import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, CheckCircle2, Plus, FileText, Upload, ChevronRight, AlertCircle, Clock, Sparkles, TrendingUp, Zap, Crown } from 'lucide-react-native';
import { useAuth, Task } from '@/lib/auth-context';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { useSubscription } from '@/lib/useSubscription';

export default function DashboardScreen() {
  const router = useRouter();
  const { cases, tasks, documents, evidence } = useAuth();
  const { isPremium, requirePremium } = useSubscription();

  const handleAIFeature = (route: '/ai-assistant' | '/case-analysis' | '/task-suggestions') => {
    // AI Assistant hub is free (Explain a Term is free inside)
    if (route === '/ai-assistant') {
      router.push(route);
      return;
    }
    // Case Analysis and Task Suggestions require premium - use requirePremium() properly
    // requirePremium() returns true if premium, or navigates to paywall and returns false
    // Only navigate to the route if it returns true
    if (route !== '/ai-assistant' && !requirePremium()) {
      return; // User is not premium and paywall was shown - don't navigate
    }
    router.push(route);
  };

  // Find next court date across all cases
  const nextCourtDate = useMemo(() => {
    const upcomingDates = cases
      .filter((c) => c.nextHearingDate)
      .map((c) => ({ date: new Date(c.nextHearingDate!), caseName: c.name }))
      .filter((d) => d.date >= new Date())
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    return upcomingDates[0] || null;
  }, [cases]);

  // Get top 3 urgent tasks
  const urgentTasks = useMemo(() => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return tasks
      .filter((t) => t.status !== 'completed')
      .sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return a.dueDate ? -1 : 1;
      })
      .slice(0, 3);
  }, [tasks]);

  const getCaseName = (caseId: string) => {
    return cases.find((c) => c.id === caseId)?.name || 'Unknown Case';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 0) return 'Overdue';
    return `${diff} days`;
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800';
      case 'high': return 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800';
      case 'medium': return 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800';
      default: return 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700';
    }
  };

  const getPriorityTextColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-700 dark:text-red-400';
      case 'high': return 'text-orange-700 dark:text-orange-400';
      case 'medium': return 'text-blue-700 dark:text-blue-400';
      default: return 'text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <SafeAreaView edges={['top']} className="bg-stone-50 dark:bg-stone-950">
        <View className="px-5 pt-4 pb-3">
          <Text className="text-2xl font-semibold text-stone-800 dark:text-stone-100">
            Reunify
          </Text>
          <Text className="text-stone-500 dark:text-stone-400 text-sm mt-0.5">
            Your case organizer
          </Text>
        </View>
      </SafeAreaView>

      <DisclaimerBanner />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* AI Assistant Card */}
        <View className="mx-4 mt-4">
          <Pressable
            onPress={() => handleAIFeature('/ai-assistant')}
            className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-5 active:opacity-90"
            style={{
              backgroundColor: '#0d9488',
            }}
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
                <Sparkles size={24} color="#fff" />
              </View>
              <View className="flex-1 ml-4">
                <View className="flex-row items-center">
                  <Text className="text-white font-semibold text-lg">AI Assistant</Text>
                  {!isPremium && (
                    <View className="ml-2 bg-white/20 px-2 py-0.5 rounded-full">
                      <Text className="text-white text-xs font-medium">FREE</Text>
                    </View>
                  )}
                </View>
                <Text className="text-white/80 text-sm mt-0.5">
                  Explain terms free, plus pro AI tools
                </Text>
              </View>
              <ChevronRight size={24} color="#fff" />
            </View>
          </Pressable>
        </View>

        {/* AI Feature Cards */}
        <View className="mx-4 mt-3 flex-row">
          <Pressable
            onPress={() => handleAIFeature('/case-analysis')}
            className="flex-1 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mr-2 border border-amber-200/60 dark:border-amber-800/40 active:opacity-80"
          >
            <View className="flex-row items-center justify-between mb-2.5">
              <View className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/40 items-center justify-center">
                <TrendingUp size={18} color="#d97706" />
              </View>
              {!isPremium && (
                <View className="bg-amber-200/60 dark:bg-amber-800/40 px-1.5 py-0.5 rounded">
                  <Text className="text-amber-700 dark:text-amber-400 text-[10px] font-semibold">PRO</Text>
                </View>
              )}
            </View>
            <Text className="text-stone-800 dark:text-stone-100 font-semibold text-sm">
              Case Analysis
            </Text>
            <Text className="text-stone-500 dark:text-stone-400 text-xs mt-0.5">
              AI assessment
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleAIFeature('/task-suggestions')}
            className="flex-1 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl p-4 ml-2 border border-cyan-200/60 dark:border-cyan-800/40 active:opacity-80"
          >
            <View className="flex-row items-center justify-between mb-2.5">
              <View className="w-9 h-9 rounded-full bg-cyan-100 dark:bg-cyan-900/40 items-center justify-center">
                <Zap size={18} color="#0891b2" />
              </View>
              {!isPremium && (
                <View className="bg-cyan-200/60 dark:bg-cyan-800/40 px-1.5 py-0.5 rounded">
                  <Text className="text-cyan-700 dark:text-cyan-400 text-[10px] font-semibold">PRO</Text>
                </View>
              )}
            </View>
            <Text className="text-stone-800 dark:text-stone-100 font-semibold text-sm">
              Task Suggestions
            </Text>
            <Text className="text-stone-500 dark:text-stone-400 text-xs mt-0.5">
              AI recommendations
            </Text>
          </Pressable>
        </View>

        {/* Next Court Date Card */}
        <View className="mx-4 mt-4">
          <View className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/60 dark:border-stone-800">
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/40 items-center justify-center">
                <Calendar size={20} color="#0d9488" />
              </View>
              <Text className="text-stone-500 dark:text-stone-400 text-sm ml-3 font-medium">
                NEXT COURT DATE
              </Text>
            </View>

            {nextCourtDate ? (
              <View>
                <Text className="text-xl font-semibold text-stone-800 dark:text-stone-100">
                  {formatDate(nextCourtDate.date.toISOString())}
                </Text>
                <View className="flex-row items-center mt-2">
                  <View className="bg-teal-100 dark:bg-teal-900/40 px-2.5 py-1 rounded-full">
                    <Text className="text-teal-700 dark:text-teal-400 text-xs font-medium">
                      {getDaysUntil(nextCourtDate.date.toISOString())}
                    </Text>
                  </View>
                  <Text className="text-stone-500 dark:text-stone-400 text-sm ml-2">
                    {nextCourtDate.caseName}
                  </Text>
                </View>
              </View>
            ) : (
              <View>
                <Text className="text-stone-400 dark:text-stone-500 text-base">
                  No upcoming court dates
                </Text>
                <Text className="text-stone-400 dark:text-stone-600 text-sm mt-1">
                  Add a case with a hearing date to see it here
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Urgent Tasks */}
        <View className="mx-4 mt-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-stone-600 dark:text-stone-300 text-sm font-semibold uppercase tracking-wide">
              Priority Tasks
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/tasks')}
              className="flex-row items-center active:opacity-60"
            >
              <Text className="text-teal-600 dark:text-teal-400 text-sm">View All</Text>
              <ChevronRight size={16} color="#0d9488" />
            </Pressable>
          </View>

          {urgentTasks.length > 0 ? (
            <View className="space-y-2">
              {urgentTasks.map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => router.push('/(tabs)/tasks')}
                  className={`p-4 rounded-xl border ${getPriorityColor(task.priority)} active:opacity-80`}
                >
                  <View className="flex-row items-start">
                    <View className="mt-0.5">
                      {task.priority === 'urgent' ? (
                        <AlertCircle size={18} color="#dc2626" />
                      ) : (
                        <CheckCircle2 size={18} color="#6b7280" />
                      )}
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-stone-800 dark:text-stone-100 font-medium">
                        {task.title}
                      </Text>
                      <View className="flex-row items-center mt-1.5">
                        <Text className={`text-xs font-medium uppercase ${getPriorityTextColor(task.priority)}`}>
                          {task.priority}
                        </Text>
                        {task.dueDate && (
                          <View className="flex-row items-center ml-3">
                            <Clock size={12} color="#9ca3af" />
                            <Text className="text-stone-500 dark:text-stone-400 text-xs ml-1">
                              {getDaysUntil(task.dueDate)}
                            </Text>
                          </View>
                        )}
                        <Text className="text-stone-400 dark:text-stone-500 text-xs ml-3">
                          {getCaseName(task.caseId)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View className="bg-white dark:bg-stone-900 rounded-xl p-5 border border-stone-200/60 dark:border-stone-800 items-center">
              <CheckCircle2 size={32} color="#9ca3af" />
              <Text className="text-stone-400 dark:text-stone-500 text-sm mt-2 text-center">
                No pending tasks
              </Text>
              <Text className="text-stone-400 dark:text-stone-600 text-xs mt-1 text-center">
                Create a task to stay organized
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="mx-4 mt-5">
          <Text className="text-stone-600 dark:text-stone-300 text-sm font-semibold uppercase tracking-wide mb-3">
            Quick Actions
          </Text>

          <View className="flex-row space-x-3">
            <Pressable
              onPress={() => router.push('/(tabs)/tasks')}
              className="flex-1 bg-white dark:bg-stone-900 rounded-xl p-4 border border-stone-200/60 dark:border-stone-800 active:opacity-80"
            >
              <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 items-center justify-center mb-3">
                <Plus size={20} color="#2563eb" />
              </View>
              <Text className="text-stone-700 dark:text-stone-200 font-medium text-sm">
                Create Task
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(tabs)/documents')}
              className="flex-1 bg-white dark:bg-stone-900 rounded-xl p-4 border border-stone-200/60 dark:border-stone-800 active:opacity-80"
            >
              <View className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 items-center justify-center mb-3">
                <FileText size={20} color="#7c3aed" />
              </View>
              <Text className="text-stone-700 dark:text-stone-200 font-medium text-sm">
                Generate Doc
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(tabs)/evidence')}
              className="flex-1 bg-white dark:bg-stone-900 rounded-xl p-4 border border-stone-200/60 dark:border-stone-800 active:opacity-80"
            >
              <View className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 items-center justify-center mb-3">
                <Upload size={20} color="#059669" />
              </View>
              <Text className="text-stone-700 dark:text-stone-200 font-medium text-sm">
                Add Evidence
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Stats Overview */}
        <View className="mx-4 mt-5 mb-4">
          <View className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/60 dark:border-stone-800">
            <Text className="text-stone-600 dark:text-stone-300 text-sm font-semibold uppercase tracking-wide mb-4">
              Overview
            </Text>
            <View className="flex-row">
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {cases.length}
                </Text>
                <Text className="text-stone-500 dark:text-stone-400 text-xs mt-1">Cases</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {tasks.filter((t) => t.status !== 'completed').length}
                </Text>
                <Text className="text-stone-500 dark:text-stone-400 text-xs mt-1">Open Tasks</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {documents.length}
                </Text>
                <Text className="text-stone-500 dark:text-stone-400 text-xs mt-1">Documents</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {evidence.length}
                </Text>
                <Text className="text-stone-500 dark:text-stone-400 text-xs mt-1">Evidence</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
