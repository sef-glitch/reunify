import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, FileText, Mail, FileCheck, ClipboardList, File, ChevronRight, Folder } from 'lucide-react-native';
import { useAuth, Document, Case } from '@/lib/auth-context';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';

const DOCUMENT_CATEGORIES = [
  { value: 'letter', label: 'Letters & Emails', icon: Mail, color: 'bg-blue-100 dark:bg-blue-900/40' },
  { value: 'declaration', label: 'Declarations', icon: FileCheck, color: 'bg-purple-100 dark:bg-purple-900/40' },
  { value: 'log', label: 'Logs & Journals', icon: ClipboardList, color: 'bg-emerald-100 dark:bg-emerald-900/40' },
  { value: 'request', label: 'Request Templates', icon: File, color: 'bg-orange-100 dark:bg-orange-900/40' },
  { value: 'other', label: 'Other', icon: FileText, color: 'bg-stone-100 dark:bg-stone-800' },
] as const;

const DOCUMENT_TEMPLATES = {
  letter: [
    { title: 'Letter to Attorney', content: 'Dear [Attorney Name],\n\nI am writing to...\n\nSincerely,\n[Your Name]' },
    { title: 'Communication with Co-Parent', content: 'Date: [Date]\nRe: [Subject]\n\n[Your message here]\n\nBest regards,\n[Your Name]' },
    { title: 'School Notification', content: 'To Whom It May Concern,\n\nI am writing to inform you that...\n\nThank you,\n[Your Name]' },
  ],
  declaration: [
    { title: 'Declaration of Facts', content: 'I, [Your Name], declare under penalty of perjury:\n\n1. [Fact 1]\n2. [Fact 2]\n3. [Fact 3]\n\nI declare under penalty of perjury under the laws of the State of [State] that the foregoing is true and correct.\n\nExecuted on [Date] at [City, State].\n\n_______________________\n[Your Name]' },
    { title: 'Witness Statement', content: 'Declaration of [Witness Name]\n\nI, [Witness Name], state under penalty of perjury:\n\n[Statement here]\n\nDated: [Date]\n\n_______________________\nSignature' },
  ],
  log: [
    { title: 'Visitation Log', content: 'VISITATION LOG\n\nDate: [Date]\nScheduled Time: [Time]\nActual Time: [Time]\n\nNotes:\n- \n- \n\nChildren\'s Condition Upon Return:\n' },
    { title: 'Communication Log', content: 'COMMUNICATION LOG\n\nDate: [Date]\nTime: [Time]\nMethod: [Phone/Text/Email/In-person]\nInitiated by: [Name]\n\nSummary:\n\n\nWitness (if any):' },
    { title: 'Incident Report', content: 'INCIDENT REPORT\n\nDate of Incident: [Date]\nTime: [Time]\nLocation: [Location]\n\nPersons Involved:\n-\n-\n\nDescription of Incident:\n\n\nWitnesses:\n\nEvidence/Documentation:' },
  ],
  request: [
    { title: 'Records Request', content: 'Re: Request for Records\n\nTo Whom It May Concern,\n\nPursuant to [applicable law], I am requesting copies of the following records:\n\n1. [Record type]\n2. [Record type]\n\nPlease send records to:\n[Your Address]\n\nThank you,\n[Your Name]' },
    { title: 'Motion Template', content: 'Case No.: [Case Number]\n\nMOTION FOR [Type of Motion]\n\nCOMES NOW, [Your Name], and respectfully moves this Honorable Court for [relief requested] and in support states:\n\n1. [Statement]\n2. [Statement]\n\nWHEREFORE, [Your Name] respectfully requests that this Court grant [specific relief].\n\nRespectfully submitted,\n[Your Name]\n[Date]' },
  ],
  other: [
    { title: 'Blank Document', content: '' },
  ],
};

type DocCategory = Document['category'];

export default function DocumentsScreen() {
  const { cases, documents, addDocument, updateDocument, deleteDocument } = useAuth();

  const [view, setView] = useState<'generator' | 'library'>('generator');
  const [selectedCategory, setSelectedCategory] = useState<DocCategory | null>(null);
  const [selectedCaseFilter, setSelectedCaseFilter] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);

  const [formData, setFormData] = useState({
    caseId: '',
    title: '',
    category: 'other' as DocCategory,
    content: '',
  });

  const filteredDocuments = useMemo(() => {
    let filtered = documents;
    if (selectedCaseFilter) {
      filtered = filtered.filter((d) => d.caseId === selectedCaseFilter);
    }
    return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [documents, selectedCaseFilter]);

  const resetForm = () => {
    setFormData({
      caseId: cases[0]?.id || '',
      title: '',
      category: 'other',
      content: '',
    });
    setEditingDocument(null);
  };

  const openTemplateModal = (category: DocCategory, template: { title: string; content: string }) => {
    setFormData({
      caseId: selectedCaseFilter || cases[0]?.id || '',
      title: template.title,
      category,
      content: template.content,
    });
    setEditingDocument(null);
    setModalVisible(true);
  };

  const openEditModal = (doc: Document) => {
    setEditingDocument(doc);
    setFormData({
      caseId: doc.caseId,
      title: doc.title,
      category: doc.category,
      content: doc.content,
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.caseId || !formData.title.trim()) return;

    if (editingDocument) {
      updateDocument(editingDocument.id, {
        caseId: formData.caseId,
        title: formData.title,
        category: formData.category,
        content: formData.content,
      });
    } else {
      addDocument({
        caseId: formData.caseId,
        title: formData.title,
        category: formData.category,
        content: formData.content,
      });
    }

    setModalVisible(false);
    resetForm();
    setView('library');
  };

  const handleDelete = () => {
    if (editingDocument) {
      deleteDocument(editingDocument.id);
      setModalVisible(false);
      resetForm();
    }
  };

  const getCaseName = (caseId: string) => {
    return cases.find((c) => c.id === caseId)?.name || 'Unknown Case';
  };

  const getCategoryInfo = (category: DocCategory) => {
    return DOCUMENT_CATEGORIES.find((c) => c.value === category) || DOCUMENT_CATEGORIES[4];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <SafeAreaView edges={['top']} className="bg-stone-50 dark:bg-stone-950">
        <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-semibold text-stone-800 dark:text-stone-100">
              Documents
            </Text>
            <Text className="text-stone-500 dark:text-stone-400 text-sm mt-0.5">
              Generate and manage documents
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <DisclaimerBanner />

      {/* View Toggle */}
      <View className="px-4 py-3 flex-row">
        <Pressable
          onPress={() => setView('generator')}
          className={`flex-1 py-2.5 rounded-l-xl ${
            view === 'generator'
              ? 'bg-teal-600 dark:bg-teal-500'
              : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700'
          }`}
        >
          <Text className={`text-center font-medium ${
            view === 'generator' ? 'text-white' : 'text-stone-600 dark:text-stone-300'
          }`}>
            Generator
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setView('library')}
          className={`flex-1 py-2.5 rounded-r-xl ${
            view === 'library'
              ? 'bg-teal-600 dark:bg-teal-500'
              : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700'
          }`}
        >
          <Text className={`text-center font-medium ${
            view === 'library' ? 'text-white' : 'text-stone-600 dark:text-stone-300'
          }`}>
            Library ({documents.length})
          </Text>
        </Pressable>
      </View>

      {view === 'generator' ? (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
          {cases.length === 0 ? (
            <View className="flex-1 items-center justify-center px-8 pt-20">
              <View className="w-16 h-16 rounded-full bg-stone-200 dark:bg-stone-800 items-center justify-center mb-4">
                <FileText size={32} color="#9ca3af" />
              </View>
              <Text className="text-stone-600 dark:text-stone-300 text-lg font-medium text-center">
                Create a case first
              </Text>
              <Text className="text-stone-400 dark:text-stone-500 text-sm text-center mt-2">
                You need at least one case to generate documents
              </Text>
            </View>
          ) : (
            <View className="px-4 pt-4">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-3">
                Select a category to get started:
              </Text>

              {DOCUMENT_CATEGORIES.map((category) => {
                const IconComponent = category.icon;
                const templates = DOCUMENT_TEMPLATES[category.value] || [];

                return (
                  <View key={category.value} className="mb-4">
                    <Pressable
                      onPress={() => setSelectedCategory(
                        selectedCategory === category.value ? null : category.value
                      )}
                      className="bg-white dark:bg-stone-900 rounded-xl p-4 border border-stone-200/60 dark:border-stone-800 active:opacity-80"
                    >
                      <View className="flex-row items-center">
                        <View className={`w-10 h-10 rounded-full items-center justify-center ${category.color}`}>
                          <IconComponent size={20} color="#6b7280" />
                        </View>
                        <Text className="flex-1 ml-3 font-medium text-stone-800 dark:text-stone-100">
                          {category.label}
                        </Text>
                        <ChevronRight
                          size={20}
                          color="#9ca3af"
                          style={{
                            transform: [{ rotate: selectedCategory === category.value ? '90deg' : '0deg' }],
                          }}
                        />
                      </View>
                    </Pressable>

                    {selectedCategory === category.value && templates.length > 0 && (
                      <View className="mt-2 ml-4 pl-4 border-l-2 border-stone-200 dark:border-stone-700">
                        {templates.map((template, index) => (
                          <Pressable
                            key={index}
                            onPress={() => openTemplateModal(category.value, template)}
                            className="bg-stone-100 dark:bg-stone-800/50 rounded-lg p-3 mb-2 active:opacity-80"
                          >
                            <Text className="text-stone-700 dark:text-stone-200 font-medium text-sm">
                              {template.title}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      ) : (
        <>
          {/* Case Filter for Library */}
          <View className="px-4 pb-3 border-b border-stone-200/60 dark:border-stone-800">
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
            {filteredDocuments.length === 0 ? (
              <View className="flex-1 items-center justify-center px-8 pt-20">
                <View className="w-16 h-16 rounded-full bg-stone-200 dark:bg-stone-800 items-center justify-center mb-4">
                  <Folder size={32} color="#9ca3af" />
                </View>
                <Text className="text-stone-600 dark:text-stone-300 text-lg font-medium text-center">
                  No documents yet
                </Text>
                <Text className="text-stone-400 dark:text-stone-500 text-sm text-center mt-2">
                  Use the Generator tab to create documents
                </Text>
              </View>
            ) : (
              <View className="px-4 pt-4">
                {filteredDocuments.map((doc) => {
                  const categoryInfo = getCategoryInfo(doc.category);
                  const IconComponent = categoryInfo.icon;

                  return (
                    <Pressable
                      key={doc.id}
                      onPress={() => openEditModal(doc)}
                      className="bg-white dark:bg-stone-900 rounded-xl p-4 mb-3 border border-stone-200/60 dark:border-stone-800 active:opacity-80"
                    >
                      <View className="flex-row items-start">
                        <View className={`w-10 h-10 rounded-full items-center justify-center ${categoryInfo.color}`}>
                          <IconComponent size={18} color="#6b7280" />
                        </View>
                        <View className="flex-1 ml-3">
                          <Text className="font-medium text-stone-800 dark:text-stone-100">
                            {doc.title}
                          </Text>
                          <View className="flex-row items-center mt-1.5">
                            <Text className="text-stone-400 dark:text-stone-500 text-xs">
                              {categoryInfo.label}
                            </Text>
                            <Text className="text-stone-300 dark:text-stone-600 text-xs mx-2">•</Text>
                            <Text className="text-stone-400 dark:text-stone-500 text-xs">
                              {getCaseName(doc.caseId)}
                            </Text>
                          </View>
                          <Text className="text-stone-400 dark:text-stone-500 text-xs mt-1">
                            Updated {formatDate(doc.updatedAt)}
                          </Text>
                        </View>
                        <ChevronRight size={20} color="#9ca3af" />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </>
      )}

      {/* Document Editor Modal */}
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
                {editingDocument ? 'Edit Document' : 'New Document'}
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

            {/* Document Title */}
            <View className="mb-5">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                Document Title *
              </Text>
              <TextInput
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="e.g., Declaration of Facts"
                placeholderTextColor="#9ca3af"
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 text-stone-800 dark:text-stone-100"
              />
            </View>

            {/* Category */}
            <View className="mb-5">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                Category
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                {DOCUMENT_CATEGORIES.map((category) => (
                  <Pressable
                    key={category.value}
                    onPress={() => setFormData({ ...formData, category: category.value })}
                    className={`mr-2 px-4 py-2.5 rounded-full border ${
                      formData.category === category.value
                        ? 'bg-teal-100 dark:bg-teal-900/40 border-teal-300 dark:border-teal-700'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    <Text className={`text-sm ${
                      formData.category === category.value
                        ? 'text-teal-700 dark:text-teal-400 font-medium'
                        : 'text-stone-600 dark:text-stone-300'
                    }`}>
                      {category.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Content */}
            <View className="mb-5">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                Content
              </Text>
              <TextInput
                value={formData.content}
                onChangeText={(text) => setFormData({ ...formData, content: text })}
                placeholder="Document content..."
                placeholderTextColor="#9ca3af"
                multiline
                textAlignVertical="top"
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 text-stone-800 dark:text-stone-100 min-h-[300px]"
              />
            </View>

            {/* Delete Button */}
            {editingDocument && (
              <Pressable
                onPress={handleDelete}
                className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl py-3.5 items-center mb-10"
              >
                <Text className="text-red-600 dark:text-red-400 font-medium">Delete Document</Text>
              </Pressable>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
