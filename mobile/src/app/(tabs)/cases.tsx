import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, ChevronRight, Briefcase, X, Calendar, MapPin, Target } from 'lucide-react-native';
import { useAuth, Case } from '@/lib/auth-context';

const CASE_TYPES = [
  { value: 'custody', label: 'Custody' },
  { value: 'cps', label: 'CPS' },
  { value: 'visitation', label: 'Visitation' },
  { value: 'modification', label: 'Modification' },
  { value: 'other', label: 'Other' },
] as const;

const CASE_STAGES = [
  { value: 'initial', label: 'Initial Filing' },
  { value: 'discovery', label: 'Discovery' },
  { value: 'mediation', label: 'Mediation' },
  { value: 'trial', label: 'Trial' },
  { value: 'appeals', label: 'Appeals' },
  { value: 'closed', label: 'Closed' },
] as const;

type CaseType = Case['caseType'];
type CaseStage = Case['stage'];

export default function CasesScreen() {
  const { cases, addCase, updateCase, deleteCase } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    state: '',
    county: '',
    caseType: 'custody' as CaseType,
    stage: 'initial' as CaseStage,
    nextHearingDate: '',
    goals: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      state: '',
      county: '',
      caseType: 'custody',
      stage: 'initial',
      nextHearingDate: '',
      goals: '',
    });
    setEditingCase(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (caseItem: Case) => {
    setEditingCase(caseItem);
    setFormData({
      name: caseItem.name,
      state: caseItem.state,
      county: caseItem.county,
      caseType: caseItem.caseType,
      stage: caseItem.stage,
      nextHearingDate: caseItem.nextHearingDate || '',
      goals: caseItem.goals.join('\n'),
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    const goalsArray = formData.goals
      .split('\n')
      .map((g) => g.trim())
      .filter((g) => g.length > 0);

    if (editingCase) {
      updateCase(editingCase.id, {
        name: formData.name,
        state: formData.state,
        county: formData.county,
        caseType: formData.caseType,
        stage: formData.stage,
        nextHearingDate: formData.nextHearingDate || null,
        goals: goalsArray,
      });
    } else {
      addCase({
        name: formData.name,
        state: formData.state,
        county: formData.county,
        caseType: formData.caseType,
        stage: formData.stage,
        nextHearingDate: formData.nextHearingDate || null,
        goals: goalsArray,
      });
    }

    setModalVisible(false);
    resetForm();
  };

  const handleDelete = () => {
    if (editingCase) {
      deleteCase(editingCase.id);
      setModalVisible(false);
      resetForm();
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStageColor = (stage: CaseStage) => {
    switch (stage) {
      case 'initial': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400';
      case 'discovery': return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400';
      case 'mediation': return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400';
      case 'trial': return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400';
      case 'appeals': return 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400';
      case 'closed': return 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400';
      default: return 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400';
    }
  };

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <SafeAreaView edges={['top']} className="bg-stone-50 dark:bg-stone-950">
        <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-semibold text-stone-800 dark:text-stone-100">
              Cases
            </Text>
            <Text className="text-stone-500 dark:text-stone-400 text-sm mt-0.5">
              Manage your legal cases
            </Text>
          </View>
          <Pressable
            onPress={openCreateModal}
            className="w-10 h-10 bg-teal-600 dark:bg-teal-500 rounded-full items-center justify-center active:opacity-80"
          >
            <Plus size={22} color="#fff" />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {cases.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8 pt-20">
            <View className="w-16 h-16 rounded-full bg-stone-200 dark:bg-stone-800 items-center justify-center mb-4">
              <Briefcase size={32} color="#9ca3af" />
            </View>
            <Text className="text-stone-600 dark:text-stone-300 text-lg font-medium text-center">
              No cases yet
            </Text>
            <Text className="text-stone-400 dark:text-stone-500 text-sm text-center mt-2">
              Add your first case to start organizing your legal matters
            </Text>
            <Pressable
              onPress={openCreateModal}
              className="mt-6 bg-teal-600 dark:bg-teal-500 px-6 py-3 rounded-full active:opacity-80"
            >
              <Text className="text-white font-medium">Add Case</Text>
            </Pressable>
          </View>
        ) : (
          <View className="px-4 pt-4">
            {cases.map((caseItem) => (
              <Pressable
                key={caseItem.id}
                onPress={() => openEditModal(caseItem)}
                className="bg-white dark:bg-stone-900 rounded-xl p-4 mb-3 border border-stone-200/60 dark:border-stone-800 active:opacity-80"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-stone-800 dark:text-stone-100 font-semibold text-base">
                      {caseItem.name}
                    </Text>
                    <View className="flex-row items-center mt-2 flex-wrap">
                      <View className={`px-2.5 py-1 rounded-full ${getStageColor(caseItem.stage)}`}>
                        <Text className={`text-xs font-medium ${getStageColor(caseItem.stage).split(' ').slice(2).join(' ')}`}>
                          {CASE_STAGES.find((s) => s.value === caseItem.stage)?.label}
                        </Text>
                      </View>
                      <Text className="text-stone-400 dark:text-stone-500 text-xs ml-2">
                        {CASE_TYPES.find((t) => t.value === caseItem.caseType)?.label}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#9ca3af" />
                </View>

                <View className="flex-row items-center mt-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                  <View className="flex-row items-center flex-1">
                    <MapPin size={14} color="#9ca3af" />
                    <Text className="text-stone-500 dark:text-stone-400 text-xs ml-1">
                      {caseItem.county}, {caseItem.state}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Calendar size={14} color="#9ca3af" />
                    <Text className="text-stone-500 dark:text-stone-400 text-xs ml-1">
                      {formatDate(caseItem.nextHearingDate)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create/Edit Case Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-stone-50 dark:bg-stone-950"
        >
          <SafeAreaView edges={['top']} className="bg-stone-50 dark:bg-stone-950">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800">
              <Pressable onPress={() => setModalVisible(false)} className="active:opacity-60">
                <X size={24} color="#6b7280" />
              </Pressable>
              <Text className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                {editingCase ? 'Edit Case' : 'New Case'}
              </Text>
              <Pressable
                onPress={handleSave}
                disabled={!formData.name.trim()}
                className="active:opacity-60"
              >
                <Text className={`font-semibold ${formData.name.trim() ? 'text-teal-600 dark:text-teal-400' : 'text-stone-300 dark:text-stone-600'}`}>
                  Save
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>

          <ScrollView className="flex-1 px-5 pt-5">
            {/* Case Name */}
            <View className="mb-5">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                Case Name *
              </Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="e.g., Smith v. Smith"
                placeholderTextColor="#9ca3af"
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 text-stone-800 dark:text-stone-100"
              />
            </View>

            {/* State */}
            <View className="mb-5">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                State
              </Text>
              <TextInput
                value={formData.state}
                onChangeText={(text) => setFormData({ ...formData, state: text })}
                placeholder="e.g., California"
                placeholderTextColor="#9ca3af"
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 text-stone-800 dark:text-stone-100"
              />
            </View>

            {/* County */}
            <View className="mb-5">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                County
              </Text>
              <TextInput
                value={formData.county}
                onChangeText={(text) => setFormData({ ...formData, county: text })}
                placeholder="e.g., Los Angeles"
                placeholderTextColor="#9ca3af"
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 text-stone-800 dark:text-stone-100"
              />
            </View>

            {/* Case Type */}
            <View className="mb-5">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                Case Type
              </Text>
              <View className="flex-row flex-wrap">
                {CASE_TYPES.map((type) => (
                  <Pressable
                    key={type.value}
                    onPress={() => setFormData({ ...formData, caseType: type.value })}
                    className={`mr-2 mb-2 px-4 py-2.5 rounded-full border ${
                      formData.caseType === type.value
                        ? 'bg-teal-100 dark:bg-teal-900/40 border-teal-300 dark:border-teal-700'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    <Text className={`text-sm ${
                      formData.caseType === type.value
                        ? 'text-teal-700 dark:text-teal-400 font-medium'
                        : 'text-stone-600 dark:text-stone-300'
                    }`}>
                      {type.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Case Stage */}
            <View className="mb-5">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                Case Stage
              </Text>
              <View className="flex-row flex-wrap">
                {CASE_STAGES.map((stage) => (
                  <Pressable
                    key={stage.value}
                    onPress={() => setFormData({ ...formData, stage: stage.value })}
                    className={`mr-2 mb-2 px-4 py-2.5 rounded-full border ${
                      formData.stage === stage.value
                        ? 'bg-teal-100 dark:bg-teal-900/40 border-teal-300 dark:border-teal-700'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    <Text className={`text-sm ${
                      formData.stage === stage.value
                        ? 'text-teal-700 dark:text-teal-400 font-medium'
                        : 'text-stone-600 dark:text-stone-300'
                    }`}>
                      {stage.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Next Hearing Date */}
            <View className="mb-5">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                Next Hearing Date
              </Text>
              <TextInput
                value={formData.nextHearingDate}
                onChangeText={(text) => setFormData({ ...formData, nextHearingDate: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 text-stone-800 dark:text-stone-100"
              />
            </View>

            {/* Goals */}
            <View className="mb-5">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                Goals (one per line)
              </Text>
              <TextInput
                value={formData.goals}
                onChangeText={(text) => setFormData({ ...formData, goals: text })}
                placeholder="e.g., Full custody&#10;Regular visitation schedule"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 text-stone-800 dark:text-stone-100 min-h-[100px]"
              />
            </View>

            {/* Delete Button (only for editing) */}
            {editingCase && (
              <Pressable
                onPress={handleDelete}
                className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl py-3.5 items-center mb-10"
              >
                <Text className="text-red-600 dark:text-red-400 font-medium">Delete Case</Text>
              </Pressable>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
