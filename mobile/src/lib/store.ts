import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface Case {
  id: string;
  name: string;
  state: string;
  county: string;
  caseType: 'custody' | 'cps' | 'visitation' | 'modification' | 'other';
  stage: 'initial' | 'discovery' | 'mediation' | 'trial' | 'appeals' | 'closed';
  nextHearingDate: string | null;
  goals: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  caseId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface Document {
  id: string;
  caseId: string;
  title: string;
  category: 'letter' | 'declaration' | 'log' | 'request' | 'other';
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Evidence {
  id: string;
  caseId: string;
  title: string;
  type: 'photo' | 'document' | 'audio' | 'video' | 'other';
  uri: string;
  notes: string;
  tags: string[];
  linkedTaskIds: string[];
  linkedDocumentIds: string[];
  createdAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

interface AppState {
  // Data
  cases: Case[];
  tasks: Task[];
  documents: Document[];
  evidence: Evidence[];
  profile: UserProfile;

  // Case actions
  addCase: (caseData: Omit<Case, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCase: (id: string, caseData: Partial<Case>) => void;
  deleteCase: (id: string) => void;

  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completedAt'>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;

  // Document actions
  addDocument: (doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDocument: (id: string, doc: Partial<Document>) => void;
  deleteDocument: (id: string) => void;

  // Evidence actions
  addEvidence: (evidence: Omit<Evidence, 'id' | 'createdAt'>) => void;
  updateEvidence: (id: string, evidence: Partial<Evidence>) => void;
  deleteEvidence: (id: string) => void;

  // Profile actions
  updateProfile: (profile: Partial<UserProfile>) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial data
      cases: [],
      tasks: [],
      documents: [],
      evidence: [],
      profile: {
        name: '',
        email: '',
        phone: '',
        notes: '',
      },

      // Case actions
      addCase: (caseData) => set((state) => ({
        cases: [...state.cases, {
          ...caseData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
      })),

      updateCase: (id, caseData) => set((state) => ({
        cases: state.cases.map((c) =>
          c.id === id ? { ...c, ...caseData, updatedAt: new Date().toISOString() } : c
        ),
      })),

      deleteCase: (id) => set((state) => ({
        cases: state.cases.filter((c) => c.id !== id),
        tasks: state.tasks.filter((t) => t.caseId !== id),
        documents: state.documents.filter((d) => d.caseId !== id),
        evidence: state.evidence.filter((e) => e.caseId !== id),
      })),

      // Task actions
      addTask: (task) => set((state) => ({
        tasks: [...state.tasks, {
          ...task,
          id: generateId(),
          createdAt: new Date().toISOString(),
          completedAt: null,
        }],
      })),

      updateTask: (id, task) => set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, ...task } : t
        ),
      })),

      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      })),

      toggleTaskStatus: (id) => set((state) => ({
        tasks: state.tasks.map((t) => {
          if (t.id !== id) return t;
          const newStatus = t.status === 'completed' ? 'pending' : 'completed';
          return {
            ...t,
            status: newStatus,
            completedAt: newStatus === 'completed' ? new Date().toISOString() : null,
          };
        }),
      })),

      // Document actions
      addDocument: (doc) => set((state) => ({
        documents: [...state.documents, {
          ...doc,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
      })),

      updateDocument: (id, doc) => set((state) => ({
        documents: state.documents.map((d) =>
          d.id === id ? { ...d, ...doc, updatedAt: new Date().toISOString() } : d
        ),
      })),

      deleteDocument: (id) => set((state) => ({
        documents: state.documents.filter((d) => d.id !== id),
      })),

      // Evidence actions
      addEvidence: (evidence) => set((state) => ({
        evidence: [...state.evidence, {
          ...evidence,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }],
      })),

      updateEvidence: (id, evidence) => set((state) => ({
        evidence: state.evidence.map((e) =>
          e.id === id ? { ...e, ...evidence } : e
        ),
      })),

      deleteEvidence: (id) => set((state) => ({
        evidence: state.evidence.filter((e) => e.id !== id),
      })),

      // Profile actions
      updateProfile: (profile) => set((state) => ({
        profile: { ...state.profile, ...profile },
      })),
    }),
    {
      name: 'reunify-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
