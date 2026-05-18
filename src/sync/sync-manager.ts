import type { SyncState, SyncDirection } from '@/types';
import { GoogleAuth } from './auth';
import { DriveClient } from './drive';
import { loadDatabase, saveDatabase } from '@/db/persistence';

const DEBOUNCE_MS = 30_000;

type SyncStateCallback = (state: SyncState) => void;

export class SyncManager {
  private auth: GoogleAuth;
  private drive: DriveClient;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private syncInProgress = false;
  private pendingSync = false;
  private listeners: SyncStateCallback[] = [];
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;
  private replaceDatabase: ((data: Uint8Array) => Promise<void>) | null = null;

  private state: SyncState = {
    status: 'idle',
    lastSyncedAt: null,
    direction: 'none',
    error: null,
  };

  constructor(auth: GoogleAuth, drive: DriveClient) {
    this.auth = auth;
    this.drive = drive;
  }

  setDatabaseReplacer(fn: (data: Uint8Array) => Promise<void>): void {
    this.replaceDatabase = fn;
  }

  startListening(): void {
    this.onlineHandler = () => {
      this.updateState({ status: 'idle', error: null });
      this.sync();
    };
    this.offlineHandler = () => {
      this.cancelDebounce();
      this.updateState({ status: 'offline', error: null });
    };

    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);

    if (!navigator.onLine) {
      this.updateState({ status: 'offline' });
    }
  }

  stopListening(): void {
    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
      this.onlineHandler = null;
    }
    if (this.offlineHandler) {
      window.removeEventListener('offline', this.offlineHandler);
      this.offlineHandler = null;
    }
    this.cancelDebounce();
  }

  async sync(): Promise<void> {
    if (!this.auth.isSignedIn()) return;
    if (!navigator.onLine) {
      this.updateState({ status: 'offline' });
      return;
    }

    if (this.syncInProgress) {
      this.pendingSync = true;
      return;
    }

    this.syncInProgress = true;
    this.updateState({ status: 'syncing', error: null });

    try {
      const token = await this.getValidToken();
      if (!token) return;

      const folderId = await this.drive.ensureFolder(token);
      const remoteFile = await this.drive.findFile(token, folderId);

      const local = await loadDatabase();
      const localModified = local?.lastModified ?? null;

      let direction: SyncDirection = 'none';

      if (!remoteFile && local) {
        direction = 'upload';
        await this.drive.uploadDatabase(token, folderId, local.data, local.lastModified);
      } else if (remoteFile && !local) {
        direction = 'download';
        await this.downloadAndReplace(token, remoteFile.id);
      } else if (remoteFile && local && localModified) {
        const localTime = new Date(localModified).getTime();
        const remoteTime = new Date(remoteFile.modifiedTime).getTime();

        if (remoteTime > localTime) {
          direction = 'download';
          await this.downloadAndReplace(token, remoteFile.id);
        } else if (localTime > remoteTime) {
          direction = 'upload';
          await this.drive.uploadDatabase(token, folderId, local.data, local.lastModified);
        }
      }

      this.updateState({
        status: 'idle',
        lastSyncedAt: new Date().toISOString(),
        direction,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      this.updateState({ status: 'error', error: message });
    } finally {
      this.syncInProgress = false;

      if (this.pendingSync) {
        this.pendingSync = false;
        this.sync();
      }
    }
  }

  scheduleUpload(): void {
    if (!this.auth.isSignedIn()) return;
    if (!navigator.onLine) return;

    this.cancelDebounce();
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.upload();
    }, DEBOUNCE_MS);
  }

  onStateChange(callback: SyncStateCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  getState(): SyncState {
    return { ...this.state };
  }

  private async upload(): Promise<void> {
    if (!this.auth.isSignedIn()) return;
    if (!navigator.onLine) return;

    if (this.syncInProgress) {
      this.pendingSync = true;
      return;
    }

    this.syncInProgress = true;
    this.updateState({ status: 'syncing', direction: 'upload', error: null });

    try {
      const token = await this.getValidToken();
      if (!token) return;

      const folderId = await this.drive.ensureFolder(token);
      const local = await loadDatabase();

      if (!local) return;

      await this.drive.uploadDatabase(token, folderId, local.data, local.lastModified);

      this.updateState({
        status: 'idle',
        lastSyncedAt: new Date().toISOString(),
        direction: 'upload',
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      this.updateState({ status: 'error', error: message });
    } finally {
      this.syncInProgress = false;

      if (this.pendingSync) {
        this.pendingSync = false;
        this.sync();
      }
    }
  }

  private async downloadAndReplace(token: string, fileId: string): Promise<void> {
    const remoteData = await this.drive.downloadDatabase(token, fileId);

    const lastModified = await saveDatabase(remoteData);

    if (this.replaceDatabase) {
      await this.replaceDatabase(remoteData);
    }

    this.updateState({
      lastSyncedAt: lastModified,
      direction: 'download',
    });
  }

  private async getValidToken(): Promise<string | null> {
    let token = this.auth.getAccessToken();

    if (!token) {
      try {
        token = await this.auth.refreshToken();
      } catch {
        this.updateState({ status: 'error', error: 'Authentication failed' });
        return null;
      }
    }

    return token;
  }

  private cancelDebounce(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private updateState(partial: Partial<SyncState>): void {
    this.state = { ...this.state, ...partial };
    for (const listener of this.listeners) {
      listener({ ...this.state });
    }
  }
}
