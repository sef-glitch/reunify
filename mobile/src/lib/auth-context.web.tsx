import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initDatabase,
  createUser,
  authenticateUser,
  getUserById,
  updateUser,
  User,
  getCasesByUserId,
  getTasksByUserId,
  getDocumentsByUserId,
  getEvidenceByUserId,
  DBCase,
  DBTask,
  DBDocument,
  DBEvidence,
  createCase as dbCreateCase,
  updateCase as dbUpdateCase,
  deleteCase as dbDeleteCase,
  createTask as dbCreateTask,
  updateTask as dbUpdateTask,
  deleteTask as dbDeleteTask,
  createDocument as dbCreateDocument,
  updateDocument as dbUpdateDocument,
  deleteDocument as dbDeleteDocument,
  createEvidence as dbCreateEvidence,
  updateEvidence as dbUpdateEvidence,
  deleteEvidence as dbDeleteEvidence,
  getUserByEmail,
} from './database';

const USER_SESSION_KEY = 'reunify_user_id';

// Transformed types for UI (matching existing store types)
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

interface AuthContextType {
  // Auth state
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;

  // Auth actions
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;

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

  // Refresh data
  refreshData: () => void;

  // Demo data
  seedDemoData: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Transform DB types to UI types
function transformCase(dbCase: DBCase): Case {
  return {
    id: dbCase.id,
    name: dbCase.name,
    state: dbCase.state,
    county: dbCase.county,
    caseType: dbCase.caseType,
    stage: dbCase.stage,
    nextHearingDate: dbCase.nextHearingDate,
    goals: JSON.parse(dbCase.goals || '[]'),
    createdAt: dbCase.createdAt,
    updatedAt: dbCase.updatedAt,
  };
}

function transformTask(dbTask: DBTask): Task {
  return {
    id: dbTask.id,
    caseId: dbTask.caseId,
    title: dbTask.title,
    description: dbTask.description,
    priority: dbTask.priority,
    status: dbTask.status,
    dueDate: dbTask.dueDate,
    createdAt: dbTask.createdAt,
    completedAt: dbTask.completedAt,
  };
}

function transformDocument(dbDoc: DBDocument): Document {
  return {
    id: dbDoc.id,
    caseId: dbDoc.caseId,
    title: dbDoc.title,
    category: dbDoc.category,
    content: dbDoc.content,
    createdAt: dbDoc.createdAt,
    updatedAt: dbDoc.updatedAt,
  };
}

function transformEvidence(dbEvidence: DBEvidence): Evidence {
  return {
    id: dbEvidence.id,
    caseId: dbEvidence.caseId,
    title: dbEvidence.title,
    type: dbEvidence.type,
    uri: dbEvidence.uri,
    notes: dbEvidence.notes,
    tags: JSON.parse(dbEvidence.tags || '[]'),
    linkedTaskIds: JSON.parse(dbEvidence.linkedTaskIds || '[]'),
    linkedDocumentIds: JSON.parse(dbEvidence.linkedDocumentIds || '[]'),
    createdAt: dbEvidence.createdAt,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);

  const isAuthenticated = user !== null;

  const profile: UserProfile = useMemo(() => ({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    notes: user?.notes ?? '',
  }), [user]);

  // Load all data from database
  const loadData = useCallback((userId: string) => {
    try {
      const dbCases = getCasesByUserId(userId);
      const dbTasks = getTasksByUserId(userId);
      const dbDocuments = getDocumentsByUserId(userId);
      const dbEvidence = getEvidenceByUserId(userId);

      setCases(dbCases.map(transformCase));
      setTasks(dbTasks.map(transformTask));
      setDocuments(dbDocuments.map(transformDocument));
      setEvidence(dbEvidence.map(transformEvidence));
    } catch (error) {
      console.error('Load data error:', error);
    }
  }, []);

  const refreshData = useCallback(() => {
    if (user) {
      loadData(user.id);
    }
  }, [user, loadData]);

  // Initialize database and check session
  useEffect(() => {
    async function init() {
      try {
        initDatabase();
        // Use AsyncStorage instead of SecureStore for web
        const storedUserId = await AsyncStorage.getItem(USER_SESSION_KEY);
        if (storedUserId) {
          const existingUser = getUserById(storedUserId);
          if (existingUser) {
            setUser(existingUser);
            loadData(existingUser.id);
          }
        }
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [loadData]);

  // Auth actions
  const signUp = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    const existingUser = getUserByEmail(email);
    if (existingUser) {
      return { success: false, error: 'An account with this email already exists' };
    }

    const newUser = await createUser(email, password);
    if (!newUser) {
      return { success: false, error: 'Failed to create account' };
    }

    await AsyncStorage.setItem(USER_SESSION_KEY, newUser.id);
    setUser(newUser);
    loadData(newUser.id);
    return { success: true };
  }, [loadData]);

  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    const authenticatedUser = await authenticateUser(email, password);
    if (!authenticatedUser) {
      return { success: false, error: 'Invalid email or password' };
    }

    await AsyncStorage.setItem(USER_SESSION_KEY, authenticatedUser.id);
    setUser(authenticatedUser);
    loadData(authenticatedUser.id);
    return { success: true };
  }, [loadData]);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(USER_SESSION_KEY);
    setUser(null);
    setCases([]);
    setTasks([]);
    setDocuments([]);
    setEvidence([]);
  }, []);

  // Case actions
  const addCase = useCallback((caseData: Omit<Case, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    dbCreateCase(user.id, caseData);
    loadData(user.id);
  }, [user, loadData]);

  const handleUpdateCase = useCallback((id: string, caseData: Partial<Case>) => {
    if (!user) return;
    dbUpdateCase(id, caseData);
    loadData(user.id);
  }, [user, loadData]);

  const handleDeleteCase = useCallback((id: string) => {
    if (!user) return;
    dbDeleteCase(id);
    loadData(user.id);
  }, [user, loadData]);

  // Task actions
  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'completedAt'>) => {
    if (!user) return;
    dbCreateTask(user.id, task);
    loadData(user.id);
  }, [user, loadData]);

  const handleUpdateTask = useCallback((id: string, task: Partial<Task>) => {
    if (!user) return;
    dbUpdateTask(id, task);
    loadData(user.id);
  }, [user, loadData]);

  const handleDeleteTask = useCallback((id: string) => {
    if (!user) return;
    dbDeleteTask(id);
    loadData(user.id);
  }, [user, loadData]);

  const toggleTaskStatus = useCallback((id: string) => {
    if (!user) return;
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    dbUpdateTask(id, {
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : null,
    });
    loadData(user.id);
  }, [user, tasks, loadData]);

  // Document actions
  const addDocument = useCallback((doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    dbCreateDocument(user.id, doc);
    loadData(user.id);
  }, [user, loadData]);

  const handleUpdateDocument = useCallback((id: string, doc: Partial<Document>) => {
    if (!user) return;
    dbUpdateDocument(id, doc);
    loadData(user.id);
  }, [user, loadData]);

  const handleDeleteDocument = useCallback((id: string) => {
    if (!user) return;
    dbDeleteDocument(id);
    loadData(user.id);
  }, [user, loadData]);

  // Evidence actions
  const addEvidence = useCallback((evidenceData: Omit<Evidence, 'id' | 'createdAt'>) => {
    if (!user) return;
    dbCreateEvidence(user.id, evidenceData);
    loadData(user.id);
  }, [user, loadData]);

  const handleUpdateEvidence = useCallback((id: string, evidenceData: Partial<Evidence>) => {
    if (!user) return;
    const dataToUpdate: Parameters<typeof dbUpdateEvidence>[1] = {};

    if (evidenceData.caseId !== undefined) dataToUpdate.caseId = evidenceData.caseId;
    if (evidenceData.title !== undefined) dataToUpdate.title = evidenceData.title;
    if (evidenceData.type !== undefined) dataToUpdate.type = evidenceData.type;
    if (evidenceData.uri !== undefined) dataToUpdate.uri = evidenceData.uri;
    if (evidenceData.notes !== undefined) dataToUpdate.notes = evidenceData.notes;
    if (evidenceData.tags !== undefined) dataToUpdate.tags = evidenceData.tags;
    if (evidenceData.linkedTaskIds !== undefined) dataToUpdate.linkedTaskIds = evidenceData.linkedTaskIds;
    if (evidenceData.linkedDocumentIds !== undefined) dataToUpdate.linkedDocumentIds = evidenceData.linkedDocumentIds;

    dbUpdateEvidence(id, dataToUpdate);
    loadData(user.id);
  }, [user, loadData]);

  const handleDeleteEvidence = useCallback((id: string) => {
    if (!user) return;
    dbDeleteEvidence(id);
    loadData(user.id);
  }, [user, loadData]);

  // Profile actions
  const updateProfileHandler = useCallback((profileData: Partial<UserProfile>) => {
    if (!user) return;
    const updatedUser = updateUser(user.id, {
      name: profileData.name,
      phone: profileData.phone,
      notes: profileData.notes,
    });
    if (updatedUser) {
      setUser(updatedUser);
    }
  }, [user]);

  // Seed demo data (no-op for web - demo data seeding happens on native)
  const seedDemoData = useCallback(() => {
    // Demo data seeding is handled on native platform
  }, []);

  const value: AuthContextType = {
    isLoading,
    isAuthenticated,
    user,
    signUp,
    signIn,
    signOut,
    cases,
    tasks,
    documents,
    evidence,
    profile,
    addCase,
    updateCase: handleUpdateCase,
    deleteCase: handleDeleteCase,
    addTask,
    updateTask: handleUpdateTask,
    deleteTask: handleDeleteTask,
    toggleTaskStatus,
    addDocument,
    updateDocument: handleUpdateDocument,
    deleteDocument: handleDeleteDocument,
    addEvidence,
    updateEvidence: handleUpdateEvidence,
    deleteEvidence: handleDeleteEvidence,
    updateProfile: updateProfileHandler,
    refreshData,
    seedDemoData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
