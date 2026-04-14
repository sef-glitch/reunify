import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, Camera, FileImage, Tag, Link2, Trash2, ChevronRight, File, Video, Mic, ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useAuth, Evidence } from '@/lib/auth-context';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { SyncIndicator } from '@/components/SyncIndicator';
import { useEvidenceQueue, initNetworkListener } from '@/lib/evidence-queue';

const EVIDENCE_TYPES = [
  { value: 'photo', label: 'Photo', icon: ImageIcon },
  { value: 'document', label: 'Document', icon: File },
  { value: 'audio', label: 'Audio', icon: Mic },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'other', label: 'Other', icon: File },
] as const;

type EvidenceType = Evidence['type'];

export default function EvidenceScreen() {
  const { cases, evidence, tasks, documents, addEvidence, updateEvidence, deleteEvidence } = useAuth();

  const [selectedCaseFilter, setSelectedCaseFilter] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvidence, setEditingEvidence] = useState<Evidence | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const isOnline = useEvidenceQueue((s) => s.isOnline);
  const addToQueue = useEvidenceQueue((s) => s.addToQueue);
  const queue = useEvidenceQueue((s) => s.queue);
  const removeFromQueue = useEvidenceQueue((s) => s.removeFromQueue);

  // Initialize network listener
  useEffect(() => {
    initNetworkListener();
  }, []);

  const [formData, setFormData] = useState({
    caseId: '',
    title: '',
    type: 'photo' as EvidenceType,
    uri: '',
    notes: '',
    tags: '',
    linkedTaskIds: [] as string[],
    linkedDocumentIds: [] as string[],
  });

  const filteredEvidence = useMemo(() => {
    let filtered = evidence;
    if (selectedCaseFilter) {
      filtered = filtered.filter((e) => e.caseId === selectedCaseFilter);
    }
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [evidence, selectedCaseFilter]);

  const resetForm = () => {
    setFormData({
      caseId: cases[0]?.id || '',
      title: '',
      type: 'photo',
      uri: '',
      notes: '',
      tags: '',
      linkedTaskIds: [],
      linkedDocumentIds: [],
    });
    setEditingEvidence(null);
  };

  const openCreateModal = () => {
    resetForm();
    if (selectedCaseFilter) {
      setFormData((prev) => ({ ...prev, caseId: selectedCaseFilter }));
    }
    setModalVisible(true);
  };

  const openEditModal = (item: Evidence) => {
    setEditingEvidence(item);
    setFormData({
      caseId: item.caseId,
      title: item.title,
      type: item.type,
      uri: item.uri,
      notes: item.notes,
      tags: item.tags.join(', '),
      linkedTaskIds: item.linkedTaskIds,
      linkedDocumentIds: item.linkedDocumentIds,
    });
    setModalVisible(true);
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFormData((prev) => ({
        ...prev,
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'photo',
        title: prev.title || asset.fileName || 'Untitled',
      }));
    }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow camera access.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFormData((prev) => ({
        ...prev,
        uri: asset.uri,
        type: 'photo',
        title: prev.title || `Photo ${new Date().toLocaleDateString()}`,
      }));
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setFormData((prev) => ({
          ...prev,
          uri: asset.uri,
          type: 'document',
          title: prev.title || asset.name || 'Document',
        }));
      }
    } catch (error) {
      console.error('Document picker error:', error);
    }
  };

  const handleSave = () => {
    if (!formData.caseId || !formData.title.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const tagsArray = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (editingEvidence) {
      updateEvidence(editingEvidence.id, {
        caseId: formData.caseId,
        title: formData.title,
        type: formData.type,
        uri: formData.uri,
        notes: formData.notes,
        tags: tagsArray,
        linkedTaskIds: formData.linkedTaskIds,
        linkedDocumentIds: formData.linkedDocumentIds,
      });
    } else {
      // If offline and has a file, add to queue
      if (!isOnline && formData.uri) {
        addToQueue({
          caseId: formData.caseId,
          title: formData.title,
          type: formData.type,
          uri: formData.uri,
          notes: formData.notes,
          tags: tagsArray,
          linkedTaskIds: formData.linkedTaskIds,
          linkedDocumentIds: formData.linkedDocumentIds,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        addEvidence({
          caseId: formData.caseId,
          title: formData.title,
          type: formData.type,
          uri: formData.uri,
          notes: formData.notes,
          tags: tagsArray,
          linkedTaskIds: formData.linkedTaskIds,
          linkedDocumentIds: formData.linkedDocumentIds,
        });
      }
    }

    setModalVisible(false);
    resetForm();
  };

  const handleDelete = () => {
    if (editingEvidence) {
      deleteEvidence(editingEvidence.id);
      setModalVisible(false);
      resetForm();
    }
  };

  const getCaseName = (caseId: string) => {
    return cases.find((c) => c.id === caseId)?.name || 'Unknown Case';
  };

  const getTypeIcon = (type: EvidenceType) => {
    const typeInfo = EVIDENCE_TYPES.find((t) => t.value === type);
    return typeInfo?.icon || File;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const caseTasks = useMemo(() => {
    if (!formData.caseId) return [];
    return tasks.filter((t) => t.caseId === formData.caseId);
  }, [tasks, formData.caseId]);

  const caseDocuments = useMemo(() => {
    if (!formData.caseId) return [];
    return documents.filter((d) => d.caseId === formData.caseId);
  }, [documents, formData.caseId]);

  const toggleTaskLink = (taskId: string) => {
    setFormData((prev) => ({
      ...prev,
      linkedTaskIds: prev.linkedTaskIds.includes(taskId)
        ? prev.linkedTaskIds.filter((id) => id !== taskId)
        : [...prev.linkedTaskIds, taskId],
    }));
  };

  const toggleDocumentLink = (docId: string) => {
    setFormData((prev) => ({
      ...prev,
      linkedDocumentIds: prev.linkedDocumentIds.includes(docId)
        ? prev.linkedDocumentIds.filter((id) => id !== docId)
        : [...prev.linkedDocumentIds, docId],
    }));
  };

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <SafeAreaView edges={['top']} className="bg-stone-50 dark:bg-stone-950">
        <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-semibold text-stone-800 dark:text-stone-100">
              Evidence
            </Text>
            <Text className="text-stone-500 dark:text-stone-400 text-sm mt-0.5">
              Upload and organize evidence
            </Text>
          </View>
          <Pressable
            onPress={openCreateModal}
            disabled={cases.length === 0}
            className={`w-10 h-10 rounded-full items-center justify-center active:opacity-80 ${
              cases.length === 0 ? 'bg-stone-300 dark:bg-stone-700' : 'bg-teal-600 dark:bg-teal-500'
            }`}
          >
            <Plus size={22} color="#fff" />
          </Pressable>
        </View>
      </SafeAreaView>

      <DisclaimerBanner />

      {/* Sync Status Indicator */}
      <SyncIndicator
        onPress={() => {
          // Could show queue modal or retry failed items
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      />

      {/* Case Filter */}
      <View className="px-4 py-3 border-b border-stone-200/60 dark:border-stone-800">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
          <Pressable
            onPress={() => setSelectedCaseFilter(null)}
            className={`mr-2 px-4 py-2 rounded-full ${
              !selectedCaseFilter
                ? 'bg-teal-600 dark:bg-teal-500'
                : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700'
            }`}
          >
            <Text className={`text-sm font-medium ${
              !selectedCaseFilter ? 'text-white' : 'text-stone-600 dark:text-stone-300'
            }`}>
              All Cases
            </Text>
          </Pressable>
          {cases.map((caseItem) => (
            <Pressable
              key={caseItem.id}
              onPress={() => setSelectedCaseFilter(caseItem.id)}
              className={`mr-2 px-4 py-2 rounded-full ${
                selectedCaseFilter === caseItem.id
                  ? 'bg-teal-600 dark:bg-teal-500'
                  : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700'
              }`}
            >
              <Text className={`text-sm font-medium ${
                selectedCaseFilter === caseItem.id ? 'text-white' : 'text-stone-600 dark:text-stone-300'
              }`}>
                {caseItem.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {cases.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8 pt-20">
            <View className="w-16 h-16 rounded-full bg-stone-200 dark:bg-stone-800 items-center justify-center mb-4">
              <FileImage size={32} color="#9ca3af" />
            </View>
            <Text className="text-stone-600 dark:text-stone-300 text-lg font-medium text-center">
              Create a case first
            </Text>
            <Text className="text-stone-400 dark:text-stone-500 text-sm text-center mt-2">
              You need at least one case to add evidence
            </Text>
          </View>
        ) : filteredEvidence.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8 pt-20">
            <View className="w-16 h-16 rounded-full bg-stone-200 dark:bg-stone-800 items-center justify-center mb-4">
              <FileImage size={32} color="#9ca3af" />
            </View>
            <Text className="text-stone-600 dark:text-stone-300 text-lg font-medium text-center">
              No evidence yet
            </Text>
            <Text className="text-stone-400 dark:text-stone-500 text-sm text-center mt-2">
              Upload photos, documents, or other files
            </Text>
            <Pressable
              onPress={openCreateModal}
              className="mt-6 bg-teal-600 dark:bg-teal-500 px-6 py-3 rounded-full active:opacity-80"
            >
              <Text className="text-white font-medium">Add Evidence</Text>
            </Pressable>
          </View>
        ) : (
          <View className="px-4 pt-4">
            {filteredEvidence.map((item) => {
              const IconComponent = getTypeIcon(item.type);

              return (
                <Pressable
                  key={item.id}
                  onPress={() => openEditModal(item)}
                  className="bg-white dark:bg-stone-900 rounded-xl mb-3 border border-stone-200/60 dark:border-stone-800 active:opacity-80 overflow-hidden"
                >
                  {item.type === 'photo' && item.uri ? (
                    <Image
                      source={{ uri: item.uri }}
                      style={{ width: '100%', height: 160 }}
                      resizeMode="cover"
                    />
                  ) : null}
                  <View className="p-4">
                    <View className="flex-row items-start">
                      {item.type !== 'photo' && (
                        <View className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 items-center justify-center mr-3">
                          <IconComponent size={18} color="#6b7280" />
                        </View>
                      )}
                      <View className="flex-1">
                        <Text className="font-medium text-stone-800 dark:text-stone-100">
                          {item.title}
                        </Text>
                        {item.notes ? (
                          <Text className="text-stone-500 dark:text-stone-400 text-sm mt-1" numberOfLines={2}>
                            {item.notes}
                          </Text>
                        ) : null}
                        <View className="flex-row items-center mt-2 flex-wrap">
                          <Text className="text-stone-400 dark:text-stone-500 text-xs">
                            {getCaseName(item.caseId)}
                          </Text>
                          <Text className="text-stone-300 dark:text-stone-600 text-xs mx-2">•</Text>
                          <Text className="text-stone-400 dark:text-stone-500 text-xs">
                            {formatDate(item.createdAt)}
                          </Text>
                        </View>
                        {item.tags.length > 0 && (
                          <View className="flex-row flex-wrap mt-2">
                            {item.tags.map((tag, index) => (
                              <View key={index} className="bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded mr-1 mb-1">
                                <Text className="text-stone-500 dark:text-stone-400 text-xs">#{tag}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                        {(item.linkedTaskIds.length > 0 || item.linkedDocumentIds.length > 0) && (
                          <View className="flex-row items-center mt-2">
                            <Link2 size={12} color="#9ca3af" />
                            <Text className="text-stone-400 dark:text-stone-500 text-xs ml-1">
                              {item.linkedTaskIds.length + item.linkedDocumentIds.length} linked items
                            </Text>
                          </View>
                        )}
                      </View>
                      <ChevronRight size={20} color="#9ca3af" />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Evidence Modal */}
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
                {editingEvidence ? 'Edit Evidence' : 'Add Evidence'}
              </Text>
              <Pressable
                onPress={handleSave}
                disabled={!formData.title.trim() || !formData.caseId}
                className="active:opacity-60"
              >
                <Text className={`font-semibold ${
                  formData.title.trim() && formData.caseId
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'text-stone-300 dark:text-stone-600'
                }`}>
                  Save
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>

          <ScrollView className="flex-1 px-5 pt-5">
            {/* Upload Buttons */}
            {!editingEvidence && (
              <View className="mb-5">
                <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                  Upload File
                </Text>
                <View className="flex-row space-x-3">
                  <Pressable
                    onPress={handleTakePhoto}
                    className="flex-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl py-4 items-center active:opacity-80"
                  >
                    <Camera size={24} color="#0d9488" />
                    <Text className="text-stone-600 dark:text-stone-300 text-xs mt-2">Take Photo</Text>
                  </Pressable>
                  <Pressable
                    onPress={handlePickImage}
                    className="flex-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl py-4 items-center active:opacity-80"
                  >
                    <FileImage size={24} color="#0d9488" />
                    <Text className="text-stone-600 dark:text-stone-300 text-xs mt-2">Gallery</Text>
                  </Pressable>
                  <Pressable
                    onPress={handlePickDocument}
                    className="flex-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl py-4 items-center active:opacity-80"
                  >
                    <File size={24} color="#0d9488" />
                    <Text className="text-stone-600 dark:text-stone-300 text-xs mt-2">Document</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Preview */}
            {formData.uri && formData.type === 'photo' && (
              <View className="mb-5">
                <Image
                  source={{ uri: formData.uri }}
                  style={{ width: '100%', height: 200, borderRadius: 12 }}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Case Selection */}
            <View className="mb-5">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                Case *
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                {cases.map((caseItem) => (
                  <Pressable
                    key={caseItem.id}
                    onPress={() => setFormData({ ...formData, caseId: caseItem.id })}
                    className={`mr-2 px-4 py-2.5 rounded-full border ${
                      formData.caseId === caseItem.id
                        ? 'bg-teal-100 dark:bg-teal-900/40 border-teal-300 dark:border-teal-700'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    <Text className={`text-sm ${
                      formData.caseId === caseItem.id
                        ? 'text-teal-700 dark:text-teal-400 font-medium'
                        : 'text-stone-600 dark:text-stone-300'
                    }`}>
                      {caseItem.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Title */}
            <View className="mb-5">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                Title *
              </Text>
              <TextInput
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="e.g., Screenshot of text messages"
                placeholderTextColor="#9ca3af"
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 text-stone-800 dark:text-stone-100"
              />
            </View>

            {/* Type */}
            <View className="mb-5">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                Type
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                {EVIDENCE_TYPES.map((type) => (
                  <Pressable
                    key={type.value}
                    onPress={() => setFormData({ ...formData, type: type.value })}
                    className={`mr-2 px-4 py-2.5 rounded-full border ${
                      formData.type === type.value
                        ? 'bg-teal-100 dark:bg-teal-900/40 border-teal-300 dark:border-teal-700'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    <Text className={`text-sm ${
                      formData.type === type.value
                        ? 'text-teal-700 dark:text-teal-400 font-medium'
                        : 'text-stone-600 dark:text-stone-300'
                    }`}>
                      {type.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Notes */}
            <View className="mb-5">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                Notes
              </Text>
              <TextInput
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder="Context or description..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 text-stone-800 dark:text-stone-100 min-h-[80px]"
              />
            </View>

            {/* Tags */}
            <View className="mb-5">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                Tags (comma-separated)
              </Text>
              <TextInput
                value={formData.tags}
                onChangeText={(text) => setFormData({ ...formData, tags: text })}
                placeholder="e.g., communication, custody, medical"
                placeholderTextColor="#9ca3af"
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 text-stone-800 dark:text-stone-100"
              />
            </View>

            {/* Link to Tasks/Documents */}
            {formData.caseId && (caseTasks.length > 0 || caseDocuments.length > 0) && (
              <Pressable
                onPress={() => setShowLinkModal(true)}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-4 mb-5 flex-row items-center justify-between active:opacity-80"
              >
                <View className="flex-row items-center">
                  <Link2 size={20} color="#0d9488" />
                  <Text className="text-stone-700 dark:text-stone-200 font-medium ml-3">
                    Link to Tasks/Documents
                  </Text>
                </View>
                <View className="flex-row items-center">
                  {(formData.linkedTaskIds.length + formData.linkedDocumentIds.length) > 0 && (
                    <View className="bg-teal-100 dark:bg-teal-900/40 px-2 py-1 rounded-full mr-2">
                      <Text className="text-teal-700 dark:text-teal-400 text-xs font-medium">
                        {formData.linkedTaskIds.length + formData.linkedDocumentIds.length}
                      </Text>
                    </View>
                  )}
                  <ChevronRight size={20} color="#9ca3af" />
                </View>
              </Pressable>
            )}

            {/* Delete Button */}
            {editingEvidence && (
              <Pressable
                onPress={handleDelete}
                className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl py-3.5 items-center mb-10"
              >
                <Text className="text-red-600 dark:text-red-400 font-medium">Delete Evidence</Text>
              </Pressable>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Link Modal */}
      <Modal
        visible={showLinkModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLinkModal(false)}
      >
        <View className="flex-1 bg-stone-50 dark:bg-stone-950">
          <SafeAreaView edges={['top']} className="bg-stone-50 dark:bg-stone-950">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800">
              <View />
              <Text className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                Link Items
              </Text>
              <Pressable onPress={() => setShowLinkModal(false)} className="active:opacity-60">
                <Text className="text-teal-600 dark:text-teal-400 font-semibold">Done</Text>
              </Pressable>
            </View>
          </SafeAreaView>

          <ScrollView className="flex-1 px-5 pt-5">
            {caseTasks.length > 0 && (
              <View className="mb-6">
                <Text className="text-stone-600 dark:text-stone-300 text-sm font-semibold uppercase tracking-wide mb-3">
                  Tasks
                </Text>
                {caseTasks.map((task) => (
                  <Pressable
                    key={task.id}
                    onPress={() => toggleTaskLink(task.id)}
                    className={`p-4 rounded-xl mb-2 border ${
                      formData.linkedTaskIds.includes(task.id)
                        ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    <Text className={`font-medium ${
                      formData.linkedTaskIds.includes(task.id)
                        ? 'text-teal-700 dark:text-teal-400'
                        : 'text-stone-700 dark:text-stone-200'
                    }`}>
                      {task.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {caseDocuments.length > 0 && (
              <View className="mb-6">
                <Text className="text-stone-600 dark:text-stone-300 text-sm font-semibold uppercase tracking-wide mb-3">
                  Documents
                </Text>
                {caseDocuments.map((doc) => (
                  <Pressable
                    key={doc.id}
                    onPress={() => toggleDocumentLink(doc.id)}
                    className={`p-4 rounded-xl mb-2 border ${
                      formData.linkedDocumentIds.includes(doc.id)
                        ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    <Text className={`font-medium ${
                      formData.linkedDocumentIds.includes(doc.id)
                        ? 'text-teal-700 dark:text-teal-400'
                        : 'text-stone-700 dark:text-stone-200'
                    }`}>
                      {doc.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
