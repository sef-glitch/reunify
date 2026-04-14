import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, CheckCircle2, Circle, Clock, Download } from 'lucide-react-native';
import { useAuth, Task } from '@/lib/auth-context';
import { exportTasksToCSV } from '@/lib/export-helpers';

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' },
  { value: 'high', label: 'High', color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' },
] as const;

type Priority = Task['priority'];
type TaskStatus = Task['status'];

export default function TasksScreen() {
  const { cases, tasks, addTask, updateTask, deleteTask, toggleTaskStatus } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedCaseFilter, setSelectedCaseFilter] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const [formData, setFormData] = useState({
    caseId: '',
    title: '',
    description: '',
    priority: 'medium' as Priority,
    dueDate: '',
  });

  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    if (selectedCaseFilter) {
      filtered = filtered.filter((t) => t.caseId === selectedCaseFilter);
    }

    if (!showCompleted) {
      filtered = filtered.filter((t) => t.status !== 'completed');
    }

    // Sort by priority and due date
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return filtered.sort((a, b) => {
      // Completed tasks at the bottom
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;

      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return a.dueDate ? -1 : 1;
    });
  }, [tasks, selectedCaseFilter, showCompleted]);

  const completedCount = useMemo(() => {
    let filtered = tasks;
    if (selectedCaseFilter) {
      filtered = filtered.filter((t) => t.caseId === selectedCaseFilter);
    }
    return filtered.filter((t) => t.status === 'completed').length;
  }, [tasks, selectedCaseFilter]);

  const resetForm = () => {
    setFormData({
      caseId: cases[0]?.id || '',
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
    });
    setEditingTask(null);
  };

  const openCreateModal = () => {
    resetForm();
    if (selectedCaseFilter) {
      setFormData((prev) => ({ ...prev, caseId: selectedCaseFilter }));
    }
    setModalVisible(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      caseId: task.caseId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate || '',
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.caseId || !formData.title.trim()) return;

    if (editingTask) {
      updateTask(editingTask.id, {
        caseId: formData.caseId,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        dueDate: formData.dueDate || null,
      });
    } else {
      addTask({
        caseId: formData.caseId,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: 'pending',
        dueDate: formData.dueDate || null,
      });
    }

    setModalVisible(false);
    resetForm();
  };

  const handleDelete = () => {
    if (editingTask) {
      deleteTask(editingTask.id);
      setModalVisible(false);
      resetForm();
    }
  };

  const getCaseName = (caseId: string) => {
    return cases.find((c) => c.id === caseId)?.name || 'Unknown Case';
  };

  const getDaysUntil = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 0) return 'Overdue';
    return `${diff}d`;
  };

  const getPriorityInfo = (priority: Priority) => {
    return PRIORITIES.find((p) => p.value === priority) || PRIORITIES[1];
  };

  const handleExportCSV = async () => {
    const result = await exportTasksToCSV(tasks, cases, {
      caseId: selectedCaseFilter ?? undefined,
      includeCompleted: true,
    });
    if (!result.success) {
      Alert.alert('Export Failed', result.error || 'Could not export tasks');
    }
  };

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <SafeAreaView edges={['top']} className="bg-stone-50 dark:bg-stone-950">
        <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-semibold text-stone-800 dark:text-stone-100">
              Tasks
            </Text>
            <Text className="text-stone-500 dark:text-stone-400 text-sm mt-0.5">
              Your action checklist
            </Text>
          </View>
          <View className="flex-row items-center">
            {tasks.length > 0 && (
              <Pressable
                onPress={handleExportCSV}
                className="w-10 h-10 rounded-full items-center justify-center active:opacity-80 bg-stone-200 dark:bg-stone-800 mr-2"
              >
                <Download size={20} color="#6b7280" />
              </Pressable>
            )}
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
        </View>
      </SafeAreaView>

      {/* Filter Bar */}
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
              <CheckCircle2 size={32} color="#9ca3af" />
            </View>
            <Text className="text-stone-600 dark:text-stone-300 text-lg font-medium text-center">
              Create a case first
            </Text>
            <Text className="text-stone-400 dark:text-stone-500 text-sm text-center mt-2">
              You need at least one case before you can add tasks
            </Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8 pt-20">
            <View className="w-16 h-16 rounded-full bg-stone-200 dark:bg-stone-800 items-center justify-center mb-4">
              <CheckCircle2 size={32} color="#9ca3af" />
            </View>
            <Text className="text-stone-600 dark:text-stone-300 text-lg font-medium text-center">
              {showCompleted ? 'No tasks' : 'All caught up'}
            </Text>
            <Text className="text-stone-400 dark:text-stone-500 text-sm text-center mt-2">
              {showCompleted ? 'Add your first task' : 'No pending tasks right now'}
            </Text>
            <Pressable
              onPress={openCreateModal}
              className="mt-6 bg-teal-600 dark:bg-teal-500 px-6 py-3 rounded-full active:opacity-80"
            >
              <Text className="text-white font-medium">Add Task</Text>
            </Pressable>
          </View>
        ) : (
          <View className="px-4 pt-4">
            {filteredTasks.map((task) => {
              const priorityInfo = getPriorityInfo(task.priority);
              const daysUntil = getDaysUntil(task.dueDate);
              const isOverdue = daysUntil === 'Overdue';

              return (
                <Pressable
                  key={task.id}
                  onPress={() => openEditModal(task)}
                  className="bg-white dark:bg-stone-900 rounded-xl p-4 mb-3 border border-stone-200/60 dark:border-stone-800 active:opacity-80"
                >
                  <View className="flex-row items-start">
                    <Pressable
                      onPress={() => toggleTaskStatus(task.id)}
                      className="mt-0.5 mr-3"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle2 size={24} color="#0d9488" />
                      ) : (
                        <Circle size={24} color="#d1d5db" />
                      )}
                    </Pressable>
                    <View className="flex-1">
                      <Text className={`font-medium ${
                        task.status === 'completed'
                          ? 'text-stone-400 dark:text-stone-500 line-through'
                          : 'text-stone-800 dark:text-stone-100'
                      }`}>
                        {task.title}
                      </Text>
                      {task.description ? (
                        <Text className="text-stone-500 dark:text-stone-400 text-sm mt-1" numberOfLines={2}>
                          {task.description}
                        </Text>
                      ) : null}
                      <View className="flex-row items-center mt-2 flex-wrap">
                        <View className={`px-2 py-1 rounded-full ${priorityInfo.color.split(' ').slice(0, 2).join(' ')}`}>
                          <Text className={`text-xs font-medium ${priorityInfo.color.split(' ').slice(2).join(' ')}`}>
                            {priorityInfo.label}
                          </Text>
                        </View>
                        {daysUntil && (
                          <View className={`flex-row items-center ml-2 px-2 py-1 rounded-full ${
                            isOverdue ? 'bg-red-100 dark:bg-red-900/30' : 'bg-stone-100 dark:bg-stone-800'
                          }`}>
                            <Clock size={12} color={isOverdue ? '#dc2626' : '#9ca3af'} />
                            <Text className={`text-xs ml-1 ${
                              isOverdue ? 'text-red-600 dark:text-red-400' : 'text-stone-500 dark:text-stone-400'
                            }`}>
                              {daysUntil}
                            </Text>
                          </View>
                        )}
                        <Text className="text-stone-400 dark:text-stone-500 text-xs ml-2">
                          {getCaseName(task.caseId)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}

            {/* Show/Hide Completed */}
            {completedCount > 0 && (
              <Pressable
                onPress={() => setShowCompleted(!showCompleted)}
                className="py-4 items-center"
              >
                <Text className="text-teal-600 dark:text-teal-400 text-sm font-medium">
                  {showCompleted ? 'Hide' : 'Show'} {completedCount} completed
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>

      {/* Create/Edit Task Modal */}
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
                {editingTask ? 'Edit Task' : 'New Task'}
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
              <View className="flex-row flex-wrap">
                {cases.map((caseItem) => (
                  <Pressable
                    key={caseItem.id}
                    onPress={() => setFormData({ ...formData, caseId: caseItem.id })}
                    className={`mr-2 mb-2 px-4 py-2.5 rounded-full border ${
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
              </View>
            </View>

            {/* Task Title */}
            <View className="mb-5">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                Task Title *
              </Text>
              <TextInput
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="e.g., Gather financial documents"
                placeholderTextColor="#9ca3af"
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 text-stone-800 dark:text-stone-100"
              />
            </View>

            {/* Description */}
            <View className="mb-5">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                Description
              </Text>
              <TextInput
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Additional details..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 text-stone-800 dark:text-stone-100 min-h-[80px]"
              />
            </View>

            {/* Priority */}
            <View className="mb-5">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                Priority
              </Text>
              <View className="flex-row flex-wrap">
                {PRIORITIES.map((priority) => (
                  <Pressable
                    key={priority.value}
                    onPress={() => setFormData({ ...formData, priority: priority.value })}
                    className={`mr-2 mb-2 px-4 py-2.5 rounded-full border ${
                      formData.priority === priority.value
                        ? 'bg-teal-100 dark:bg-teal-900/40 border-teal-300 dark:border-teal-700'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    <Text className={`text-sm ${
                      formData.priority === priority.value
                        ? 'text-teal-700 dark:text-teal-400 font-medium'
                        : 'text-stone-600 dark:text-stone-300'
                    }`}>
                      {priority.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Due Date */}
            <View className="mb-5">
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-medium mb-2">
                Due Date
              </Text>
              <TextInput
                value={formData.dueDate}
                onChangeText={(text) => setFormData({ ...formData, dueDate: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 text-stone-800 dark:text-stone-100"
              />
            </View>

            {/* Delete Button (only for editing) */}
            {editingTask && (
              <Pressable
                onPress={handleDelete}
                className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl py-3.5 items-center mb-10"
              >
                <Text className="text-red-600 dark:text-red-400 font-medium">Delete Task</Text>
              </Pressable>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
