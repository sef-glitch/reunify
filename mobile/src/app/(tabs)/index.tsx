import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, CheckCircle2, Plus, FileText, Upload, ChevronRight, AlertCircle, Clock, Sparkles, TrendingUp, Zap } from 'lucide-react-native';
import { useAuth, Task } from '@/lib/auth-context';
import { useSubscription } from '@/lib/useSubscription';

export default function DashboardScreen() {
  const router = useRouter();
  const { cases, tasks, documents, evidence } = useAuth();
  const { isPremium, requirePremium } = useSubscription();

  const handleAIFeature = (route: '/ai-assistant' | '/case-analysis' | '/task-suggestions') => {
    if (route === '/ai-assistant') {
      router.push(route);
      return;
    }
    if (route !== '/ai-assistant' && !requirePremium()) {
      return;
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
      month: 'long',
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

  const getPriorityStyle = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return { bg: 'bg-red-50', border: 'border-red-100', dot: '#ef4444', text: 'text-red-600' };
      case 'high': return { bg: 'bg-amber-50', border: 'border-amber-100', dot: '#f59e0b', text: 'text-amber-700' };
      case 'medium': return { bg: 'bg-sky-50', border: 'border-sky-100', dot: '#0ea5e9', text: 'text-sky-700' };
      default: return { bg: 'bg-stone-50', border: 'border-stone-100', dot: '#a8a29e', text: 'text-stone-500' };
    }
  };

  const openTasks = tasks.filter((t) => t.status !== 'completed').length;

  return (
    <View className="flex-1 bg-stone-50">
      <SafeAreaView edges={['top']} className="bg-stone-50">
        {/* Header */}
        <View className="px-6 pt-5 pb-4">
          <Text className="text-3xl font-bold text-stone-800">
            Reunify
          </Text>
          <Text className="text-stone-400 text-base mt-0.5">
            Your case at a glance
          </Text>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Court Date Hero Card */}
          <View className="px-5 mt-1">
            <Pressable
              onPress={() => router.push('/(tabs)/cases')}
              className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100 active:opacity-90"
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-2xl bg-teal-50 items-center justify-center mr-3">
                    <Calendar size={20} color="#0d9488" strokeWidth={1.8} />
                  </View>
                  <Text className="text-stone-400 text-xs font-medium uppercase tracking-widest">Next Hearing</Text>
                </View>
                {nextCourtDate && (
                  <View className="bg-teal-50 px-3 py-1 rounded-full">
                    <Text className="text-teal-600 text-xs font-semibold">{getDaysUntil(nextCourtDate.date.toISOString())}</Text>
                  </View>
                )}
              </View>
              {nextCourtDate ? (
                <View>
                  <Text className="text-xl font-semibold text-stone-800">{formatDate(nextCourtDate.date.toISOString())}</Text>
                  <Text className="text-stone-400 text-sm mt-1">{nextCourtDate.caseName}</Text>
                </View>
              ) : (
                <View className="flex-row items-center">
                  <Text className="text-stone-400 text-sm flex-1">No upcoming hearings</Text>
                  <ChevronRight size={16} color="#d6d3d1" />
                </View>
              )}
            </Pressable>
          </View>

          {/* AI Card */}
          <View className="px-5 mt-4">
            <Pressable
              onPress={() => handleAIFeature('/ai-assistant')}
              className="rounded-3xl overflow-hidden active:opacity-95"
              style={{ shadowColor: '#0d9488', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 3 }}
            >
              <View className="bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-500 p-5">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center">
                      <Sparkles size={22} color="#fff" />
                    </View>
                    <View className="ml-3">
                      <Text className="text-white font-bold text-lg">AI Assistant</Text>
                      {!isPremium && (
                        <View className="bg-white/20 rounded-full px-2 py-0.5 mt-1 self-start">
                          <Text className="text-white/80 text-xs font-medium">Free to try</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                    <ChevronRight size={18} color="#fff" />
                  </View>
                </View>
                <Text className="text-teal-50 text-sm leading-5">
                  {isPremium
                    ? 'All AI tools unlocked'
                    : 'Explain legal terms free · Try pro features'}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Priority Tasks */}
          {urgentTasks.length > 0 && (
            <View className="mt-6 px-5">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-stone-700 text-base font-semibold">Priority Tasks</Text>
                <Pressable onPress={() => router.push('/(tabs)/tasks')}>
                  <Text className="text-teal-600 text-sm font-medium">See all</Text>
                </Pressable>
              </View>
              <View className="bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm">
                {urgentTasks.map((task, index) => {
                  const style = getPriorityStyle(task.priority);
                  return (
                    <Pressable
                      key={task.id}
                      onPress={() => router.push('/(tabs)/tasks')}
                      className={`p-4 flex-row items-center ${index < urgentTasks.length - 1 ? 'border-b border-stone-50' : ''} active:bg-stone-50`}
                    >
                      <View className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: style.dot }} />
                      <View className="flex-1">
                        <Text className="text-stone-800 font-medium text-sm">{task.title}</Text>
                        <View className="flex-row items-center mt-1">
                          <Text className={`text-xs font-medium uppercase ${style.text}`}>{task.priority}</Text>
                          {task.dueDate && (
                            <>
                              <Text className="text-stone-300 mx-2">·</Text>
                              <Clock size={11} color="#a8a29e" />
                              <Text className="text-stone-400 text-xs ml-1">{getDaysUntil(task.dueDate)}</Text>
                            </>
                          )}
                        </View>
                      </View>
                      <ChevronRight size={16} color="#d6d3d1" />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {urgentTasks.length === 0 && (
            <View className="mx-5 mt-6 bg-white rounded-2xl p-5 border border-stone-100 shadow-sm items-center">
              <View className="w-12 h-12 rounded-full bg-stone-50 items-center justify-center mb-3">
                <CheckCircle2 size={24} color="#d6d3d1" strokeWidth={1.5} />
              </View>
              <Text className="text-stone-600 font-medium">All caught up</Text>
              <Text className="text-stone-400 text-sm text-center mt-1">No pending tasks right now</Text>
            </View>
          )}

          {/* Quick Actions */}
          <View className="mt-6 px-5">
            <Text className="text-stone-700 text-base font-semibold mb-3">Quick Actions</Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => router.push('/(tabs)/tasks')}
                className="flex-1 bg-white rounded-2xl p-4 border border-stone-100 shadow-sm active:bg-stone-50"
              >
                <View className="w-10 h-10 rounded-xl bg-sky-50 items-center justify-center mb-3">
                  <Plus size={20} color="#0ea5e9" strokeWidth={1.8} />
                </View>
                <Text className="text-stone-700 font-semibold text-sm">New Task</Text>
                <Text className="text-stone-400 text-xs mt-1">Add to your checklist</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/(tabs)/documents')}
                className="flex-1 bg-white rounded-2xl p-4 border border-stone-100 shadow-sm active:bg-stone-50"
              >
                <View className="w-10 h-10 rounded-xl bg-violet-50 items-center justify-center mb-3">
                  <FileText size={20} color="#7c3aed" strokeWidth={1.8} />
                </View>
                <Text className="text-stone-700 font-semibold text-sm">Documents</Text>
                <Text className="text-stone-400 text-xs mt-1">Create or browse</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/(tabs)/evidence')}
                className="flex-1 bg-white rounded-2xl p-4 border border-stone-100 shadow-sm active:bg-stone-50"
              >
                <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center mb-3">
                  <Upload size={20} color="#059669" strokeWidth={1.8} />
                </View>
                <Text className="text-stone-700 font-semibold text-sm">Evidence</Text>
                <Text className="text-stone-400 text-xs mt-1">Upload files</Text>
              </Pressable>
            </View>
          </View>

          {/* Overview Stats */}
          <View className="mx-5 mt-6 mb-4">
            <View className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-3xl p-5 shadow-lg">
              <Text className="text-stone-400 text-xs font-medium uppercase tracking-widest mb-4">Your Progress</Text>
              <View className="flex-row justify-between">
                <View className="items-center flex-1">
                  <Text className="text-3xl font-bold text-white">{cases.length}</Text>
                  <Text className="text-stone-400 text-xs mt-1">Cases</Text>
                </View>
                <View className="w-px bg-stone-700" />
                <View className="items-center flex-1">
                  <Text className="text-3xl font-bold text-white">{openTasks}</Text>
                  <Text className="text-stone-400 text-xs mt-1">Open Tasks</Text>
                </View>
                <View className="w-px bg-stone-700" />
                <View className="items-center flex-1">
                  <Text className="text-3xl font-bold text-white">{documents.length}</Text>
                  <Text className="text-stone-400 text-xs mt-1">Docs</Text>
                </View>
                <View className="w-px bg-stone-700" />
                <View className="items-center flex-1">
                  <Text className="text-3xl font-bold text-white">{evidence.length}</Text>
                  <Text className="text-stone-400 text-xs mt-1">Evidence</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Disclaimer footer */}
          <View className="mx-5 mb-8 items-center">
            <Text className="text-stone-300 text-xs text-center">
              Reunify provides organizational support only — not legal advice.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
