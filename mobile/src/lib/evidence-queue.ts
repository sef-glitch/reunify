import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface QueuedEvidence {
  id: string;
  caseId: string;
  title: string;
  type: 'photo' | 'document' | 'audio' | 'video' | 'other';
  uri: string;
  notes: string;
  tags: string[];
  linkedTaskIds: string[];
  linkedDocumentIds: string[];
  queuedAt: string;
  retryCount: number;
  status: 'pending' | 'uploading' | 'failed';
  error?: string;
}

interface EvidenceQueueState {
  queue: QueuedEvidence[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;

  // Actions
  addToQueue: (evidence: Omit<QueuedEvidence, 'id' | 'queuedAt' | 'retryCount' | 'status'>) => string;
  removeFromQueue: (id: string) => void;
  updateQueueItem: (id: string, updates: Partial<QueuedEvidence>) => void;
  markAsFailed: (id: string, error: string) => void;
  markAsUploading: (id: string) => void;
  clearQueue: () => void;
  setOnlineStatus: (isOnline: boolean) => void;
  setSyncing: (isSyncing: boolean) => void;
  setLastSyncAt: (timestamp: string) => void;
  getPendingCount: () => number;
  getFailedCount: () => number;
}

function generateId(): string {
  return `queue_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const useEvidenceQueue = create<EvidenceQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      isOnline: true,
      isSyncing: false,
      lastSyncAt: null,

      addToQueue: (evidence) => {
        const id = generateId();
        const newItem: QueuedEvidence = {
          ...evidence,
          id,
          queuedAt: new Date().toISOString(),
          retryCount: 0,
          status: 'pending',
        };

        set((state) => ({
          queue: [...state.queue, newItem],
        }));

        return id;
      },

      removeFromQueue: (id) => {
        set((state) => ({
          queue: state.queue.filter((item) => item.id !== id),
        }));
      },

      updateQueueItem: (id, updates) => {
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },

      markAsFailed: (id, error) => {
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === id
              ? { ...item, status: 'failed' as const, error, retryCount: item.retryCount + 1 }
              : item
          ),
        }));
      },

      markAsUploading: (id) => {
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === id ? { ...item, status: 'uploading' as const } : item
          ),
        }));
      },

      clearQueue: () => {
        set({ queue: [] });
      },

      setOnlineStatus: (isOnline) => {
        set({ isOnline });
      },

      setSyncing: (isSyncing) => {
        set({ isSyncing });
      },

      setLastSyncAt: (timestamp) => {
        set({ lastSyncAt: timestamp });
      },

      getPendingCount: () => {
        return get().queue.filter((item) => item.status === 'pending').length;
      },

      getFailedCount: () => {
        return get().queue.filter((item) => item.status === 'failed').length;
      },
    }),
    {
      name: 'reunify-evidence-queue',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        queue: state.queue,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);

// Network status listener
let unsubscribeNetInfo: (() => void) | null = null;

export function initNetworkListener() {
  if (unsubscribeNetInfo) return;

  unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
    useEvidenceQueue.getState().setOnlineStatus(state.isConnected ?? false);
  });
}

export function cleanupNetworkListener() {
  if (unsubscribeNetInfo) {
    unsubscribeNetInfo();
    unsubscribeNetInfo = null;
  }
}
