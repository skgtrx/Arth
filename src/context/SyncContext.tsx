import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { SyncState } from '@/types';
import { GoogleAuth } from '@/sync/auth';
import { DriveClient } from '@/sync/drive';
import { SyncManager } from '@/sync/sync-manager';
import { useDatabaseContext } from './DatabaseContext';
import { INITIAL_SYNC_STATE } from '@/hooks/useSync';

interface SyncContextValue {
  syncState: SyncState;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue>({
  syncState: INITIAL_SYNC_STATE,
  signIn: async () => {},
  signOut: async () => {},
  syncNow: async () => {},
});

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function SyncProvider({ children }: { children: ReactNode }) {
  const { replaceDatabase } = useDatabaseContext();
  const [syncState, setSyncState] = useState<SyncState>(INITIAL_SYNC_STATE);

  const authRef = useRef<GoogleAuth | null>(null);
  const driveRef = useRef<DriveClient | null>(null);
  const managerRef = useRef<SyncManager | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    if (!CLIENT_ID) return;

    const auth = new GoogleAuth();
    const drive = new DriveClient();
    const manager = new SyncManager(auth, drive);

    try {
      auth.init(CLIENT_ID);
    } catch {
      return;
    }

    manager.setDatabaseReplacer(replaceDatabase);
    manager.startListening();

    const unsubSync = manager.onStateChange((state) => {
      setSyncState(state);
    });

    authRef.current = auth;
    driveRef.current = drive;
    managerRef.current = manager;
    initializedRef.current = true;

    return () => {
      unsubSync();
      manager.stopListening();
      initializedRef.current = false;
    };
  }, [replaceDatabase]);

  const signIn = useCallback(async () => {
    if (!authRef.current) return;
    await authRef.current.signIn();
    if (managerRef.current) {
      await managerRef.current.sync();
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!authRef.current) return;
    await authRef.current.signOut();
    driveRef.current?.resetCache();
    setSyncState(INITIAL_SYNC_STATE);
  }, []);

  const syncNow = useCallback(async () => {
    if (!authRef.current || !managerRef.current) return;

    if (!authRef.current.isSignedIn()) {
      await authRef.current.signIn();
    }
    await managerRef.current.sync();
  }, []);

  return (
    <SyncContext.Provider value={{ syncState, signIn, signOut, syncNow }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncContext(): SyncContextValue {
  return useContext(SyncContext);
}
