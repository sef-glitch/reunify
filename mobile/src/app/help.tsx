import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  X,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Shield,
  FileOutput,
  HelpCircle,
  Scale,
  Heart,
  Lock,
  Cloud,
  Smartphone,
  MessageCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface HelpSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  items: FAQItem[];
}

const helpSections: HelpSection[] = [
  {
    id: 'subscriptions',
    title: 'Subscriptions & Billing',
    icon: <CreditCard size={20} color="#7c3aed" />,
    color: '#7c3aed',
    items: [
      {
        id: 'sub-1',
        question: 'What subscription plans are available?',
        answer:
          'We offer two subscription options:\n\n• Monthly: $12.99/month\n• Yearly: $99.99/year (save over 35%)\n\nBoth plans include a 7-day free trial so you can try all premium features risk-free.',
      },
      {
        id: 'sub-2',
        question: 'What features require a subscription?',
        answer:
          'Free features include basic case management, task tracking, and document storage.\n\nPremium features (requiring subscription):\n• AI-powered action plan generation\n• AI document drafting\n• Court packet export\n• Unlimited cases and documents',
      },
      {
        id: 'sub-3',
        question: 'How do I cancel my subscription?',
        answer:
          'You can cancel your subscription anytime through your device\'s app store:\n\n• iOS: Settings → Apple ID → Subscriptions → Reunify\n• Android: Play Store → Menu → Subscriptions → Reunify\n\nYou\'ll retain access until the end of your billing period.',
      },
      {
        id: 'sub-4',
        question: 'Will I lose my data if I cancel?',
        answer:
          'No, your data remains safely stored on your device even if you cancel. You\'ll still have access to view all your cases, documents, and evidence. Premium features like AI assistance and exports will be disabled until you resubscribe.',
      },
      {
        id: 'sub-5',
        question: 'How does the free trial work?',
        answer:
          'Your 7-day free trial gives you full access to all premium features. You won\'t be charged until the trial ends. Cancel anytime during the trial through your app store to avoid charges.',
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    icon: <Shield size={20} color="#059669" />,
    color: '#059669',
    items: [
      {
        id: 'priv-1',
        question: 'Where is my data stored?',
        answer:
          'All your data is stored locally on your device in an encrypted database. We do not have access to your cases, documents, evidence, or personal information. Your privacy is our top priority.',
      },
      {
        id: 'priv-2',
        question: 'Is my information shared with anyone?',
        answer:
          'No. Your data never leaves your device unless you explicitly export it. We don\'t sell, share, or have access to any of your personal information or case details.',
      },
      {
        id: 'priv-3',
        question: 'What about AI features?',
        answer:
          'When you use AI features, only the specific information you provide (like case type and goals) is sent to generate responses. This data is not stored or used for training. The AI responses are processed and immediately discarded.',
      },
      {
        id: 'priv-4',
        question: 'What happens if I lose my phone?',
        answer:
          'Since data is stored locally, losing your device means losing your data unless you\'ve exported backups. We recommend regularly exporting your court packets and documents to a secure location like cloud storage or email.',
      },
      {
        id: 'priv-5',
        question: 'Is my account password secure?',
        answer:
          'Your password is hashed using SHA-256 encryption before being stored. We never store plain text passwords. Your account also uses secure session management to keep you signed in safely.',
      },
    ],
  },
  {
    id: 'export',
    title: 'Exporting Records',
    icon: <FileOutput size={20} color="#2563eb" />,
    color: '#2563eb',
    items: [
      {
        id: 'exp-1',
        question: 'How do I export my court packet?',
        answer:
          'Go to Profile tab → Export Court Packet. Select the case you want to export, choose which documents and evidence to include, then tap Export. The packet will be generated as an HTML file you can share or print.',
      },
      {
        id: 'exp-2',
        question: 'What format are exports?',
        answer:
          'Court packets are exported as HTML files that can be opened in any web browser and printed. This format preserves formatting and is widely compatible with court systems.',
      },
      {
        id: 'exp-3',
        question: 'Can I export individual documents?',
        answer:
          'Yes, from the Documents tab you can view any document and copy its content. For a formatted export of multiple documents, use the Court Packet export feature.',
      },
      {
        id: 'exp-4',
        question: 'How do I back up all my data?',
        answer:
          'Regular exports of your court packets serve as backups. We recommend exporting after significant updates and storing copies in multiple locations (email, cloud storage, printed copies).',
      },
    ],
  },
  {
    id: 'legal',
    title: 'Legal Information',
    icon: <Scale size={20} color="#d97706" />,
    color: '#d97706',
    items: [
      {
        id: 'leg-1',
        question: 'Is this app a substitute for legal advice?',
        answer:
          'No. Reunify is an organizational tool to help you manage your case documents and information. It is NOT a substitute for professional legal advice. Always consult with a qualified attorney for legal guidance specific to your situation.',
      },
      {
        id: 'leg-2',
        question: 'Are AI-generated documents legally binding?',
        answer:
          'No. AI-generated documents are drafts meant to help you get started. They should always be reviewed, edited, and verified by you and ideally a legal professional before use in any official capacity.',
      },
      {
        id: 'leg-3',
        question: 'Can I use this app\'s documents in court?',
        answer:
          'The documents you create and store can be used as reference materials. However, any document submitted to court should be reviewed by a legal professional to ensure it meets your jurisdiction\'s requirements.',
      },
    ],
  },
  {
    id: 'using',
    title: 'Using the App',
    icon: <Smartphone size={20} color="#0d9488" />,
    color: '#0d9488',
    items: [
      {
        id: 'use-1',
        question: 'How do I create a new case?',
        answer:
          'Go to the Cases tab and tap the + button. Fill in your case details including name, type (custody, CPS, etc.), location, and goals. Your case will appear in the list and you can start adding tasks, documents, and evidence.',
      },
      {
        id: 'use-2',
        question: 'How does the AI assistant work?',
        answer:
          'The AI assistant can help you:\n\n• Generate action plans with prioritized tasks\n• Draft documents like letters and declarations\n• Explain legal terms in plain language\n\nAccess it from the Dashboard or tap the sparkle icon.',
      },
      {
        id: 'use-3',
        question: 'How do I upload evidence?',
        answer:
          'Go to the Evidence tab and tap the + button. You can take a photo, choose from your gallery, or upload a document. Add a title, notes, and tags to help organize your evidence.',
      },
      {
        id: 'use-4',
        question: 'Can I link evidence to tasks?',
        answer:
          'Yes! When adding or editing evidence, tap "Link to Tasks/Documents" to connect evidence to specific tasks or documents. This helps you organize related items together.',
      },
    ],
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<string[]>(['subscriptions']);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    );
  };

  const toggleItem = (itemId: string) => {
    Haptics.selectionAsync();
    setExpandedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleContact = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('mailto:support@reunifyapp.com?subject=Reunify%20Support%20Request');
  };

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <SafeAreaView edges={['top']} className="bg-stone-50 dark:bg-stone-950">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800">
          <Pressable
            onPress={() => router.back()}
            className="active:opacity-60"
            accessibilityLabel="Close help"
            accessibilityRole="button"
          >
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-lg font-semibold text-stone-800 dark:text-stone-100">
            Help & Support
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <Animated.View entering={FadeIn.delay(100)} className="px-5 pt-6 pb-4">
          <View className="flex-row items-center mb-2">
            <HelpCircle size={28} color="#0d9488" />
            <Text className="text-2xl font-bold text-stone-800 dark:text-stone-100 ml-2">
              How can we help?
            </Text>
          </View>
          <Text className="text-stone-500 dark:text-stone-400">
            Find answers about subscriptions, privacy, exports, and more.
          </Text>
        </Animated.View>

        {/* Sections */}
        {helpSections.map((section, sectionIndex) => (
          <Animated.View
            key={section.id}
            entering={FadeInDown.delay(150 + sectionIndex * 50)}
            className="mx-4 mb-3"
          >
            <View className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/60 dark:border-stone-800 overflow-hidden">
              <Pressable
                onPress={() => toggleSection(section.id)}
                className="flex-row items-center justify-between p-4"
                accessibilityLabel={`${section.title} section`}
                accessibilityRole="button"
                accessibilityState={{ expanded: expandedSections.includes(section.id) }}
              >
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${section.color}15` }}
                  >
                    {section.icon}
                  </View>
                  <Text className="font-semibold text-stone-800 dark:text-stone-100 ml-3 flex-1">
                    {section.title}
                  </Text>
                </View>
                {expandedSections.includes(section.id) ? (
                  <ChevronDown size={20} color="#9ca3af" />
                ) : (
                  <ChevronRight size={20} color="#9ca3af" />
                )}
              </Pressable>

              {expandedSections.includes(section.id) && (
                <View className="border-t border-stone-100 dark:border-stone-800">
                  {section.items.map((item, itemIndex) => (
                    <View key={item.id}>
                      {itemIndex > 0 && (
                        <View className="h-px bg-stone-100 dark:bg-stone-800 mx-4" />
                      )}
                      <Pressable
                        onPress={() => toggleItem(item.id)}
                        className="px-4 py-3.5"
                        accessibilityLabel={item.question}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: expandedItems.includes(item.id) }}
                      >
                        <View className="flex-row items-start">
                          <View className="flex-1">
                            <Text className="text-stone-700 dark:text-stone-200 font-medium pr-4">
                              {item.question}
                            </Text>
                          </View>
                          {expandedItems.includes(item.id) ? (
                            <ChevronDown size={18} color="#9ca3af" />
                          ) : (
                            <ChevronRight size={18} color="#9ca3af" />
                          )}
                        </View>
                        {expandedItems.includes(item.id) && (
                          <Text className="text-stone-500 dark:text-stone-400 text-sm mt-3 leading-5">
                            {item.answer}
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Animated.View>
        ))}

        {/* Support Card */}
        <Animated.View entering={FadeInDown.delay(500)} className="mx-4 mt-4">
          <View className="bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-800/50 p-5">
            <View className="flex-row items-center mb-3">
              <Heart size={20} color="#0d9488" />
              <Text className="text-teal-700 dark:text-teal-400 font-semibold ml-2">
                Need More Help?
              </Text>
            </View>
            <Text className="text-teal-700/80 dark:text-teal-400/80 text-sm leading-5 mb-4">
              We're here to support you through this journey. If you can't find what you need, reach out and we'll help.
            </Text>
            <Pressable
              onPress={handleContact}
              className="bg-teal-600 dark:bg-teal-500 rounded-xl py-3 flex-row items-center justify-center active:opacity-80"
              accessibilityLabel="Contact support"
              accessibilityRole="button"
            >
              <MessageCircle size={18} color="#fff" />
              <Text className="text-white font-semibold ml-2">Contact Support</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Legal Disclaimer */}
        <Animated.View entering={FadeInDown.delay(600)} className="px-5 mt-6">
          <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <View className="flex-row items-center mb-2">
              <Scale size={16} color="#d97706" />
              <Text className="font-medium text-amber-700 dark:text-amber-400 ml-2 text-sm">
                Legal Disclaimer
              </Text>
            </View>
            <Text className="text-amber-700 dark:text-amber-400 text-xs leading-5">
              Reunify is an organizational tool and does not provide legal advice. Always consult with a qualified attorney for guidance specific to your case. AI-generated content should be reviewed and verified before use.
            </Text>
          </View>
        </Animated.View>

        {/* Version Info */}
        <View className="items-center mt-6">
          <Text className="text-stone-400 dark:text-stone-500 text-xs">
            Reunify v1.0.0
          </Text>
          <View className="flex-row items-center mt-1">
            <Lock size={12} color="#9ca3af" />
            <Text className="text-stone-400 dark:text-stone-500 text-xs ml-1">
              Your data stays on your device
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
