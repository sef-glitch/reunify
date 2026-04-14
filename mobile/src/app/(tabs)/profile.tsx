import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Mail, Phone, FileText, Save, Heart, LogOut, Package, Check, X, HelpCircle, Crown, Lock } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'expo-router';
import { generateCourtPacket } from '@/lib/export-helpers';
import { useSubscription } from '@/lib/useSubscription';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
  const { profile, updateProfile, signOut, cases, documents, evidence } = useAuth();
  const router = useRouter();
  const { isPremium, openPaywall, requirePremium } = useSubscription();

  const [formData, setFormData] = useState({
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    notes: profile.notes,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [includeEvidenceList, setIncludeEvidenceList] = useState(true);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSaved(false);
  };

  const handleSave = () => {
    updateProfile(formData);
    setHasChanges(false);
    setSaved(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setSaved(false), 2000);
  };

  const openExportModal = () => {
    if (!requirePremium()) return;

    if (cases.length === 0) {
      Alert.alert('No Cases', 'Create a case first to export a court packet.');
      return;
    }
    setSelectedCaseId(cases[0]?.id || null);
    setSelectedDocIds([]);
    setSelectedEvidenceIds([]);
    setIncludeEvidenceList(true);
    setShowExportModal(true);
  };

  const handleExportCourtPacket = async () => {
    if (!selectedCaseId) return;
    const caseInfo = cases.find((c) => c.id === selectedCaseId);
    if (!caseInfo) return;

    const result = await generateCourtPacket(documents, evidence, cases, {
      caseId: selectedCaseId,
      caseName: caseInfo.name,
      selectedDocumentIds: selectedDocIds,
      selectedEvidenceIds: selectedEvidenceIds,
      includeEvidenceList,
    });

    if (result.success) {
      setShowExportModal(false);
    } else {
      Alert.alert('Export Failed', result.error || 'Could not generate court packet');
    }
  };

  const toggleDocSelection = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const toggleEvidenceSelection = (evId: string) => {
    setSelectedEvidenceIds((prev) =>
      prev.includes(evId) ? prev.filter((id) => id !== evId) : [...prev, evId]
    );
  };

  const caseDocs = selectedCaseId ? documents.filter((d) => d.caseId === selectedCaseId) : [];
  const caseEvidence = selectedCaseId ? evidence.filter((e) => e.caseId === selectedCaseId) : [];

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <SafeAreaView edges={['top']} className="bg-stone-50 dark:bg-stone-950">
        <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-semibold text-stone-800 dark:text-stone-100">
              Profile
            </Text>
            <Text className="text-stone-500 dark:text-stone-400 text-sm mt-0.5">
              Your information
            </Text>
          </View>
          {hasChanges && (
            <Pressable
              onPress={handleSave}
              className="bg-teal-600 dark:bg-teal-500 px-4 py-2 rounded-full flex-row items-center active:opacity-80"
            >
              <Save size={16} color="#fff" />
              <Text className="text-white font-medium ml-2">Save</Text>
            </Pressable>
          )}
          {saved && (
            <View className="bg-emerald-100 dark:bg-emerald-900/40 px-4 py-2 rounded-full">
              <Text className="text-emerald-700 dark:text-emerald-400 font-medium">Saved</Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Avatar Area */}
          <View className="items-center py-8">
            <View className="w-24 h-24 rounded-full bg-teal-100 dark:bg-teal-900/40 items-center justify-center">
              <User size={48} color="#0d9488" />
            </View>
            <Text className="text-stone-800 dark:text-stone-100 text-xl font-semibold mt-4">
              {formData.name || 'Your Name'}
            </Text>
          </View>

          {/* Form */}
          <View className="px-5">
            {/* Name */}
            <View className="mb-5">
              <View className="flex-row items-center mb-2">
                <User size={16} color="#6b7280" />
                <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium ml-2">
                  Full Name
                </Text>
              </View>
              <TextInput
                value={formData.name}
                onChangeText={(text) => handleChange('name', text)}
                placeholder="Enter your name"
                placeholderTextColor="#9ca3af"
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 text-stone-800 dark:text-stone-100"
              />
            </View>

            {/* Email */}
            <View className="mb-5">
              <View className="flex-row items-center mb-2">
                <Mail size={16} color="#6b7280" />
                <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium ml-2">
                  Email
                </Text>
              </View>
              <TextInput
                value={formData.email}
                onChangeText={(text) => handleChange('email', text)}
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 text-stone-800 dark:text-stone-100"
              />
            </View>

            {/* Phone */}
            <View className="mb-5">
              <View className="flex-row items-center mb-2">
                <Phone size={16} color="#6b7280" />
                <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium ml-2">
                  Phone
                </Text>
              </View>
              <TextInput
                value={formData.phone}
                onChangeText={(text) => handleChange('phone', text)}
                placeholder="Enter your phone number"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 text-stone-800 dark:text-stone-100"
              />
            </View>

            {/* Personal Notes */}
            <View className="mb-5">
              <View className="flex-row items-center mb-2">
                <FileText size={16} color="#6b7280" />
                <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium ml-2">
                  Personal Notes
                </Text>
              </View>
              <TextInput
                value={formData.notes}
                onChangeText={(text) => handleChange('notes', text)}
                placeholder="Any additional notes for yourself..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 text-stone-800 dark:text-stone-100 min-h-[100px]"
              />
            </View>

            {/* Support Message */}
            <View className="bg-teal-50 dark:bg-teal-900/20 rounded-2xl p-5 mt-4 border border-teal-100 dark:border-teal-800/50">
              <View className="flex-row items-center mb-3">
                <Heart size={20} color="#0d9488" />
                <Text className="text-teal-700 dark:text-teal-400 font-semibold ml-2">
                  You're Not Alone
                </Text>
              </View>
              <Text className="text-teal-700/80 dark:text-teal-400/80 text-sm leading-5">
                Navigating family court or CPS matters can be overwhelming. Remember to take care of yourself, seek support from trusted friends or professionals, and take things one step at a time.
              </Text>
            </View>

            {/* Subscription Section */}
            <View className="mt-6">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-semibold uppercase tracking-wide mb-3">
                Subscription
              </Text>
              {isPremium ? (
                <View className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-xl border border-teal-200/60 dark:border-teal-800/40 p-4">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/40 items-center justify-center">
                      <Crown size={20} color="#0d9488" />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-teal-800 dark:text-teal-300 font-semibold">
                        Reunify Pro
                      </Text>
                      <Text className="text-teal-600 dark:text-teal-400 text-sm">
                        All premium features unlocked
                      </Text>
                    </View>
                    <Check size={20} color="#0d9488" />
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={openPaywall}
                  className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/60 dark:border-stone-800 p-4 flex-row items-center active:opacity-80"
                >
                  <View className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 items-center justify-center">
                    <Crown size={20} color="#d97706" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-stone-800 dark:text-stone-100 font-medium">
                      Upgrade to Pro
                    </Text>
                    <Text className="text-stone-500 dark:text-stone-400 text-sm">
                      Unlock AI tools & court packet export
                    </Text>
                  </View>
                </Pressable>
              )}
            </View>

            {/* Export Section */}
            <View className="mt-6">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-semibold uppercase tracking-wide mb-3">
                Export Data
              </Text>
              <Pressable
                onPress={openExportModal}
                className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/60 dark:border-stone-800 p-4 flex-row items-center active:opacity-80"
              >
                <View className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 items-center justify-center">
                  <Package size={20} color="#7c3aed" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-stone-800 dark:text-stone-100 font-medium">
                    Export Court Packet
                  </Text>
                  <Text className="text-stone-500 dark:text-stone-400 text-sm">
                    Combine documents & evidence into one file
                  </Text>
                </View>
                {!isPremium && (
                  <View className="bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded-full mr-2">
                    <Text className="text-amber-700 dark:text-amber-400 text-xs font-medium">PRO</Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Help & Support */}
            <View className="mt-6">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-semibold uppercase tracking-wide mb-3">
                Support
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/help');
                }}
                className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/60 dark:border-stone-800 p-4 flex-row items-center active:opacity-80"
                accessibilityLabel="Help and Support"
                accessibilityRole="button"
              >
                <View className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/40 items-center justify-center">
                  <HelpCircle size={20} color="#0d9488" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-stone-800 dark:text-stone-100 font-medium">
                    Help & Support
                  </Text>
                  <Text className="text-stone-500 dark:text-stone-400 text-sm">
                    Subscriptions, privacy, exports & more
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Resources */}
            <View className="mt-6">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-semibold uppercase tracking-wide mb-3">
                Helpful Resources
              </Text>
              <View className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/60 dark:border-stone-800 overflow-hidden">
                <View className="p-4 border-b border-stone-100 dark:border-stone-800">
                  <Text className="text-stone-800 dark:text-stone-100 font-medium">
                    National Domestic Violence Hotline
                  </Text>
                  <Text className="text-stone-500 dark:text-stone-400 text-sm mt-1">
                    1-800-799-7233
                  </Text>
                </View>
                <View className="p-4 border-b border-stone-100 dark:border-stone-800">
                  <Text className="text-stone-800 dark:text-stone-100 font-medium">
                    Childhelp National Abuse Hotline
                  </Text>
                  <Text className="text-stone-500 dark:text-stone-400 text-sm mt-1">
                    1-800-422-4453
                  </Text>
                </View>
                <View className="p-4">
                  <Text className="text-stone-800 dark:text-stone-100 font-medium">
                    Legal Aid Resources
                  </Text>
                  <Text className="text-stone-500 dark:text-stone-400 text-sm mt-1">
                    Contact your local bar association for free or low-cost legal help
                  </Text>
                </View>
              </View>
            </View>

            {/* App Info */}
            <View className="mt-6 mb-4 items-center">
              <Text className="text-stone-400 dark:text-stone-500 text-xs">
                Reunify v1.0.0
              </Text>
              <Text className="text-stone-400 dark:text-stone-500 text-xs mt-1">
                Your data is stored securely on your device
              </Text>
            </View>

            {/* Sign Out Button */}
            <Pressable
              onPress={signOut}
              className="mt-2 mb-8 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl py-3.5 flex-row items-center justify-center active:opacity-80"
            >
              <LogOut size={18} color="#6b7280" />
              <Text className="text-stone-600 dark:text-stone-300 font-medium ml-2">Sign Out</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Court Packet Export Modal */}
      <Modal
        visible={showExportModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExportModal(false)}
      >
        <View className="flex-1 bg-stone-50 dark:bg-stone-950">
          <SafeAreaView edges={['top']} className="bg-stone-50 dark:bg-stone-950">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800">
              <Pressable onPress={() => setShowExportModal(false)} className="active:opacity-60">
                <X size={24} color="#6b7280" />
              </Pressable>
              <Text className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                Court Packet
              </Text>
              <Pressable
                onPress={handleExportCourtPacket}
                disabled={!selectedCaseId}
                className="active:opacity-60"
              >
                <Text className={`font-semibold ${selectedCaseId ? 'text-teal-600 dark:text-teal-400' : 'text-stone-300 dark:text-stone-600'}`}>
                  Export
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>

          <ScrollView className="flex-1 px-5 pt-5">
            {/* Case Selection */}
            <View className="mb-5">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                Select Case
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                {cases.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => {
                      setSelectedCaseId(c.id);
                      setSelectedDocIds([]);
                      setSelectedEvidenceIds([]);
                    }}
                    className={`mr-2 px-4 py-2.5 rounded-full border ${
                      selectedCaseId === c.id
                        ? 'bg-teal-100 dark:bg-teal-900/40 border-teal-300 dark:border-teal-700'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    <Text className={`text-sm ${
                      selectedCaseId === c.id
                        ? 'text-teal-700 dark:text-teal-400 font-medium'
                        : 'text-stone-600 dark:text-stone-300'
                    }`}>
                      {c.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Documents Selection */}
            {caseDocs.length > 0 && (
              <View className="mb-5">
                <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                  Include Documents ({selectedDocIds.length} selected)
                </Text>
                {caseDocs.map((doc) => (
                  <Pressable
                    key={doc.id}
                    onPress={() => toggleDocSelection(doc.id)}
                    className={`p-3 rounded-xl mb-2 border flex-row items-center ${
                      selectedDocIds.includes(doc.id)
                        ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    <View className={`w-5 h-5 rounded border mr-3 items-center justify-center ${
                      selectedDocIds.includes(doc.id)
                        ? 'bg-teal-600 dark:bg-teal-500 border-teal-600 dark:border-teal-500'
                        : 'border-stone-300 dark:border-stone-600'
                    }`}>
                      {selectedDocIds.includes(doc.id) && <Check size={14} color="#fff" />}
                    </View>
                    <Text className={`flex-1 ${
                      selectedDocIds.includes(doc.id)
                        ? 'text-teal-700 dark:text-teal-400'
                        : 'text-stone-700 dark:text-stone-200'
                    }`}>
                      {doc.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Evidence Selection */}
            {caseEvidence.length > 0 && (
              <View className="mb-5">
                <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                  Include Evidence ({selectedEvidenceIds.length} selected)
                </Text>

                <Pressable
                  onPress={() => setIncludeEvidenceList(!includeEvidenceList)}
                  className={`p-3 rounded-xl mb-3 border flex-row items-center ${
                    includeEvidenceList
                      ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700'
                      : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
                  }`}
                >
                  <View className={`w-5 h-5 rounded border mr-3 items-center justify-center ${
                    includeEvidenceList
                      ? 'bg-teal-600 dark:bg-teal-500 border-teal-600 dark:border-teal-500'
                      : 'border-stone-300 dark:border-stone-600'
                  }`}>
                    {includeEvidenceList && <Check size={14} color="#fff" />}
                  </View>
                  <Text className={`${
                    includeEvidenceList
                      ? 'text-teal-700 dark:text-teal-400'
                      : 'text-stone-700 dark:text-stone-200'
                  }`}>
                    Include evidence index table
                  </Text>
                </Pressable>

                {caseEvidence.map((ev) => (
                  <Pressable
                    key={ev.id}
                    onPress={() => toggleEvidenceSelection(ev.id)}
                    className={`p-3 rounded-xl mb-2 border flex-row items-center ${
                      selectedEvidenceIds.includes(ev.id)
                        ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    <View className={`w-5 h-5 rounded border mr-3 items-center justify-center ${
                      selectedEvidenceIds.includes(ev.id)
                        ? 'bg-teal-600 dark:bg-teal-500 border-teal-600 dark:border-teal-500'
                        : 'border-stone-300 dark:border-stone-600'
                    }`}>
                      {selectedEvidenceIds.includes(ev.id) && <Check size={14} color="#fff" />}
                    </View>
                    <View className="flex-1">
                      <Text className={`${
                        selectedEvidenceIds.includes(ev.id)
                          ? 'text-teal-700 dark:text-teal-400'
                          : 'text-stone-700 dark:text-stone-200'
                      }`}>
                        {ev.title}
                      </Text>
                      <Text className="text-stone-400 dark:text-stone-500 text-xs">{ev.type}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {caseDocs.length === 0 && caseEvidence.length === 0 && selectedCaseId && (
              <View className="items-center py-10">
                <Text className="text-stone-400 dark:text-stone-500 text-center">
                  No documents or evidence for this case yet.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
