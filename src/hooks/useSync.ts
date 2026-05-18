import type { SyncState } from '@/types';

export interface UseSyncReturn {
  syncState: SyncState;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
  isSignedIn: boolean;
}

export const INITIAL_SYNC_STATE: SyncState = {
  status: 'idle',
  lastSyncedAt: null,
  direction: 'none',
  error: null,
};
