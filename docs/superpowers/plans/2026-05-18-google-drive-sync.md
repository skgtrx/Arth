# Stage 4: Google Drive Sync — Implementation Plan

**Date:** 2026-05-18
**Design doc:** `docs/superpowers/specs/2026-05-18-google-drive-sync-design.md`

---

## Task 1: Google Cloud Project Setup (Manual)

This is a manual step — no code changes. The user configures their Google Cloud project.

### Steps

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → Create project "Arth"
2. Enable the **Google Drive API** (APIs & Services → Library → search "Google Drive API" → Enable)
3. Configure **OAuth consent screen** (APIs & Services → OAuth consent screen):
   - User type: **External**
   - App name: "Arth"
   - User support email: your email
   - Scopes: click "Add or Remove Scopes" → manually add `https://www.googleapis.com/auth/drive.file`
   - Test users: add your Google account email
   - Publishing status: leave as **Testing**
4. Create **OAuth Client ID** (APIs & Services → Credentials → Create Credentials → OAuth Client ID):
   - Application type: **Web application**
   - Name: "Arth Web"
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:5173`
5. Copy the **Client ID** (looks like `123456789-abc.apps.googleusercontent.com`)
6. Create `.env.local` in the project root:

```bash
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

7. Add `.env.local` to `.gitignore` (if not already there).

### Verification

- The Client ID is accessible in code via `import.meta.env.VITE_GOOGLE_CLIENT_ID`
- `.env.local` is NOT committed to git

---

## Task 2: Add GIS Script Tag to `index.html`

Load the Google Identity Services library so `window.google.accounts.oauth2` is available at runtime.

**Modify file:** `index.html`

Add the following `<script>` tag inside `<head>`, before the Vite entry point:

```html
<script src="https://accounts.google.com/gsi/client" async></script>
```

The full `<head>` section after this change:

```html
<head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/arth/icons/icon-192x192.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0f172a" />
    <link rel="manifest" href="/arth/manifest.json" />
    <link rel="apple-touch-icon" href="/arth/icons/icon-192x192.png" />
    <title>Arth</title>
    <script src="https://accounts.google.com/gsi/client" async></script>
  </head>
```

### Why `async`

The `async` attribute loads the GIS script in parallel with the page render. The app doesn't need GIS immediately — it loads the local DB from IndexedDB first (Stage 3). By the time the user might want to sign in, the script is loaded.

---

## Task 3: Create TypeScript Declarations for GIS (`src/types/google.d.ts`)

Since GIS is loaded via `<script>` tag, TypeScript doesn't know about `window.google.accounts.oauth2`. This declaration file provides type safety.

**Create file:** `src/types/google.d.ts`

```typescript
interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
}

interface TokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: TokenResponse) => void;
  error_callback?: (error: { type: string; message: string }) => void;
  prompt?: '' | 'none' | 'consent' | 'select_account';
}

interface TokenClient {
  requestAccessToken(overrideConfig?: { prompt?: string }): void;
}

interface RevokeResponse {
  successful: boolean;
  error?: string;
}

interface Google {
  accounts: {
    oauth2: {
      initTokenClient(config: TokenClientConfig): TokenClient;
      revoke(accessToken: string, callback?: (response: RevokeResponse) => void): void;
      hasGrantedAllScopes(tokenResponse: TokenResponse, ...scopes: string[]): boolean;
    };
  };
}

declare const google: Google;
```

### Key details

- These types cover only the GIS Token Model API surface we use — not the full GIS library
- `TokenResponse` includes both success fields (`access_token`, `expires_in`) and error fields (`error`, `error_description`)
- `TokenClientConfig.prompt` controls the consent UI behavior: empty string means auto-select, `'consent'` forces re-consent
- The `declare const google: Google` makes `google.accounts.oauth2.initTokenClient(...)` available globally without importing anything

---

## Task 4: Add Sync Types to `src/types/index.ts`

Add sync-related types that will be used by the sync modules and eventually by the UI layer.

**Modify file:** `src/types/index.ts` — append the following at the end:

```typescript
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export type SyncDirection = 'upload' | 'download' | 'none';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  direction: SyncDirection;
  error: string | null;
}
```

---

## Task 5: Implement `src/sync/auth.ts` — Google OAuth Flow

This module wraps the GIS Token Model. It manages the token client, current access token, and sign-in state.

**Replace file:** `src/sync/auth.ts`

```typescript
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

type AuthChangeCallback = (isSignedIn: boolean) => void;

export class GoogleAuth {
  private tokenClient: TokenClient | null = null;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private listeners: AuthChangeCallback[] = [];
  private initPromiseResolve: ((value: string) => void) | null = null;
  private initPromiseReject: ((reason: Error) => void) | null = null;

  init(clientId: string): void {
    if (typeof google === 'undefined') {
      throw new Error('Google Identity Services script not loaded');
    }

    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) {
          this.accessToken = null;
          this.tokenExpiresAt = 0;
          this.notifyListeners(false);
          if (this.initPromiseReject) {
            this.initPromiseReject(new Error(response.error_description || response.error));
            this.initPromiseReject = null;
            this.initPromiseResolve = null;
          }
          return;
        }

        this.accessToken = response.access_token;
        this.tokenExpiresAt = Date.now() + response.expires_in * 1000;
        this.notifyListeners(true);

        if (this.initPromiseResolve) {
          this.initPromiseResolve(response.access_token);
          this.initPromiseResolve = null;
          this.initPromiseReject = null;
        }
      },
    });
  }

  signIn(): Promise<string> {
    if (!this.tokenClient) {
      return Promise.reject(new Error('GoogleAuth not initialized. Call init() first.'));
    }

    return new Promise<string>((resolve, reject) => {
      this.initPromiseResolve = resolve;
      this.initPromiseReject = reject;
      this.tokenClient!.requestAccessToken();
    });
  }

  signOut(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.accessToken) {
        google.accounts.oauth2.revoke(this.accessToken, () => {
          this.accessToken = null;
          this.tokenExpiresAt = 0;
          this.notifyListeners(false);
          resolve();
        });
      } else {
        this.accessToken = null;
        this.tokenExpiresAt = 0;
        this.notifyListeners(false);
        resolve();
      }
    });
  }

  getAccessToken(): string | null {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }
    return null;
  }

  isSignedIn(): boolean {
    return this.getAccessToken() !== null;
  }

  async refreshToken(): Promise<string> {
    return this.signIn();
  }

  onAuthChange(callback: AuthChangeCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners(isSignedIn: boolean): void {
    for (const listener of this.listeners) {
      listener(isSignedIn);
    }
  }
}
```

### Key details

- **`init(clientId)`** — initializes the GIS token client. Must be called once at app startup. Throws if the GIS script hasn't loaded.
- **`signIn()`** — returns a Promise that resolves with the access token when the user completes the consent flow. The promise pattern wraps GIS's callback-based API.
- **`signOut()`** — revokes the token via GIS and clears local state.
- **`getAccessToken()`** — returns the current token if it hasn't expired, or `null`. Callers check this before making Drive API calls.
- **`isSignedIn()`** — convenience boolean check.
- **`refreshToken()`** — re-triggers the sign-in flow. Used by SyncManager when a Drive API call gets a 401. GIS auto-approves without user interaction if the user previously consented.
- **`onAuthChange(callback)`** — returns an unsubscribe function. Used by the React layer (Stage 5) to react to auth state changes.
- **Token expiry tracking** — `tokenExpiresAt` is computed from `Date.now() + expires_in * 1000`. `getAccessToken()` returns `null` if the token is expired, prompting callers to refresh.

---

## Task 6: Implement `src/sync/drive.ts` — Drive File Operations

This module wraps the Google Drive REST API v3 using plain `fetch()`. All methods take an `accessToken` parameter — they don't import `GoogleAuth`.

**Replace file:** `src/sync/drive.ts`

```typescript
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const FOLDER_NAME = 'Arth';
const FILE_NAME = 'finance.db';
const BOUNDARY = '----ArthSyncBoundary';

export interface DriveFileMetadata {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
}

export class DriveClient {
  private folderId: string | null = null;
  private fileId: string | null = null;

  async ensureFolder(accessToken: string): Promise<string> {
    if (this.folderId) return this.folderId;

    const query = `name='${FOLDER_NAME}' and mimeType='${FOLDER_MIME}' and trashed=false`;
    const searchUrl = `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id,name)&spaces=drive`;

    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!searchRes.ok) {
      throw new DriveError('Failed to search for folder', searchRes.status);
    }

    const searchData = await searchRes.json();

    if (searchData.files && searchData.files.length > 0) {
      this.folderId = searchData.files[0].id;
      return this.folderId!;
    }

    const createRes = await fetch(`${DRIVE_API}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: FOLDER_MIME,
      }),
    });

    if (!createRes.ok) {
      throw new DriveError('Failed to create folder', createRes.status);
    }

    const createData = await createRes.json();
    this.folderId = createData.id;
    return this.folderId!;
  }

  async findFile(accessToken: string, folderId: string): Promise<DriveFileMetadata | null> {
    const query = `name='${FILE_NAME}' and '${folderId}' in parents and trashed=false`;
    const url = `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime,size)&spaces=drive`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new DriveError('Failed to search for file', res.status);
    }

    const data = await res.json();

    if (data.files && data.files.length > 0) {
      const file = data.files[0];
      this.fileId = file.id;
      return file as DriveFileMetadata;
    }

    return null;
  }

  async uploadDatabase(
    accessToken: string,
    folderId: string,
    data: Uint8Array,
    localModifiedTime: string,
  ): Promise<DriveFileMetadata> {
    const existingFile = this.fileId ? { id: this.fileId } : await this.findFile(accessToken, folderId);

    if (existingFile) {
      return this.updateFile(accessToken, existingFile.id, data, localModifiedTime);
    }

    return this.createFile(accessToken, folderId, data, localModifiedTime);
  }

  async downloadDatabase(accessToken: string, fileId: string): Promise<Uint8Array> {
    const url = `${DRIVE_API}/files/${fileId}?alt=media`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new DriveError('Failed to download file', res.status);
    }

    const buffer = await res.arrayBuffer();
    return new Uint8Array(buffer);
  }

  async getFileMetadata(accessToken: string, fileId: string): Promise<DriveFileMetadata> {
    const url = `${DRIVE_API}/files/${fileId}?fields=id,name,modifiedTime,size`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new DriveError('Failed to get file metadata', res.status);
    }

    return (await res.json()) as DriveFileMetadata;
  }

  resetCache(): void {
    this.folderId = null;
    this.fileId = null;
  }

  private async createFile(
    accessToken: string,
    folderId: string,
    data: Uint8Array,
    localModifiedTime: string,
  ): Promise<DriveFileMetadata> {
    const metadata = JSON.stringify({
      name: FILE_NAME,
      parents: [folderId],
      modifiedTime: localModifiedTime,
    });

    const body = buildMultipartBody(metadata, data);

    const res = await fetch(
      `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,name,modifiedTime,size`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${BOUNDARY}`,
        },
        body,
      },
    );

    if (!res.ok) {
      throw new DriveError('Failed to create file', res.status);
    }

    const result = (await res.json()) as DriveFileMetadata;
    this.fileId = result.id;
    return result;
  }

  private async updateFile(
    accessToken: string,
    fileId: string,
    data: Uint8Array,
    localModifiedTime: string,
  ): Promise<DriveFileMetadata> {
    const metadata = JSON.stringify({
      modifiedTime: localModifiedTime,
    });

    const body = buildMultipartBody(metadata, data);

    const res = await fetch(
      `${DRIVE_UPLOAD_API}/files/${fileId}?uploadType=multipart&fields=id,name,modifiedTime,size`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${BOUNDARY}`,
        },
        body,
      },
    );

    if (!res.ok) {
      throw new DriveError('Failed to update file', res.status);
    }

    return (await res.json()) as DriveFileMetadata;
  }
}

function buildMultipartBody(metadataJson: string, fileData: Uint8Array): Blob {
  const metadataPart = `--${BOUNDARY}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadataJson}\r\n`;
  const closingBoundary = `\r\n--${BOUNDARY}--`;
  const binaryHeader = `--${BOUNDARY}\r\nContent-Type: application/x-sqlite3\r\n\r\n`;

  return new Blob([metadataPart, binaryHeader, fileData, closingBoundary]);
}

export class DriveError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(`${message} (HTTP ${status})`);
    this.name = 'DriveError';
  }
}
```

### Key details

- **`ensureFolder()`** — searches for the `Arth/` folder first. If found, caches the ID and returns it. If not found, creates it. The cached `folderId` avoids redundant searches on subsequent calls.
- **`findFile()`** — searches for `finance.db` inside the folder. Caches the file ID.
- **`uploadDatabase()`** — smart create-or-update: checks if the file exists (using cached ID or search), then calls `createFile()` or `updateFile()`.
- **`downloadDatabase()`** — uses `alt=media` to get raw file bytes. Returns `Uint8Array` matching the format `persistence.ts` expects.
- **`getFileMetadata()`** — lightweight metadata-only call. Used by SyncManager to check `modifiedTime` without downloading the file.
- **`buildMultipartBody()`** — constructs a `multipart/related` body for the Drive upload API. Uses `Blob` to combine string parts and binary data without manual ArrayBuffer manipulation.
- **`DriveError`** — custom error with HTTP status code, allowing callers (SyncManager) to distinguish 401 (re-auth) from 404 (re-create) from network errors.
- **`resetCache()`** — clears cached folder/file IDs. Called on sign-out so a different account starts fresh.

---

## Task 7: Implement `src/sync/sync-manager.ts` — Sync Orchestration

This is the central coordinator. It ties auth, drive, and persistence together with debouncing, conflict resolution, and online/offline handling.

**Replace file:** `src/sync/sync-manager.ts`

```typescript
import type { SyncState, SyncDirection } from '@/types';
import { GoogleAuth } from './auth';
import { DriveClient, DriveError } from './drive';
import { loadDatabase, saveDatabase } from '@/db/persistence';

const DEBOUNCE_MS = 30_000;

type SyncStateCallback = (state: SyncState) => void;

export class SyncManager {
  private auth: GoogleAuth;
  private drive: DriveClient;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private syncInProgress = false;
  private pendingSync = false;
  private folderId: string | null = null;
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

      this.folderId = await this.drive.ensureFolder(token);
      const remoteFile = await this.drive.findFile(token, this.folderId);

      const local = await loadDatabase();
      const localModified = local?.lastModified ?? null;

      let direction: SyncDirection = 'none';

      if (!remoteFile && local) {
        direction = 'upload';
        await this.drive.uploadDatabase(token, this.folderId, local.data, local.lastModified);
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
          await this.drive.uploadDatabase(token, this.folderId, local.data, local.lastModified);
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

      this.folderId = await this.drive.ensureFolder(token);
      const local = await loadDatabase();

      if (!local) return;

      await this.drive.uploadDatabase(token, this.folderId, local.data, local.lastModified);

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
```

### Key details

- **`sync()`** — the main sync operation, called on app load and on reconnect. Compares local vs remote timestamps, then uploads or downloads as needed. Uses the `syncInProgress` flag to prevent concurrent syncs. If a sync is requested while one is running, `pendingSync` is set so it runs after the current one finishes.
- **`scheduleUpload()`** — the debounced upload, called after each `persistDatabase()`. Resets the 30-second timer on each call. When the timer fires, calls the private `upload()` method.
- **`setDatabaseReplacer(fn)`** — accepts a callback that SyncManager calls when it downloads a newer database from Drive. This callback is responsible for reinitializing sql.js with the new data and updating React state. It's set by the DatabaseContext (Stage 5) to avoid a circular dependency between sync and database modules.
- **`startListening()` / `stopListening()`** — manages `online`/`offline` event listeners. Called from the React lifecycle.
- **`onStateChange(callback)`** — returns an unsubscribe function. Used by the React layer to display sync status.
- **`getState()`** — returns a copy of the current state (defensive copy prevents external mutation).
- **`getValidToken()`** — gets the current token or refreshes it. Handles the 401 → re-auth flow. Returns `null` if re-auth fails (user dismissed the popup).
- **`downloadAndReplace()`** — downloads from Drive, saves to IndexedDB, and calls the database replacer callback to update the in-memory sql.js instance.

### How SyncManager connects to the rest of the app

```
DatabaseContext.persistDatabase()
  → saveDatabase(data)              // IndexedDB (instant)
  → syncManager.scheduleUpload()    // Google Drive (30s debounce)
```

The full wiring happens in Stage 5 (UI Shell) when we create the `useSync` hook and integrate it with `DatabaseContext`. For now, the SyncManager is a standalone class that can be instantiated and tested independently.

---

## Task 8: Implement `src/hooks/useSync.ts` — React Hook (Stub with Types)

This hook will be fully implemented in Stage 5 when the UI exists. For now, we export the interface so the types are available, and provide a minimal stub.

**Replace file:** `src/hooks/useSync.ts`

```typescript
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
```

### Why a stub

The full `useSync` hook needs to:
1. Create `GoogleAuth` and `DriveClient` instances
2. Create a `SyncManager` instance
3. Wire up `setDatabaseReplacer` with access to the `DatabaseContext`
4. Manage React state for `SyncState`

All of this requires the UI context that Stage 5 provides. The stub exports the types and initial state so other modules can reference them.

---

## Task 9: Update `.env.local` in `.gitignore`

Ensure the environment file with the Client ID is never committed.

**Modify file:** `.gitignore` — add the following line if not already present:

```
.env.local
```

Check the existing `.gitignore` first — Vite's default `.gitignore` usually includes `.env.local` already.

---

## Task 10: Create `src/sync/__tests__/auth.test.ts` — Auth Tests

**Create file:** `src/sync/__tests__/auth.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoogleAuth } from '../auth';

let mockRequestAccessToken: ReturnType<typeof vi.fn>;
let mockRevoke: ReturnType<typeof vi.fn>;
let capturedCallback: (response: TokenResponse) => void;

beforeEach(() => {
  mockRequestAccessToken = vi.fn();
  mockRevoke = vi.fn((_token: string, callback?: (response: RevokeResponse) => void) => {
    if (callback) callback({ successful: true });
  });

  (globalThis as Record<string, unknown>).google = {
    accounts: {
      oauth2: {
        initTokenClient: (config: TokenClientConfig) => {
          capturedCallback = config.callback;
          return { requestAccessToken: mockRequestAccessToken };
        },
        revoke: mockRevoke,
        hasGrantedAllScopes: () => true,
      },
    },
  };
});

describe('GoogleAuth', () => {
  describe('init', () => {
    it('initializes the token client', () => {
      const auth = new GoogleAuth();
      auth.init('test-client-id');
      expect(auth.isSignedIn()).toBe(false);
      expect(auth.getAccessToken()).toBeNull();
    });

    it('throws if GIS script is not loaded', () => {
      delete (globalThis as Record<string, unknown>).google;
      const auth = new GoogleAuth();
      expect(() => auth.init('test-client-id')).toThrow('Google Identity Services script not loaded');
    });
  });

  describe('signIn', () => {
    it('requests an access token and resolves with it', async () => {
      const auth = new GoogleAuth();
      auth.init('test-client-id');

      mockRequestAccessToken.mockImplementation(() => {
        capturedCallback({
          access_token: 'mock-token-123',
          expires_in: 3600,
          scope: 'https://www.googleapis.com/auth/drive.file',
          token_type: 'Bearer',
        });
      });

      const token = await auth.signIn();
      expect(token).toBe('mock-token-123');
      expect(auth.isSignedIn()).toBe(true);
      expect(auth.getAccessToken()).toBe('mock-token-123');
    });

    it('rejects when the response has an error', async () => {
      const auth = new GoogleAuth();
      auth.init('test-client-id');

      mockRequestAccessToken.mockImplementation(() => {
        capturedCallback({
          access_token: '',
          expires_in: 0,
          scope: '',
          token_type: '',
          error: 'access_denied',
          error_description: 'User denied access',
        });
      });

      await expect(auth.signIn()).rejects.toThrow('User denied access');
      expect(auth.isSignedIn()).toBe(false);
    });

    it('rejects if not initialized', async () => {
      const auth = new GoogleAuth();
      await expect(auth.signIn()).rejects.toThrow('GoogleAuth not initialized');
    });
  });

  describe('signOut', () => {
    it('revokes the token and clears state', async () => {
      const auth = new GoogleAuth();
      auth.init('test-client-id');

      mockRequestAccessToken.mockImplementation(() => {
        capturedCallback({
          access_token: 'mock-token-123',
          expires_in: 3600,
          scope: '',
          token_type: 'Bearer',
        });
      });

      await auth.signIn();
      expect(auth.isSignedIn()).toBe(true);

      await auth.signOut();
      expect(auth.isSignedIn()).toBe(false);
      expect(auth.getAccessToken()).toBeNull();
      expect(mockRevoke).toHaveBeenCalledWith('mock-token-123', expect.any(Function));
    });

    it('resolves even if no token exists', async () => {
      const auth = new GoogleAuth();
      auth.init('test-client-id');
      await auth.signOut();
      expect(auth.isSignedIn()).toBe(false);
    });
  });

  describe('getAccessToken', () => {
    it('returns null when token is expired', async () => {
      const auth = new GoogleAuth();
      auth.init('test-client-id');

      mockRequestAccessToken.mockImplementation(() => {
        capturedCallback({
          access_token: 'mock-token-123',
          expires_in: 0,
          scope: '',
          token_type: 'Bearer',
        });
      });

      await auth.signIn();
      expect(auth.getAccessToken()).toBeNull();
    });
  });

  describe('onAuthChange', () => {
    it('notifies listeners on sign-in', async () => {
      const auth = new GoogleAuth();
      auth.init('test-client-id');

      const listener = vi.fn();
      auth.onAuthChange(listener);

      mockRequestAccessToken.mockImplementation(() => {
        capturedCallback({
          access_token: 'mock-token-123',
          expires_in: 3600,
          scope: '',
          token_type: 'Bearer',
        });
      });

      await auth.signIn();
      expect(listener).toHaveBeenCalledWith(true);
    });

    it('notifies listeners on sign-out', async () => {
      const auth = new GoogleAuth();
      auth.init('test-client-id');

      mockRequestAccessToken.mockImplementation(() => {
        capturedCallback({
          access_token: 'mock-token-123',
          expires_in: 3600,
          scope: '',
          token_type: 'Bearer',
        });
      });

      await auth.signIn();

      const listener = vi.fn();
      auth.onAuthChange(listener);

      await auth.signOut();
      expect(listener).toHaveBeenCalledWith(false);
    });

    it('returns an unsubscribe function', async () => {
      const auth = new GoogleAuth();
      auth.init('test-client-id');

      const listener = vi.fn();
      const unsubscribe = auth.onAuthChange(listener);
      unsubscribe();

      mockRequestAccessToken.mockImplementation(() => {
        capturedCallback({
          access_token: 'mock-token-123',
          expires_in: 3600,
          scope: '',
          token_type: 'Bearer',
        });
      });

      await auth.signIn();
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
```

### Test count: 10 tests

---

## Task 11: Create `src/sync/__tests__/drive.test.ts` — Drive Tests

**Create file:** `src/sync/__tests__/drive.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DriveClient, DriveError } from '../drive';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  } as Response;
}

function binaryResponse(data: Uint8Array, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve({}),
    arrayBuffer: () => Promise.resolve(data.buffer),
  } as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('DriveClient', () => {
  describe('ensureFolder', () => {
    it('returns existing folder ID when found', async () => {
      const client = new DriveClient();
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ files: [{ id: 'folder-123', name: 'Arth' }] }),
      );

      const id = await client.ensureFolder('token-abc');
      expect(id).toBe('folder-123');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toContain('name=%27Arth%27');
    });

    it('creates folder when not found', async () => {
      const client = new DriveClient();
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ files: [] }))
        .mockResolvedValueOnce(jsonResponse({ id: 'new-folder-456' }));

      const id = await client.ensureFolder('token-abc');
      expect(id).toBe('new-folder-456');
      expect(mockFetch).toHaveBeenCalledTimes(2);

      const createCall = mockFetch.mock.calls[1];
      expect(createCall[1].method).toBe('POST');
      expect(JSON.parse(createCall[1].body)).toEqual({
        name: 'Arth',
        mimeType: 'application/vnd.google-apps.folder',
      });
    });

    it('caches folder ID on subsequent calls', async () => {
      const client = new DriveClient();
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ files: [{ id: 'folder-123', name: 'Arth' }] }),
      );

      await client.ensureFolder('token-abc');
      const id2 = await client.ensureFolder('token-abc');
      expect(id2).toBe('folder-123');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('throws DriveError on API failure', async () => {
      const client = new DriveClient();
      mockFetch.mockResolvedValueOnce(jsonResponse({}, 401));

      await expect(client.ensureFolder('bad-token')).rejects.toThrow(DriveError);
      await expect(client.ensureFolder('bad-token')).rejects.toThrow('401');
    });
  });

  describe('findFile', () => {
    it('returns file metadata when found', async () => {
      const client = new DriveClient();
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          files: [{ id: 'file-789', name: 'finance.db', modifiedTime: '2026-05-18T10:00:00Z', size: '1024' }],
        }),
      );

      const file = await client.findFile('token-abc', 'folder-123');
      expect(file).toEqual({
        id: 'file-789',
        name: 'finance.db',
        modifiedTime: '2026-05-18T10:00:00Z',
        size: '1024',
      });
    });

    it('returns null when file not found', async () => {
      const client = new DriveClient();
      mockFetch.mockResolvedValueOnce(jsonResponse({ files: [] }));

      const file = await client.findFile('token-abc', 'folder-123');
      expect(file).toBeNull();
    });
  });

  describe('uploadDatabase', () => {
    it('creates a new file when none exists', async () => {
      const client = new DriveClient();
      const data = new Uint8Array([1, 2, 3]);

      mockFetch
        .mockResolvedValueOnce(jsonResponse({ files: [] }))
        .mockResolvedValueOnce(
          jsonResponse({ id: 'new-file-1', name: 'finance.db', modifiedTime: '2026-05-18T10:00:00Z' }),
        );

      const result = await client.uploadDatabase('token-abc', 'folder-123', data, '2026-05-18T10:00:00Z');
      expect(result.id).toBe('new-file-1');

      const uploadCall = mockFetch.mock.calls[1];
      expect(uploadCall[0]).toContain('uploadType=multipart');
      expect(uploadCall[1].method).toBe('POST');
    });

    it('updates existing file when found', async () => {
      const client = new DriveClient();
      const data = new Uint8Array([1, 2, 3]);

      mockFetch
        .mockResolvedValueOnce(
          jsonResponse({
            files: [{ id: 'existing-file', name: 'finance.db', modifiedTime: '2026-05-17T10:00:00Z' }],
          }),
        )
        .mockResolvedValueOnce(
          jsonResponse({ id: 'existing-file', name: 'finance.db', modifiedTime: '2026-05-18T10:00:00Z' }),
        );

      const result = await client.uploadDatabase('token-abc', 'folder-123', data, '2026-05-18T10:00:00Z');
      expect(result.id).toBe('existing-file');

      const uploadCall = mockFetch.mock.calls[1];
      expect(uploadCall[0]).toContain('existing-file');
      expect(uploadCall[1].method).toBe('PATCH');
    });
  });

  describe('downloadDatabase', () => {
    it('returns file data as Uint8Array', async () => {
      const client = new DriveClient();
      const expected = new Uint8Array([10, 20, 30]);
      mockFetch.mockResolvedValueOnce(binaryResponse(expected));

      const data = await client.downloadDatabase('token-abc', 'file-789');
      expect(data).toEqual(expected);
    });

    it('throws on download failure', async () => {
      const client = new DriveClient();
      mockFetch.mockResolvedValueOnce(binaryResponse(new Uint8Array(), 404));

      await expect(client.downloadDatabase('token-abc', 'file-789')).rejects.toThrow(DriveError);
    });
  });

  describe('getFileMetadata', () => {
    it('returns metadata for a file', async () => {
      const client = new DriveClient();
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ id: 'file-789', name: 'finance.db', modifiedTime: '2026-05-18T12:00:00Z', size: '2048' }),
      );

      const meta = await client.getFileMetadata('token-abc', 'file-789');
      expect(meta.modifiedTime).toBe('2026-05-18T12:00:00Z');
      expect(meta.size).toBe('2048');
    });
  });

  describe('resetCache', () => {
    it('clears cached folder and file IDs', async () => {
      const client = new DriveClient();
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ files: [{ id: 'folder-123', name: 'Arth' }] }),
      );

      await client.ensureFolder('token-abc');

      client.resetCache();

      mockFetch.mockResolvedValueOnce(
        jsonResponse({ files: [{ id: 'folder-456', name: 'Arth' }] }),
      );

      const id = await client.ensureFolder('token-abc');
      expect(id).toBe('folder-456');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
```

### Test count: 12 tests

---

## Task 12: Create `src/sync/__tests__/sync-manager.test.ts` — SyncManager Tests

**Create file:** `src/sync/__tests__/sync-manager.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { SyncManager } from '../sync-manager';
import { GoogleAuth } from '../auth';
import { DriveClient } from '../drive';
import { saveDatabase } from '@/db/persistence';

vi.mock('../auth');
vi.mock('../drive');

let auth: GoogleAuth;
let drive: DriveClient;
let manager: SyncManager;

beforeEach(() => {
  vi.useFakeTimers();
  indexedDB = new IDBFactory();

  auth = new GoogleAuth();
  drive = new DriveClient();

  (auth.isSignedIn as unknown as MockInstance).mockReturnValue(true);
  (auth.getAccessToken as unknown as MockInstance).mockReturnValue('mock-token');
  (auth.refreshToken as unknown as MockInstance).mockResolvedValue('mock-token');

  (drive.ensureFolder as unknown as MockInstance).mockResolvedValue('folder-123');
  (drive.findFile as unknown as MockInstance).mockResolvedValue(null);
  (drive.uploadDatabase as unknown as MockInstance).mockResolvedValue({
    id: 'file-1',
    name: 'finance.db',
    modifiedTime: '2026-05-18T10:00:00Z',
  });
  (drive.downloadDatabase as unknown as MockInstance).mockResolvedValue(new Uint8Array([1, 2, 3]));

  Object.defineProperty(globalThis, 'navigator', {
    value: { onLine: true },
    writable: true,
    configurable: true,
  });

  manager = new SyncManager(auth, drive);
});

describe('SyncManager', () => {
  describe('sync — conflict resolution', () => {
    it('uploads when local is newer than remote', async () => {
      await saveDatabase(new Uint8Array([10, 20, 30]));

      (drive.findFile as unknown as MockInstance).mockResolvedValue({
        id: 'file-1',
        name: 'finance.db',
        modifiedTime: '2020-01-01T00:00:00Z',
      });

      await manager.sync();

      expect(drive.uploadDatabase).toHaveBeenCalled();
      expect(drive.downloadDatabase).not.toHaveBeenCalled();
      expect(manager.getState().direction).toBe('upload');
    });

    it('downloads when remote is newer than local', async () => {
      await saveDatabase(new Uint8Array([10, 20, 30]));

      const replacer = vi.fn();
      manager.setDatabaseReplacer(replacer);

      (drive.findFile as unknown as MockInstance).mockResolvedValue({
        id: 'file-1',
        name: 'finance.db',
        modifiedTime: '2099-01-01T00:00:00Z',
      });

      await manager.sync();

      expect(drive.downloadDatabase).toHaveBeenCalled();
      expect(replacer).toHaveBeenCalledWith(new Uint8Array([1, 2, 3]));
      expect(manager.getState().direction).toBe('download');
    });

    it('does nothing when timestamps are equal', async () => {
      const ts = '2026-05-18T10:00:00.000Z';

      vi.useRealTimers();
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(ts);
      await saveDatabase(new Uint8Array([10, 20, 30]));
      vi.restoreAllMocks();
      vi.useFakeTimers();

      (drive.findFile as unknown as MockInstance).mockResolvedValue({
        id: 'file-1',
        name: 'finance.db',
        modifiedTime: ts,
      });

      await manager.sync();

      expect(drive.uploadDatabase).not.toHaveBeenCalled();
      expect(drive.downloadDatabase).not.toHaveBeenCalled();
      expect(manager.getState().direction).toBe('none');
    });

    it('uploads when remote file does not exist', async () => {
      await saveDatabase(new Uint8Array([10, 20, 30]));
      (drive.findFile as unknown as MockInstance).mockResolvedValue(null);

      await manager.sync();

      expect(drive.uploadDatabase).toHaveBeenCalled();
      expect(manager.getState().direction).toBe('upload');
    });
  });

  describe('scheduleUpload — debounce', () => {
    it('uploads after 30 seconds', async () => {
      await saveDatabase(new Uint8Array([1, 2, 3]));

      manager.scheduleUpload();

      expect(drive.uploadDatabase).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(30_000);

      expect(drive.uploadDatabase).toHaveBeenCalledTimes(1);
    });

    it('resets timer on subsequent calls', async () => {
      await saveDatabase(new Uint8Array([1, 2, 3]));

      manager.scheduleUpload();
      await vi.advanceTimersByTimeAsync(20_000);

      manager.scheduleUpload();
      await vi.advanceTimersByTimeAsync(20_000);

      expect(drive.uploadDatabase).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(10_000);

      expect(drive.uploadDatabase).toHaveBeenCalledTimes(1);
    });

    it('does not schedule if not signed in', () => {
      (auth.isSignedIn as unknown as MockInstance).mockReturnValue(false);

      manager.scheduleUpload();

      vi.advanceTimersByTime(30_000);
      expect(drive.uploadDatabase).not.toHaveBeenCalled();
    });

    it('does not schedule if offline', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { onLine: false },
        writable: true,
        configurable: true,
      });

      manager.scheduleUpload();

      vi.advanceTimersByTime(30_000);
      expect(drive.uploadDatabase).not.toHaveBeenCalled();
    });
  });

  describe('sync — not signed in', () => {
    it('skips sync when not signed in', async () => {
      (auth.isSignedIn as unknown as MockInstance).mockReturnValue(false);

      await manager.sync();

      expect(drive.ensureFolder).not.toHaveBeenCalled();
    });
  });

  describe('sync — offline', () => {
    it('sets status to offline when not connected', async () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { onLine: false },
        writable: true,
        configurable: true,
      });

      await manager.sync();

      expect(manager.getState().status).toBe('offline');
      expect(drive.ensureFolder).not.toHaveBeenCalled();
    });
  });

  describe('sync — error handling', () => {
    it('sets error state on drive failure', async () => {
      await saveDatabase(new Uint8Array([1, 2, 3]));
      (drive.ensureFolder as unknown as MockInstance).mockRejectedValue(new Error('Network error'));

      await manager.sync();

      expect(manager.getState().status).toBe('error');
      expect(manager.getState().error).toBe('Network error');
    });

    it('refreshes token when getAccessToken returns null', async () => {
      await saveDatabase(new Uint8Array([1, 2, 3]));
      (auth.getAccessToken as unknown as MockInstance).mockReturnValue(null);
      (auth.refreshToken as unknown as MockInstance).mockResolvedValue('new-token');
      (drive.findFile as unknown as MockInstance).mockResolvedValue(null);

      await manager.sync();

      expect(auth.refreshToken).toHaveBeenCalled();
      expect(drive.ensureFolder).toHaveBeenCalledWith('new-token');
    });
  });

  describe('concurrent sync prevention', () => {
    it('queues a sync when one is already in progress', async () => {
      await saveDatabase(new Uint8Array([1, 2, 3]));

      let resolveFirst: () => void;
      const firstSyncBlock = new Promise<void>((r) => {
        resolveFirst = r;
      });

      (drive.ensureFolder as unknown as MockInstance).mockImplementationOnce(async () => {
        await firstSyncBlock;
        return 'folder-123';
      });

      const sync1 = manager.sync();

      (drive.findFile as unknown as MockInstance).mockResolvedValue(null);
      const sync2 = manager.sync();

      resolveFirst!();
      await sync1;
      await sync2;

      expect(drive.ensureFolder).toHaveBeenCalledTimes(2);
    });
  });

  describe('onStateChange', () => {
    it('notifies listeners of state changes', async () => {
      await saveDatabase(new Uint8Array([1, 2, 3]));
      const listener = vi.fn();
      manager.onStateChange(listener);

      (drive.findFile as unknown as MockInstance).mockResolvedValue(null);

      await manager.sync();

      expect(listener).toHaveBeenCalled();
      const calls = listener.mock.calls;
      expect(calls[0][0].status).toBe('syncing');
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall.status).toBe('idle');
    });

    it('returns an unsubscribe function', async () => {
      const listener = vi.fn();
      const unsubscribe = manager.onStateChange(listener);
      unsubscribe();

      await saveDatabase(new Uint8Array([1, 2, 3]));
      (drive.findFile as unknown as MockInstance).mockResolvedValue(null);
      await manager.sync();

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
```

### Test count: 14 tests

---

## Task 13: Verify — Run Tests

```bash
npm test
```

Expected: All existing tests (120 from Stages 2-3) pass, plus new sync tests:
- `auth.test.ts` — 10 tests
- `drive.test.ts` — 12 tests
- `sync-manager.test.ts` — 14 tests

**Total: ~156 tests**

---

## Task 14: Verify — Type Check

```bash
npm run build
```

This runs `tsc -b` first, catching any type errors across the entire codebase.

---

## Commit Plan

Single commit after all tasks pass:

```
Stage 4: Google Drive sync — auth, drive, sync-manager with tests
```

Branch: `sk-stage4-google-drive-sync`

---

## Summary of Deliverables

| # | File | Status |
|---|------|--------|
| 1 | `index.html` | Modified — add GIS script tag |
| 2 | `src/types/google.d.ts` | **New** — TypeScript declarations for GIS |
| 3 | `src/types/index.ts` | Modified — add SyncState, SyncStatus, SyncDirection |
| 4 | `src/sync/auth.ts` | **Replaced** — GoogleAuth class |
| 5 | `src/sync/drive.ts` | **Replaced** — DriveClient class |
| 6 | `src/sync/sync-manager.ts` | **Replaced** — SyncManager class |
| 7 | `src/hooks/useSync.ts` | **Replaced** — stub with types |
| 8 | `.gitignore` | Modified — ensure .env.local is listed |
| 9 | `src/sync/__tests__/auth.test.ts` | **New** — 10 tests |
| 10 | `src/sync/__tests__/drive.test.ts` | **New** — 12 tests |
| 11 | `src/sync/__tests__/sync-manager.test.ts` | **New** — 14 tests |
| 12 | `.env.local` | **New** (not committed) — VITE_GOOGLE_CLIENT_ID |

## How future stages will use this

**Stage 5 (UI Shell)** will:
1. Fully implement `useSync.ts` — create GoogleAuth/DriveClient/SyncManager instances, wire up with DatabaseContext
2. Add sync status indicator to the TopBar component
3. Add sign-in/sign-out to the Settings page
4. Call `syncManager.scheduleUpload()` after each `persistDatabase()`

The sync infrastructure is fully testable and usable without any UI. Stage 5 just needs to wire it into React.
