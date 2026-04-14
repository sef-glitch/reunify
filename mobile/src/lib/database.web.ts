import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBCase {
  id: string;
  userId: string;
  name: string;
  state: string;
  county: string;
  caseType: 'custody' | 'cps' | 'visitation' | 'modification' | 'other';
  stage: 'initial' | 'discovery' | 'mediation' | 'trial' | 'appeals' | 'closed';
  nextHearingDate: string | null;
  goals: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBTask {
  id: string;
  userId: string;
  caseId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
  aiGenerated?: boolean;
  aiPlanId?: string;
}

export interface DBDocument {
  id: string;
  userId: string;
  caseId: string;
  title: string;
  category: 'letter' | 'declaration' | 'log' | 'request' | 'other';
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBDocumentVersion {
  id: string;
  documentId: string;
  version: number;
  content: string;
  createdAt: string;
}

export interface DBEvidence {
  id: string;
  userId: string;
  caseId: string;
  title: string;
  type: 'photo' | 'document' | 'audio' | 'video' | 'other';
  uri: string;
  notes: string;
  tags: string;
  linkedTaskIds: string;
  linkedDocumentIds: string;
  createdAt: string;
}

export interface DBSettings {
  id: string;
  userId: string;
  key: string;
  value: string;
  updatedAt: string;
}

// Storage keys
const STORAGE_KEYS = {
  users: 'reunify_users',
  cases: 'reunify_cases',
  tasks: 'reunify_tasks',
  documents: 'reunify_documents',
  documentVersions: 'reunify_document_versions',
  evidence: 'reunify_evidence',
  settings: 'reunify_settings',
};

// In-memory cache for sync operations
let usersCache: User[] = [];
let casesCache: DBCase[] = [];
let tasksCache: DBTask[] = [];
let documentsCache: DBDocument[] = [];
let documentVersionsCache: DBDocumentVersion[] = [];
let evidenceCache: DBEvidence[] = [];
let settingsCache: DBSettings[] = [];

// Generate ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Simple hash for web (not secure, but matches native behavior)
async function simpleHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Persist to AsyncStorage
async function persistData() {
  try {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.users, JSON.stringify(usersCache)),
      AsyncStorage.setItem(STORAGE_KEYS.cases, JSON.stringify(casesCache)),
      AsyncStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasksCache)),
      AsyncStorage.setItem(STORAGE_KEYS.documents, JSON.stringify(documentsCache)),
      AsyncStorage.setItem(STORAGE_KEYS.documentVersions, JSON.stringify(documentVersionsCache)),
      AsyncStorage.setItem(STORAGE_KEYS.evidence, JSON.stringify(evidenceCache)),
      AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settingsCache)),
    ]);
  } catch (error) {
    console.error('Persist data error:', error);
  }
}

// Load from AsyncStorage
async function loadData() {
  try {
    const [users, cases, tasks, documents, documentVersions, evidence, settings] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.users),
      AsyncStorage.getItem(STORAGE_KEYS.cases),
      AsyncStorage.getItem(STORAGE_KEYS.tasks),
      AsyncStorage.getItem(STORAGE_KEYS.documents),
      AsyncStorage.getItem(STORAGE_KEYS.documentVersions),
      AsyncStorage.getItem(STORAGE_KEYS.evidence),
      AsyncStorage.getItem(STORAGE_KEYS.settings),
    ]);

    usersCache = users ? JSON.parse(users) : [];
    casesCache = cases ? JSON.parse(cases) : [];
    tasksCache = tasks ? JSON.parse(tasks) : [];
    documentsCache = documents ? JSON.parse(documents) : [];
    documentVersionsCache = documentVersions ? JSON.parse(documentVersions) : [];
    evidenceCache = evidence ? JSON.parse(evidence) : [];
    settingsCache = settings ? JSON.parse(settings) : [];
  } catch (error) {
    console.error('Load data error:', error);
  }
}

// Initialize database
let initialized = false;
export function initDatabase() {
  if (initialized) return;
  initialized = true;
  // Load data asynchronously
  loadData();
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return simpleHash(password + 'reunify_salt_2024');
}

// ==================== USER OPERATIONS ====================

export async function createUser(email: string, password: string): Promise<User | null> {
  const id = generateId();
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(password);

  const newUser: User = {
    id,
    email: email.toLowerCase(),
    passwordHash,
    name: '',
    phone: '',
    notes: '',
    createdAt: now,
    updatedAt: now,
  };

  usersCache.push(newUser);
  await persistData();
  return newUser;
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const passwordHash = await hashPassword(password);
  return usersCache.find(u => u.email === email.toLowerCase() && u.passwordHash === passwordHash) ?? null;
}

export function getUserById(id: string): User | null {
  return usersCache.find(u => u.id === id) ?? null;
}

export function getUserByEmail(email: string): User | null {
  return usersCache.find(u => u.email === email.toLowerCase()) ?? null;
}

export function updateUser(id: string, data: Partial<Pick<User, 'name' | 'phone' | 'notes'>>): User | null {
  const index = usersCache.findIndex(u => u.id === id);
  if (index === -1) return null;

  const now = new Date().toISOString();
  usersCache[index] = {
    ...usersCache[index],
    ...data,
    updatedAt: now,
  };
  persistData();
  return usersCache[index];
}

// ==================== CASE OPERATIONS ====================

export function getCasesByUserId(userId: string): DBCase[] {
  return casesCache.filter(c => c.userId === userId).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getCaseById(id: string): DBCase | null {
  return casesCache.find(c => c.id === id) ?? null;
}

export function createCase(
  userId: string,
  data: Omit<DBCase, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'goals'> & { goals: string[] }
): DBCase | null {
  const id = generateId();
  const now = new Date().toISOString();

  const newCase: DBCase = {
    id,
    userId,
    name: data.name,
    state: data.state,
    county: data.county,
    caseType: data.caseType,
    stage: data.stage,
    nextHearingDate: data.nextHearingDate,
    goals: JSON.stringify(data.goals),
    createdAt: now,
    updatedAt: now,
  };

  casesCache.push(newCase);
  persistData();
  return newCase;
}

export function updateCase(
  id: string,
  data: Partial<Omit<DBCase, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'goals'> & { goals: string[] }>
): DBCase | null {
  const index = casesCache.findIndex(c => c.id === id);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const updateData: Partial<DBCase> = { updatedAt: now };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.state !== undefined) updateData.state = data.state;
  if (data.county !== undefined) updateData.county = data.county;
  if (data.caseType !== undefined) updateData.caseType = data.caseType;
  if (data.stage !== undefined) updateData.stage = data.stage;
  if (data.nextHearingDate !== undefined) updateData.nextHearingDate = data.nextHearingDate;
  if (data.goals !== undefined) updateData.goals = JSON.stringify(data.goals);

  casesCache[index] = { ...casesCache[index], ...updateData };
  persistData();
  return casesCache[index];
}

export function deleteCase(id: string): void {
  tasksCache = tasksCache.filter(t => t.caseId !== id);
  documentsCache = documentsCache.filter(d => d.caseId !== id);
  evidenceCache = evidenceCache.filter(e => e.caseId !== id);
  casesCache = casesCache.filter(c => c.id !== id);
  persistData();
}

// ==================== TASK OPERATIONS ====================

export function getTasksByUserId(userId: string): DBTask[] {
  return tasksCache.filter(t => t.userId === userId).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getTaskById(id: string): DBTask | null {
  return tasksCache.find(t => t.id === id) ?? null;
}

export function createTask(
  userId: string,
  data: Omit<DBTask, 'id' | 'userId' | 'createdAt' | 'completedAt'>
): DBTask | null {
  const id = generateId();
  const now = new Date().toISOString();

  const newTask: DBTask = {
    id,
    userId,
    caseId: data.caseId,
    title: data.title,
    description: data.description,
    priority: data.priority,
    status: data.status,
    dueDate: data.dueDate,
    createdAt: now,
    completedAt: null,
    aiGenerated: data.aiGenerated,
    aiPlanId: data.aiPlanId,
  };

  tasksCache.push(newTask);
  persistData();
  return newTask;
}

export function createTasksFromPlan(
  userId: string,
  caseId: string,
  tasks: Array<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate: string | null;
  }>,
  planId: string
): DBTask[] {
  const now = new Date().toISOString();
  const createdTasks: DBTask[] = [];

  for (const task of tasks) {
    const id = generateId();
    const newTask: DBTask = {
      id,
      userId,
      caseId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: 'pending',
      dueDate: task.dueDate,
      createdAt: now,
      completedAt: null,
      aiGenerated: true,
      aiPlanId: planId,
    };
    tasksCache.push(newTask);
    createdTasks.push(newTask);
  }

  persistData();
  return createdTasks;
}

export function updateTask(
  id: string,
  data: Partial<Omit<DBTask, 'id' | 'userId' | 'createdAt'>>
): DBTask | null {
  const index = tasksCache.findIndex(t => t.id === id);
  if (index === -1) return null;

  tasksCache[index] = { ...tasksCache[index], ...data };
  persistData();
  return tasksCache[index];
}

export function deleteTask(id: string): void {
  tasksCache = tasksCache.filter(t => t.id !== id);
  persistData();
}

// ==================== DOCUMENT OPERATIONS ====================

export function getDocumentsByUserId(userId: string): DBDocument[] {
  return documentsCache.filter(d => d.userId === userId).sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getDocumentById(id: string): DBDocument | null {
  return documentsCache.find(d => d.id === id) ?? null;
}

export function createDocument(
  userId: string,
  data: Omit<DBDocument, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): DBDocument | null {
  const id = generateId();
  const now = new Date().toISOString();

  const newDoc: DBDocument = {
    id,
    userId,
    caseId: data.caseId,
    title: data.title,
    category: data.category,
    content: data.content,
    createdAt: now,
    updatedAt: now,
  };

  documentsCache.push(newDoc);

  // Create initial version
  const versionId = generateId();
  documentVersionsCache.push({
    id: versionId,
    documentId: id,
    version: 1,
    content: data.content,
    createdAt: now,
  });

  persistData();
  return newDoc;
}

export function updateDocument(
  id: string,
  data: Partial<Omit<DBDocument, 'id' | 'userId' | 'createdAt'>>
): DBDocument | null {
  const index = documentsCache.findIndex(d => d.id === id);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const oldContent = documentsCache[index].content;

  documentsCache[index] = { ...documentsCache[index], ...data, updatedAt: now };

  // Create version if content changed
  if (data.content !== undefined && data.content !== oldContent) {
    const existingVersions = documentVersionsCache.filter(v => v.documentId === id);
    const nextVersion = existingVersions.length + 1;
    const versionId = generateId();
    documentVersionsCache.push({
      id: versionId,
      documentId: id,
      version: nextVersion,
      content: data.content,
      createdAt: now,
    });
  }

  persistData();
  return documentsCache[index];
}

export function getDocumentVersions(documentId: string): DBDocumentVersion[] {
  return documentVersionsCache
    .filter(v => v.documentId === documentId)
    .sort((a, b) => b.version - a.version);
}

export function deleteDocument(id: string): void {
  documentsCache = documentsCache.filter(d => d.id !== id);
  documentVersionsCache = documentVersionsCache.filter(v => v.documentId !== id);
  persistData();
}

// ==================== EVIDENCE OPERATIONS ====================

export function getEvidenceByUserId(userId: string): DBEvidence[] {
  return evidenceCache.filter(e => e.userId === userId).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getEvidenceById(id: string): DBEvidence | null {
  return evidenceCache.find(e => e.id === id) ?? null;
}

export function createEvidence(
  userId: string,
  data: Omit<DBEvidence, 'id' | 'userId' | 'createdAt' | 'tags' | 'linkedTaskIds' | 'linkedDocumentIds'> & {
    tags: string[];
    linkedTaskIds: string[];
    linkedDocumentIds: string[];
  }
): DBEvidence | null {
  const id = generateId();
  const now = new Date().toISOString();

  const newEvidence: DBEvidence = {
    id,
    userId,
    caseId: data.caseId,
    title: data.title,
    type: data.type,
    uri: data.uri,
    notes: data.notes,
    tags: JSON.stringify(data.tags),
    linkedTaskIds: JSON.stringify(data.linkedTaskIds),
    linkedDocumentIds: JSON.stringify(data.linkedDocumentIds),
    createdAt: now,
  };

  evidenceCache.push(newEvidence);
  persistData();
  return newEvidence;
}

export function updateEvidence(
  id: string,
  data: Partial<Omit<DBEvidence, 'id' | 'userId' | 'createdAt' | 'tags' | 'linkedTaskIds' | 'linkedDocumentIds'> & {
    tags: string[];
    linkedTaskIds: string[];
    linkedDocumentIds: string[];
  }>
): DBEvidence | null {
  const index = evidenceCache.findIndex(e => e.id === id);
  if (index === -1) return null;

  const updateData: Partial<DBEvidence> = {};
  if (data.caseId !== undefined) updateData.caseId = data.caseId;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.uri !== undefined) updateData.uri = data.uri;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);
  if (data.linkedTaskIds !== undefined) updateData.linkedTaskIds = JSON.stringify(data.linkedTaskIds);
  if (data.linkedDocumentIds !== undefined) updateData.linkedDocumentIds = JSON.stringify(data.linkedDocumentIds);

  evidenceCache[index] = { ...evidenceCache[index], ...updateData };
  persistData();
  return evidenceCache[index];
}

export function deleteEvidence(id: string): void {
  evidenceCache = evidenceCache.filter(e => e.id !== id);
  persistData();
}

// ==================== SETTINGS OPERATIONS ====================

export function getSetting(userId: string, key: string): string | null {
  const setting = settingsCache.find(s => s.userId === userId && s.key === key);
  return setting?.value ?? null;
}

export function setSetting(userId: string, key: string, value: string): void {
  const now = new Date().toISOString();
  const index = settingsCache.findIndex(s => s.userId === userId && s.key === key);

  if (index === -1) {
    settingsCache.push({
      id: generateId(),
      userId,
      key,
      value,
      updatedAt: now,
    });
  } else {
    settingsCache[index] = { ...settingsCache[index], value, updatedAt: now };
  }
  persistData();
}

export function getAllSettings(userId: string): Record<string, string> {
  const settings: Record<string, string> = {};
  for (const row of settingsCache.filter(s => s.userId === userId)) {
    settings[row.key] = row.value;
  }
  return settings;
}
