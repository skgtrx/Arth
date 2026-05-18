import type { SyncState } from '@/types';
import { useSyncContext } from '@/context/SyncContext';

export interface UseSyncReturn {
  syncState: SyncState;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
}

export const INITIAL_SYNC_STATE: SyncState = {
  status: 'idle',
  lastSyncedAt: null,
  direction: 'none',
  error: null,
};

export function useSync(): UseSyncReturn {
  return useSyncContext();
}
