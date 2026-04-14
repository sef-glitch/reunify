import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Sparkles, FileText, HelpCircle, ChevronRight, CheckCircle2, AlertTriangle, Lightbulb, Edit3, Eye, TrendingUp, Zap } from 'lucide-react-native';
import { useAuth, Case } from '@/lib/auth-context';
import * as Haptics from 'expo-haptics';
import {
  generateActionPlan,
  generateDocumentDraft,
  explainTerm,
  isAIServiceAvailable,
  ActionPlan,
  DocumentDraft,
  Explanation,
} from '@/lib/ai-service';
import { useMutation } from '@tanstack/react-query';
import { useSubscription } from '@/lib/useSubscription';

type AIMode = 'plan' | 'doc' | 'explain' | null;

export default function AIAssistantScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; caseId?: string }>();
  const { cases, addTask, addDocument, refreshData } = useAuth();
  const { isPremium, requirePremium } = useSubscription();

  const [selectedMode, setSelectedMode] = useState<AIMode>((params.mode as AIMode) || null);
  const [selectedCase, setSelectedCase] = useState<Case | null>(
    params.caseId ? cases.find((c) => c.id === params.caseId) ?? null : null
  );
  const [additionalContext, setAdditionalContext] = useState('');
  const [termToExplain, setTermToExplain] = useState('');
  const [docType, setDocType] = useState<'letter' | 'declaration' | 'log' | 'request' | 'other'>('letter');
  const [docNotes, setDocNotes] = useState('');
  const [docTitle, setDocTitle] = useState('');

  const [planResult, setPlanResult] = useState<ActionPlan | null>(null);
  const [docResult, setDocResult] = useState<DocumentDraft | null>(null);
  const [explainResult, setExplainResult] = useState<Explanation | null>(null);

  // Review mode for documents
  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [editedDocTitle, setEditedDocTitle] = useState('');
  const [editedDocContent, setEditedDocContent] = useState('');

  const aiAvailable = isAIServiceAvailable();

  // Plan mutation
  const planMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCase) throw new Error('Please select a case');
      return generateActionPlan({
        name: selectedCase.name,
        state: selectedCase.state,
        county: selectedCase.county,
        caseType: selectedCase.caseType,
        stage: selectedCase.stage,
        nextHearingDate: selectedCase.nextHearingDate,
        goals: selectedCase.goals,
        additionalContext: additionalContext || undefined,
      });
    },
    onSuccess: (data) => {
      setPlanResult(data);
    },
    onError: (error) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to generate plan');
    },
  });

  // Document mutation
  const docMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCase) throw new Error('Please select a case');
      if (!docNotes.trim()) throw new Error('Please provide instructions for the document');
      return generateDocumentDraft(
        docType,
        {
          caseType: selectedCase.caseType,
          stage: selectedCase.stage,
          state: selectedCase.state,
          county: selectedCase.county,
          goals: selectedCase.goals,
        },
        docNotes,
        docTitle || undefined
      );
    },
    onSuccess: (data) => {
      setDocResult(data);
      // Initialize edit state with generated content
      setEditedDocTitle(data.title || 'Document Draft');
      setEditedDocContent(data.content || '');
      setIsEditingDoc(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to generate document');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  // Explain mutation
  const explainMutation = useMutation({
    mutationFn: async () => {
      if (!termToExplain.trim()) throw new Error('Please enter a term or text to explain');
      return explainTerm(termToExplain);
    },
    onSuccess: (data) => {
      setExplainResult(data);
    },
    onError: (error) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to generate explanation');
    },
  });

  const handleSavePlanTasks = useCallback(() => {
    if (!planResult || !selectedCase || !planResult.tasks) return;

    for (const task of planResult.tasks) {
      addTask({
        caseId: selectedCase.id,
        title: task.title || 'Untitled Task',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: 'pending',
        dueDate: task.suggestedDeadline || null,
      });
    }

    refreshData();
    Alert.alert('Success', `${planResult.tasks.length} tasks added to your case!`, [
      { text: 'View Tasks', onPress: () => router.push('/(tabs)/tasks') },
      { text: 'OK' },
    ]);
  }, [planResult, selectedCase, addTask, refreshData, router]);

  const handleSaveDocument = useCallback(() => {
    if (!docResult || !selectedCase) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    addDocument({
      caseId: selectedCase.id,
      title: editedDocTitle || docResult.title,
      category: docResult.category,
      content: editedDocContent || docResult.content,
    });

    refreshData();
    Alert.alert('Success', 'Document saved to your library!', [
      { text: 'View Documents', onPress: () => router.push('/(tabs)/documents') },
      { text: 'OK' },
    ]);
  }, [docResult, selectedCase, editedDocTitle, editedDocContent, addDocument, refreshData, router]);

  const renderModeSelector = () => (
    <View className="px-5 pt-5">
      <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-4">
        How can I help you today?
      </Text>

      <Pressable
        onPress={() => {
          if (requirePremium()) {
            setSelectedMode('plan');
          }
        }}
        className="bg-white dark:bg-stone-900 rounded-xl p-4 mb-3 border border-stone-200/60 dark:border-stone-800 active:opacity-80"
      >
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 items-center justify-center">
            <Sparkles size={24} color="#2563eb" />
          </View>
          <View className="flex-1 ml-4">
            <View className="flex-row items-center">
              <Text className="font-semibold text-stone-800 dark:text-stone-100">Generate Action Plan</Text>
              {!isPremium && (
                <View className="ml-2 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                  <Text className="text-amber-700 dark:text-amber-400 text-[10px] font-semibold">PRO</Text>
                </View>
              )}
            </View>
            <Text className="text-stone-500 dark:text-stone-400 text-sm mt-0.5">
              Get a prioritized task list and evidence to gather
            </Text>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </View>
      </Pressable>

      <Pressable
        onPress={() => {
          if (requirePremium()) {
            setSelectedMode('doc');
          }
        }}
        className="bg-white dark:bg-stone-900 rounded-xl p-4 mb-3 border border-stone-200/60 dark:border-stone-800 active:opacity-80"
      >
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 items-center justify-center">
            <FileText size={24} color="#7c3aed" />
          </View>
          <View className="flex-1 ml-4">
            <View className="flex-row items-center">
              <Text className="font-semibold text-stone-800 dark:text-stone-100">Draft a Document</Text>
              {!isPremium && (
                <View className="ml-2 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                  <Text className="text-amber-700 dark:text-amber-400 text-[10px] font-semibold">PRO</Text>
                </View>
              )}
            </View>
            <Text className="text-stone-500 dark:text-stone-400 text-sm mt-0.5">
              Create letters, declarations, or requests
            </Text>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </View>
      </Pressable>

      <Pressable
        onPress={() => setSelectedMode('explain')}
        className="bg-white dark:bg-stone-900 rounded-xl p-4 mb-3 border border-teal-200/60 dark:border-teal-800/40 active:opacity-80"
      >
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 items-center justify-center">
            <HelpCircle size={24} color="#059669" />
          </View>
          <View className="flex-1 ml-4">
            <View className="flex-row items-center">
              <Text className="font-semibold text-stone-800 dark:text-stone-100">Explain a Term</Text>
              <View className="ml-2 bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded">
                <Text className="text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold">FREE</Text>
              </View>
            </View>
            <Text className="text-stone-500 dark:text-stone-400 text-sm mt-0.5">
              Understand legal terms in plain language
            </Text>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </View>
      </Pressable>

      <Pressable
        onPress={() => {
          if (requirePremium()) {
            router.back();
            setTimeout(() => router.push('/case-analysis'), 100);
          }
        }}
        className="bg-white dark:bg-stone-900 rounded-xl p-4 mb-3 border border-stone-200/60 dark:border-stone-800 active:opacity-80"
      >
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 items-center justify-center">
            <TrendingUp size={24} color="#d97706" />
          </View>
          <View className="flex-1 ml-4">
            <View className="flex-row items-center">
              <Text className="font-semibold text-stone-800 dark:text-stone-100">Analyze My Case</Text>
              {!isPremium && (
                <View className="ml-2 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                  <Text className="text-amber-700 dark:text-amber-400 text-[10px] font-semibold">PRO</Text>
                </View>
              )}
            </View>
            <Text className="text-stone-500 dark:text-stone-400 text-sm mt-0.5">
              Get an AI assessment of your case preparation
            </Text>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </View>
      </Pressable>

      <Pressable
        onPress={() => {
          if (requirePremium()) {
            router.back();
            setTimeout(() => router.push('/task-suggestions'), 100);
          }
        }}
        className="bg-white dark:bg-stone-900 rounded-xl p-4 mb-3 border border-stone-200/60 dark:border-stone-800 active:opacity-80"
      >
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-900/40 items-center justify-center">
            <Zap size={24} color="#0891b2" />
          </View>
          <View className="flex-1 ml-4">
            <View className="flex-row items-center">
              <Text className="font-semibold text-stone-800 dark:text-stone-100">Suggest Tasks</Text>
              {!isPremium && (
                <View className="ml-2 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                  <Text className="text-amber-700 dark:text-amber-400 text-[10px] font-semibold">PRO</Text>
                </View>
              )}
            </View>
            <Text className="text-stone-500 dark:text-stone-400 text-sm mt-0.5">
              AI-powered task recommendations for your case
            </Text>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </View>
      </Pressable>
    </View>
  );

  const renderPlanForm = () => (
    <View className="px-5 pt-5">
      <Text className="text-xl font-semibold text-stone-800 dark:text-stone-100 mb-4">
        Generate Action Plan
      </Text>

      {/* Case Selection */}
      <View className="mb-5">
        <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
          Select Case *
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
          {cases.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => setSelectedCase(c)}
              className={`mr-2 px-4 py-2.5 rounded-full border ${
                selectedCase?.id === c.id
                  ? 'bg-teal-100 dark:bg-teal-900/40 border-teal-300 dark:border-teal-700'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
              }`}
            >
              <Text className={`text-sm ${
                selectedCase?.id === c.id
                  ? 'text-teal-700 dark:text-teal-400 font-medium'
                  : 'text-stone-600 dark:text-stone-300'
              }`}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {selectedCase && (
        <View className="bg-stone-100 dark:bg-stone-800/50 rounded-xl p-4 mb-5">
          <Text className="text-stone-500 dark:text-stone-400 text-xs font-medium uppercase mb-2">
            Case Details
          </Text>
          <Text className="text-stone-700 dark:text-stone-200 text-sm">
            Type: {selectedCase.caseType} | Stage: {selectedCase.stage}
          </Text>
          <Text className="text-stone-700 dark:text-stone-200 text-sm">
            Location: {selectedCase.county}, {selectedCase.state}
          </Text>
          {selectedCase.goals.length > 0 && (
            <Text className="text-stone-700 dark:text-stone-200 text-sm mt-1">
              Goals: {selectedCase.goals.join(', ')}
            </Text>
          )}
        </View>
      )}

      {/* Additional Context */}
      <View className="mb-5">
        <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
          Additional Context (optional)
        </Text>
        <TextInput
          value={additionalContext}
          onChangeText={setAdditionalContext}
          placeholder="Any specific concerns or recent developments..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 text-stone-800 dark:text-stone-100 min-h-[80px]"
        />
      </View>

      <Pressable
        onPress={() => planMutation.mutate()}
        disabled={!selectedCase || planMutation.isPending}
        className={`py-4 rounded-xl items-center ${
          selectedCase && !planMutation.isPending
            ? 'bg-teal-600 dark:bg-teal-500 active:opacity-80'
            : 'bg-stone-300 dark:bg-stone-700'
        }`}
      >
        {planMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold">Generate Plan</Text>
        )}
      </Pressable>
    </View>
  );

  const renderPlanResult = () => {
    if (!planResult) return null;

    return (
      <View className="px-5 pt-5">
        <View className="flex-row items-center mb-4">
          <CheckCircle2 size={24} color="#0d9488" />
          <Text className="text-xl font-semibold text-stone-800 dark:text-stone-100 ml-2">
            Your Action Plan
          </Text>
        </View>

        <View className="bg-stone-100 dark:bg-stone-800/50 rounded-xl p-4 mb-5">
          <Text className="text-stone-700 dark:text-stone-200 text-sm">{planResult.summary || 'Action plan generated successfully.'}</Text>
        </View>

        {/* Tasks */}
        <Text className="text-stone-600 dark:text-stone-300 text-sm font-semibold uppercase mb-3">
          Tasks ({planResult.tasks?.length || 0})
        </Text>
        {(planResult.tasks || []).map((task, i) => (
          <View
            key={i}
            className="bg-white dark:bg-stone-900 rounded-xl p-4 mb-2 border border-stone-200/60 dark:border-stone-800"
          >
            <View className="flex-row items-start">
              <View className={`px-2 py-0.5 rounded-full ${
                task.priority === 'urgent' ? 'bg-red-100 dark:bg-red-900/40' :
                task.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/40' :
                task.priority === 'medium' ? 'bg-blue-100 dark:bg-blue-900/40' :
                'bg-stone-100 dark:bg-stone-800'
              }`}>
                <Text className={`text-xs font-medium ${
                  task.priority === 'urgent' ? 'text-red-700 dark:text-red-400' :
                  task.priority === 'high' ? 'text-orange-700 dark:text-orange-400' :
                  task.priority === 'medium' ? 'text-blue-700 dark:text-blue-400' :
                  'text-stone-600 dark:text-stone-400'
                }`}>
                  {task.priority?.toUpperCase() || 'MEDIUM'}
                </Text>
              </View>
            </View>
            <Text className="font-medium text-stone-800 dark:text-stone-100 mt-2">{task.title || 'Untitled Task'}</Text>
            <Text className="text-stone-500 dark:text-stone-400 text-sm mt-1">{task.description || ''}</Text>
            {task.suggestedDeadline && (
              <Text className="text-stone-400 dark:text-stone-500 text-xs mt-2">
                Suggested deadline: {new Date(task.suggestedDeadline).toLocaleDateString()}
              </Text>
            )}
          </View>
        ))}

        {/* Evidence to Gather */}
        {planResult.evidenceToGather && planResult.evidenceToGather.length > 0 && (
          <>
            <Text className="text-stone-600 dark:text-stone-300 text-sm font-semibold uppercase mt-5 mb-3">
              Evidence to Gather
            </Text>
            {planResult.evidenceToGather.map((evidence, i) => (
              <View
                key={i}
                className="bg-white dark:bg-stone-900 rounded-xl p-4 mb-2 border border-stone-200/60 dark:border-stone-800"
              >
                <View className="flex-row items-center">
                  <View className={`px-2 py-0.5 rounded-full ${
                    evidence.importance === 'essential' ? 'bg-red-100 dark:bg-red-900/40' :
                    evidence.importance === 'recommended' ? 'bg-blue-100 dark:bg-blue-900/40' :
                    'bg-stone-100 dark:bg-stone-800'
                  }`}>
                    <Text className={`text-xs font-medium ${
                      evidence.importance === 'essential' ? 'text-red-700 dark:text-red-400' :
                      evidence.importance === 'recommended' ? 'text-blue-700 dark:text-blue-400' :
                      'text-stone-600 dark:text-stone-400'
                    }`}>
                      {evidence.importance?.toUpperCase() || 'HELPFUL'}
                    </Text>
                  </View>
                  <Text className="font-medium text-stone-800 dark:text-stone-100 ml-2">{evidence.type || 'Evidence'}</Text>
                </View>
                <Text className="text-stone-500 dark:text-stone-400 text-sm mt-2">{evidence.description || ''}</Text>
              </View>
            ))}
          </>
        )}

        {/* Disclaimer */}
        <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mt-5">
          <View className="flex-row items-center mb-2">
            <AlertTriangle size={18} color="#d97706" />
            <Text className="font-medium text-amber-700 dark:text-amber-400 ml-2">Important</Text>
          </View>
          <Text className="text-amber-700 dark:text-amber-400 text-xs">{planResult.disclaimer || 'This is not legal advice. Please consult with a qualified attorney.'}</Text>
        </View>

        {/* Save Button */}
        <Pressable
          onPress={handleSavePlanTasks}
          className="bg-teal-600 dark:bg-teal-500 py-4 rounded-xl items-center mt-5 mb-10 active:opacity-80"
        >
          <Text className="text-white font-semibold">Save {planResult.tasks?.length || 0} Tasks to Case</Text>
        </Pressable>
      </View>
    );
  };

  const renderDocForm = () => (
    <View className="px-5 pt-5">
      <Text className="text-xl font-semibold text-stone-800 dark:text-stone-100 mb-4">
        Draft a Document
      </Text>

      {/* Case Selection */}
      <View className="mb-5">
        <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
          Select Case *
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
          {cases.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => setSelectedCase(c)}
              className={`mr-2 px-4 py-2.5 rounded-full border ${
                selectedCase?.id === c.id
                  ? 'bg-teal-100 dark:bg-teal-900/40 border-teal-300 dark:border-teal-700'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
              }`}
            >
              <Text className={`text-sm ${
                selectedCase?.id === c.id
                  ? 'text-teal-700 dark:text-teal-400 font-medium'
                  : 'text-stone-600 dark:text-stone-300'
              }`}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Document Type */}
      <View className="mb-5">
        <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
          Document Type
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
          {(['letter', 'declaration', 'log', 'request', 'other'] as const).map((type) => (
            <Pressable
              key={type}
              onPress={() => setDocType(type)}
              className={`mr-2 px-4 py-2.5 rounded-full border ${
                docType === type
                  ? 'bg-teal-100 dark:bg-teal-900/40 border-teal-300 dark:border-teal-700'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
              }`}
            >
              <Text className={`text-sm capitalize ${
                docType === type
                  ? 'text-teal-700 dark:text-teal-400 font-medium'
                  : 'text-stone-600 dark:text-stone-300'
              }`}>
                {type}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Document Title */}
      <View className="mb-5">
        <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
          Document Title (optional)
        </Text>
        <TextInput
          value={docTitle}
          onChangeText={setDocTitle}
          placeholder="e.g., Letter to Court Regarding Visitation"
          placeholderTextColor="#9ca3af"
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 text-stone-800 dark:text-stone-100"
        />
      </View>

      {/* Instructions */}
      <View className="mb-5">
        <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
          Instructions / Notes *
        </Text>
        <TextInput
          value={docNotes}
          onChangeText={setDocNotes}
          placeholder="Describe what you want the document to say..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 text-stone-800 dark:text-stone-100 min-h-[120px]"
        />
      </View>

      <Pressable
        onPress={() => docMutation.mutate()}
        disabled={!selectedCase || !docNotes.trim() || docMutation.isPending}
        className={`py-4 rounded-xl items-center ${
          selectedCase && docNotes.trim() && !docMutation.isPending
            ? 'bg-teal-600 dark:bg-teal-500 active:opacity-80'
            : 'bg-stone-300 dark:bg-stone-700'
        }`}
      >
        {docMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold">Generate Document</Text>
        )}
      </Pressable>
    </View>
  );

  const renderDocResult = () => {
    if (!docResult) return null;

    return (
      <View className="px-5 pt-5">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <CheckCircle2 size={24} color="#0d9488" />
            <Text className="text-xl font-semibold text-stone-800 dark:text-stone-100 ml-2">
              {isEditingDoc ? 'Edit Document' : 'Review Document'}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              setIsEditingDoc(!isEditingDoc);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="flex-row items-center px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 active:opacity-80"
            accessibilityLabel={isEditingDoc ? 'Preview document' : 'Edit document'}
            accessibilityRole="button"
          >
            {isEditingDoc ? (
              <>
                <Eye size={16} color="#6b7280" />
                <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium ml-1.5">Preview</Text>
              </>
            ) : (
              <>
                <Edit3 size={16} color="#6b7280" />
                <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium ml-1.5">Edit</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Review/Edit Notice */}
        <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-4">
          <Text className="text-blue-700 dark:text-blue-400 text-sm">
            {isEditingDoc
              ? 'Make any changes you need. Your edits will be saved with the document.'
              : 'Review this AI-generated draft carefully before saving. Tap Edit to make changes.'}
          </Text>
        </View>

        {isEditingDoc ? (
          // Edit Mode
          <View className="mb-5">
            <View className="mb-4">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                Document Title
              </Text>
              <TextInput
                value={editedDocTitle}
                onChangeText={setEditedDocTitle}
                placeholder="Enter document title"
                placeholderTextColor="#9ca3af"
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 text-stone-800 dark:text-stone-100"
                accessibilityLabel="Document title"
              />
            </View>
            <View>
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                Document Content
              </Text>
              <TextInput
                value={editedDocContent}
                onChangeText={setEditedDocContent}
                placeholder="Enter document content"
                placeholderTextColor="#9ca3af"
                multiline
                textAlignVertical="top"
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 text-stone-800 dark:text-stone-100 min-h-[300px]"
                accessibilityLabel="Document content"
              />
            </View>
          </View>
        ) : (
          // Preview Mode
          <View className="bg-white dark:bg-stone-900 rounded-xl p-4 mb-5 border border-stone-200/60 dark:border-stone-800">
            <Text className="font-medium text-stone-800 dark:text-stone-100 mb-3">{editedDocTitle || 'Document Draft'}</Text>
            <Text className="text-stone-700 dark:text-stone-200 text-sm leading-6">{editedDocContent || ''}</Text>
          </View>
        )}

        {/* Disclaimer */}
        <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-5">
          <View className="flex-row items-center mb-2">
            <AlertTriangle size={18} color="#d97706" />
            <Text className="font-medium text-amber-700 dark:text-amber-400 ml-2">Review Required</Text>
          </View>
          <Text className="text-amber-700 dark:text-amber-400 text-xs">
            This is an AI-generated draft. Always review and edit before using. Verify all facts, dates, and legal language with a qualified professional.
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row space-x-3 mb-10">
          <Pressable
            onPress={() => {
              setDocResult(null);
              setIsEditingDoc(false);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="flex-1 py-4 rounded-xl items-center border border-stone-300 dark:border-stone-600 active:opacity-80"
            accessibilityLabel="Discard and regenerate"
            accessibilityRole="button"
          >
            <Text className="text-stone-600 dark:text-stone-300 font-semibold">Regenerate</Text>
          </Pressable>
          <Pressable
            onPress={handleSaveDocument}
            className="flex-1 bg-teal-600 dark:bg-teal-500 py-4 rounded-xl items-center active:opacity-80"
            accessibilityLabel="Save document to library"
            accessibilityRole="button"
          >
            <Text className="text-white font-semibold">Save Document</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderExplainForm = () => (
    <View className="px-5 pt-5">
      <Text className="text-xl font-semibold text-stone-800 dark:text-stone-100 mb-4">
        Explain a Term
      </Text>

      <View className="mb-5">
        <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
          Term or Text to Explain *
        </Text>
        <TextInput
          value={termToExplain}
          onChangeText={setTermToExplain}
          placeholder='e.g., "ex parte motion" or paste court document text...'
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 text-stone-800 dark:text-stone-100 min-h-[120px]"
        />
      </View>

      <Pressable
        onPress={() => explainMutation.mutate()}
        disabled={!termToExplain.trim() || explainMutation.isPending}
        className={`py-4 rounded-xl items-center ${
          termToExplain.trim() && !explainMutation.isPending
            ? 'bg-teal-600 dark:bg-teal-500 active:opacity-80'
            : 'bg-stone-300 dark:bg-stone-700'
        }`}
      >
        {explainMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold">Explain</Text>
        )}
      </Pressable>
    </View>
  );

  const renderExplainResult = () => {
    if (!explainResult) return null;

    return (
      <View className="px-5 pt-5">
        <View className="flex-row items-center mb-4">
          <CheckCircle2 size={24} color="#0d9488" />
          <Text className="text-xl font-semibold text-stone-800 dark:text-stone-100 ml-2">
            Explanation
          </Text>
        </View>

        {/* Plain Language Explanation */}
        <View className="bg-white dark:bg-stone-900 rounded-xl p-4 mb-4 border border-stone-200/60 dark:border-stone-800">
          <Text className="text-stone-700 dark:text-stone-200 leading-6">{explainResult.plainLanguageExplanation || 'No explanation available.'}</Text>
        </View>

        {/* Key Points */}
        {explainResult.keyPoints && explainResult.keyPoints.length > 0 && (
          <View className="mb-4">
            <Text className="text-stone-600 dark:text-stone-300 text-sm font-semibold uppercase mb-3">
              Key Points
            </Text>
            {explainResult.keyPoints.filter(Boolean).map((point, i) => (
              <View key={i} className="flex-row items-start mb-2">
                <View className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/40 items-center justify-center mt-0.5">
                  <Text className="text-teal-700 dark:text-teal-400 text-xs font-medium">{i + 1}</Text>
                </View>
                <Text className="flex-1 ml-3 text-stone-700 dark:text-stone-200 text-sm">{point}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Questions to Ask */}
        {explainResult.questionsToAsk && explainResult.questionsToAsk.length > 0 && (
          <View className="mb-4">
            <View className="flex-row items-center mb-3">
              <Lightbulb size={18} color="#0d9488" />
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-semibold uppercase ml-2">
                Questions to Ask Your Lawyer/Advocate
              </Text>
            </View>
            {explainResult.questionsToAsk.filter(Boolean).map((q, i) => (
              <View key={i} className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-3 mb-2">
                <Text className="text-teal-800 dark:text-teal-300 text-sm">{q}</Text>
              </View>
            ))}
          </View>
        )}

        {/* What to Verify */}
        {explainResult.whatToVerify && explainResult.whatToVerify.length > 0 && (
          <View className="mb-4">
            <Text className="text-stone-600 dark:text-stone-300 text-sm font-semibold uppercase mb-3">
              Verify in Official Sources
            </Text>
            {explainResult.whatToVerify.filter(Boolean).map((item, i) => (
              <View key={i} className="flex-row items-start mb-2">
                <View className="w-2 h-2 rounded-full bg-stone-400 mt-2" />
                <Text className="flex-1 ml-3 text-stone-700 dark:text-stone-200 text-sm">{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Disclaimer */}
        <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mt-2 mb-10">
          <View className="flex-row items-center mb-2">
            <AlertTriangle size={18} color="#d97706" />
            <Text className="font-medium text-amber-700 dark:text-amber-400 ml-2">Important</Text>
          </View>
          <Text className="text-amber-700 dark:text-amber-400 text-xs">{explainResult.disclaimer || 'This is not legal advice. Please consult with a qualified attorney.'}</Text>
        </View>
      </View>
    );
  };

  const isLoading = planMutation.isPending || docMutation.isPending || explainMutation.isPending;
  const hasResult = planResult || docResult || explainResult;

  const handleBack = () => {
    if (hasResult) {
      setPlanResult(null);
      setDocResult(null);
      setExplainResult(null);
    } else if (selectedMode) {
      setSelectedMode(null);
    } else {
      router.back();
    }
  };

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <SafeAreaView edges={['top']} className="bg-stone-50 dark:bg-stone-950">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800">
          <Pressable onPress={handleBack} className="active:opacity-60">
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-lg font-semibold text-stone-800 dark:text-stone-100">
            AI Assistant
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
          {!selectedMode && !hasResult && renderModeSelector()}

          {selectedMode === 'plan' && !planResult && renderPlanForm()}
          {planResult && renderPlanResult()}

          {selectedMode === 'doc' && !docResult && renderDocForm()}
          {docResult && renderDocResult()}

          {selectedMode === 'explain' && !explainResult && renderExplainForm()}
          {explainResult && renderExplainResult()}
        </ScrollView>
      )}
    </View>
  );
}
