import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

// Open database
const db = SQLite.openDatabaseSync('reunify.db');

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
  goals: string; // JSON string array
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

export interface DBEvidence {
  id: string;
  userId: string;
  caseId: string;
  title: string;
  type: 'photo' | 'document' | 'audio' | 'video' | 'other';
  uri: string;
  notes: string;
  tags: string; // JSON string array
  linkedTaskIds: string; // JSON string array
  linkedDocumentIds: string; // JSON string array
  createdAt: string;
}

export interface DBDocumentVersion {
  id: string;
  documentId: string;
  version: number;
  content: string;
  createdAt: string;
}

export interface DBSettings {
  id: string;
  userId: string;
  key: string;
  value: string;
  updatedAt: string;
}

// Initialize database
export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      name TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      state TEXT DEFAULT '',
      county TEXT DEFAULT '',
      caseType TEXT NOT NULL,
      stage TEXT NOT NULL,
      nextHearingDate TEXT,
      goals TEXT DEFAULT '[]',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      caseId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      dueDate TEXT,
      createdAt TEXT NOT NULL,
      completedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (caseId) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      caseId TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT DEFAULT '',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (caseId) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      caseId TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      uri TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      linkedTaskIds TEXT DEFAULT '[]',
      linkedDocumentIds TEXT DEFAULT '[]',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (caseId) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT DEFAULT '',
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(userId, key)
    );

    CREATE INDEX IF NOT EXISTS idx_cases_userId ON cases(userId);
    CREATE INDEX IF NOT EXISTS idx_tasks_userId ON tasks(userId);
    CREATE INDEX IF NOT EXISTS idx_tasks_caseId ON tasks(caseId);
    CREATE INDEX IF NOT EXISTS idx_documents_userId ON documents(userId);
    CREATE INDEX IF NOT EXISTS idx_documents_caseId ON documents(caseId);
    CREATE INDEX IF NOT EXISTS idx_evidence_userId ON evidence(userId);
    CREATE INDEX IF NOT EXISTS idx_evidence_caseId ON evidence(caseId);
    CREATE INDEX IF NOT EXISTS idx_settings_userId ON settings(userId);

    CREATE TABLE IF NOT EXISTS document_versions (
      id TEXT PRIMARY KEY,
      documentId TEXT NOT NULL,
      version INTEGER NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_document_versions_documentId ON document_versions(documentId);
  `);

  // Add new columns to tasks table (ignore if already exists)
  try {
    db.execSync(`ALTER TABLE tasks ADD COLUMN aiGenerated INTEGER DEFAULT 0`);
  } catch {
    // Column already exists
  }
  try {
    db.execSync(`ALTER TABLE tasks ADD COLUMN aiPlanId TEXT`);
  } catch {
    // Column already exists
  }
}

// Generate ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password + 'reunify_salt_2024'
  );
  return hash;
}

// ==================== USER OPERATIONS ====================

export async function createUser(email: string, password: string): Promise<User | null> {
  const id = generateId();
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(password);

  try {
    db.runSync(
      `INSERT INTO users (id, email, passwordHash, name, phone, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, '', '', '', ?, ?)`,
      [id, email.toLowerCase(), passwordHash, now, now]
    );
    return getUserById(id);
  } catch (error) {
    console.error('Create user error:', error);
    return null;
  }
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const passwordHash = await hashPassword(password);
  const result = db.getFirstSync<User>(
    `SELECT * FROM users WHERE email = ? AND passwordHash = ?`,
    [email.toLowerCase(), passwordHash]
  );
  return result ?? null;
}

export function getUserById(id: string): User | null {
  const result = db.getFirstSync<User>(`SELECT * FROM users WHERE id = ?`, [id]);
  return result ?? null;
}

export function getUserByEmail(email: string): User | null {
  const result = db.getFirstSync<User>(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase()]);
  return result ?? null;
}

export function updateUser(id: string, data: Partial<Pick<User, 'name' | 'phone' | 'notes'>>): User | null {
  const now = new Date().toISOString();
  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.phone !== undefined) {
    fields.push('phone = ?');
    values.push(data.phone);
  }
  if (data.notes !== undefined) {
    fields.push('notes = ?');
    values.push(data.notes);
  }

  if (fields.length === 0) return getUserById(id);

  fields.push('updatedAt = ?');
  values.push(now);
  values.push(id);

  db.runSync(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  return getUserById(id);
}

// ==================== CASE OPERATIONS ====================

export function getCasesByUserId(userId: string): DBCase[] {
  return db.getAllSync<DBCase>(`SELECT * FROM cases WHERE userId = ? ORDER BY createdAt DESC`, [userId]);
}

export function getCaseById(id: string): DBCase | null {
  const result = db.getFirstSync<DBCase>(`SELECT * FROM cases WHERE id = ?`, [id]);
  return result ?? null;
}

export function createCase(
  userId: string,
  data: Omit<DBCase, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'goals'> & { goals: string[] }
): DBCase | null {
  const id = generateId();
  const now = new Date().toISOString();

  db.runSync(
    `INSERT INTO cases (id, userId, name, state, county, caseType, stage, nextHearingDate, goals, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, data.name, data.state, data.county, data.caseType, data.stage, data.nextHearingDate, JSON.stringify(data.goals), now, now]
  );
  return getCaseById(id);
}

export function updateCase(
  id: string,
  data: Partial<Omit<DBCase, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'goals'> & { goals: string[] }>
): DBCase | null {
  const now = new Date().toISOString();
  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.state !== undefined) { fields.push('state = ?'); values.push(data.state); }
  if (data.county !== undefined) { fields.push('county = ?'); values.push(data.county); }
  if (data.caseType !== undefined) { fields.push('caseType = ?'); values.push(data.caseType); }
  if (data.stage !== undefined) { fields.push('stage = ?'); values.push(data.stage); }
  if (data.nextHearingDate !== undefined) { fields.push('nextHearingDate = ?'); values.push(data.nextHearingDate); }
  if (data.goals !== undefined) { fields.push('goals = ?'); values.push(JSON.stringify(data.goals)); }

  if (fields.length === 0) return getCaseById(id);

  fields.push('updatedAt = ?');
  values.push(now);
  values.push(id);

  db.runSync(`UPDATE cases SET ${fields.join(', ')} WHERE id = ?`, values);
  return getCaseById(id);
}

export function deleteCase(id: string): void {
  // Tasks, documents, evidence will cascade delete due to foreign keys
  db.runSync(`DELETE FROM tasks WHERE caseId = ?`, [id]);
  db.runSync(`DELETE FROM documents WHERE caseId = ?`, [id]);
  db.runSync(`DELETE FROM evidence WHERE caseId = ?`, [id]);
  db.runSync(`DELETE FROM cases WHERE id = ?`, [id]);
}

// ==================== TASK OPERATIONS ====================

export function getTasksByUserId(userId: string): DBTask[] {
  return db.getAllSync<DBTask>(`SELECT * FROM tasks WHERE userId = ? ORDER BY createdAt DESC`, [userId]);
}

export function getTaskById(id: string): DBTask | null {
  const result = db.getFirstSync<DBTask>(`SELECT * FROM tasks WHERE id = ?`, [id]);
  return result ?? null;
}

export function createTask(
  userId: string,
  data: Omit<DBTask, 'id' | 'userId' | 'createdAt' | 'completedAt'>
): DBTask | null {
  const id = generateId();
  const now = new Date().toISOString();

  db.runSync(
    `INSERT INTO tasks (id, userId, caseId, title, description, priority, status, dueDate, createdAt, completedAt, aiGenerated, aiPlanId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
    [id, userId, data.caseId, data.title, data.description, data.priority, data.status, data.dueDate, now, data.aiGenerated ? 1 : 0, data.aiPlanId ?? null]
  );
  return getTaskById(id);
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
    db.runSync(
      `INSERT INTO tasks (id, userId, caseId, title, description, priority, status, dueDate, createdAt, completedAt, aiGenerated, aiPlanId)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, NULL, 1, ?)`,
      [id, userId, caseId, task.title, task.description, task.priority, task.dueDate, now, planId]
    );
    const createdTask = getTaskById(id);
    if (createdTask) {
      createdTasks.push(createdTask);
    }
  }

  return createdTasks;
}

export function updateTask(
  id: string,
  data: Partial<Omit<DBTask, 'id' | 'userId' | 'createdAt'>>
): DBTask | null {
  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (data.caseId !== undefined) { fields.push('caseId = ?'); values.push(data.caseId); }
  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.priority !== undefined) { fields.push('priority = ?'); values.push(data.priority); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
  if (data.dueDate !== undefined) { fields.push('dueDate = ?'); values.push(data.dueDate); }
  if (data.completedAt !== undefined) { fields.push('completedAt = ?'); values.push(data.completedAt); }

  if (fields.length === 0) return getTaskById(id);

  values.push(id);
  db.runSync(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, values);
  return getTaskById(id);
}

export function deleteTask(id: string): void {
  db.runSync(`DELETE FROM tasks WHERE id = ?`, [id]);
}

// ==================== DOCUMENT OPERATIONS ====================

export function getDocumentsByUserId(userId: string): DBDocument[] {
  return db.getAllSync<DBDocument>(`SELECT * FROM documents WHERE userId = ? ORDER BY updatedAt DESC`, [userId]);
}

export function getDocumentById(id: string): DBDocument | null {
  const result = db.getFirstSync<DBDocument>(`SELECT * FROM documents WHERE id = ?`, [id]);
  return result ?? null;
}

export function createDocument(
  userId: string,
  data: Omit<DBDocument, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): DBDocument | null {
  const id = generateId();
  const now = new Date().toISOString();

  db.runSync(
    `INSERT INTO documents (id, userId, caseId, title, category, content, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, data.caseId, data.title, data.category, data.content, now, now]
  );

  // Create initial version
  const versionId = generateId();
  db.runSync(
    `INSERT INTO document_versions (id, documentId, version, content, createdAt)
     VALUES (?, ?, 1, ?, ?)`,
    [versionId, id, data.content, now]
  );

  return getDocumentById(id);
}

export function updateDocument(
  id: string,
  data: Partial<Omit<DBDocument, 'id' | 'userId' | 'createdAt'>>
): DBDocument | null {
  const now = new Date().toISOString();
  const fields: string[] = [];
  const values: (string | null)[] = [];

  // Get old content for version tracking
  const oldDoc = getDocumentById(id);
  const oldContent = oldDoc?.content;

  if (data.caseId !== undefined) { fields.push('caseId = ?'); values.push(data.caseId); }
  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
  if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
  if (data.content !== undefined) { fields.push('content = ?'); values.push(data.content); }

  if (fields.length === 0) return getDocumentById(id);

  fields.push('updatedAt = ?');
  values.push(now);
  values.push(id);

  db.runSync(`UPDATE documents SET ${fields.join(', ')} WHERE id = ?`, values);

  // Create version if content changed
  if (data.content !== undefined && data.content !== oldContent) {
    const existingVersions = db.getAllSync<DBDocumentVersion>(
      `SELECT * FROM document_versions WHERE documentId = ? ORDER BY version DESC`,
      [id]
    );
    const nextVersion = existingVersions.length + 1;
    const versionId = generateId();
    db.runSync(
      `INSERT INTO document_versions (id, documentId, version, content, createdAt)
       VALUES (?, ?, ?, ?, ?)`,
      [versionId, id, nextVersion, data.content, now]
    );
  }

  return getDocumentById(id);
}

export function getDocumentVersions(documentId: string): DBDocumentVersion[] {
  return db.getAllSync<DBDocumentVersion>(
    `SELECT * FROM document_versions WHERE documentId = ? ORDER BY version DESC`,
    [documentId]
  );
}

export function deleteDocument(id: string): void {
  db.runSync(`DELETE FROM document_versions WHERE documentId = ?`, [id]);
  db.runSync(`DELETE FROM documents WHERE id = ?`, [id]);
}

// ==================== EVIDENCE OPERATIONS ====================

export function getEvidenceByUserId(userId: string): DBEvidence[] {
  return db.getAllSync<DBEvidence>(`SELECT * FROM evidence WHERE userId = ? ORDER BY createdAt DESC`, [userId]);
}

export function getEvidenceById(id: string): DBEvidence | null {
  const result = db.getFirstSync<DBEvidence>(`SELECT * FROM evidence WHERE id = ?`, [id]);
  return result ?? null;
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

  db.runSync(
    `INSERT INTO evidence (id, userId, caseId, title, type, uri, notes, tags, linkedTaskIds, linkedDocumentIds, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, data.caseId, data.title, data.type, data.uri, data.notes, JSON.stringify(data.tags), JSON.stringify(data.linkedTaskIds), JSON.stringify(data.linkedDocumentIds), now]
  );
  return getEvidenceById(id);
}

export function updateEvidence(
  id: string,
  data: Partial<Omit<DBEvidence, 'id' | 'userId' | 'createdAt' | 'tags' | 'linkedTaskIds' | 'linkedDocumentIds'> & {
    tags: string[];
    linkedTaskIds: string[];
    linkedDocumentIds: string[];
  }>
): DBEvidence | null {
  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (data.caseId !== undefined) { fields.push('caseId = ?'); values.push(data.caseId); }
  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
  if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
  if (data.uri !== undefined) { fields.push('uri = ?'); values.push(data.uri); }
  if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }
  if (data.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(data.tags)); }
  if (data.linkedTaskIds !== undefined) { fields.push('linkedTaskIds = ?'); values.push(JSON.stringify(data.linkedTaskIds)); }
  if (data.linkedDocumentIds !== undefined) { fields.push('linkedDocumentIds = ?'); values.push(JSON.stringify(data.linkedDocumentIds)); }

  if (fields.length === 0) return getEvidenceById(id);

  values.push(id);
  db.runSync(`UPDATE evidence SET ${fields.join(', ')} WHERE id = ?`, values);
  return getEvidenceById(id);
}

export function deleteEvidence(id: string): void {
  db.runSync(`DELETE FROM evidence WHERE id = ?`, [id]);
}

// ==================== SETTINGS OPERATIONS ====================

export function getSetting(userId: string, key: string): string | null {
  const result = db.getFirstSync<DBSettings>(`SELECT * FROM settings WHERE userId = ? AND key = ?`, [userId, key]);
  return result?.value ?? null;
}

export function setSetting(userId: string, key: string, value: string): void {
  const now = new Date().toISOString();
  const id = generateId();

  db.runSync(
    `INSERT INTO settings (id, userId, key, value, updatedAt)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(userId, key) DO UPDATE SET value = ?, updatedAt = ?`,
    [id, userId, key, value, now, value, now]
  );
}

export function getAllSettings(userId: string): Record<string, string> {
  const results = db.getAllSync<DBSettings>(`SELECT * FROM settings WHERE userId = ?`, [userId]);
  const settings: Record<string, string> = {};
  for (const row of results) {
    settings[row.key] = row.value;
  }
  return settings;
}
