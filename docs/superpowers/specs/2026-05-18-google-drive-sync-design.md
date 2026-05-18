# Stage 4: Google Drive Sync — Design Document

**Date:** 2026-05-18
**PRD Reference:** [docs/PRD.md](../../PRD.md)
**Implementation Plan Reference:** [docs/IMPLEMENTATION_PLAN.md](../../IMPLEMENTATION_PLAN.md)

---

## 1. Overview

Stage 4 adds cloud sync to Arth by uploading/downloading the SQLite database file (`finance.db`) to/from Google Drive. This gives cross-device access and cloud backup while maintaining the zero-backend, offline-first architecture.

The sync layer sits on top of Stage 3's IndexedDB persistence:

```
UI → sql.js (in-memory) → IndexedDB (instant, every mutation) → Google Drive (30s debounce)
```

---

## 2. Scope

### In scope (this stage)
- Google OAuth 2.0 via Google Identity Services (GIS) — Token Model
- Google Drive REST API v3 — folder/file CRUD via plain `fetch()`
- SyncManager — orchestrates debounced upload, download-on-load, conflict resolution
- Online/offline detection and sync-on-reconnect
- Unit tests for all sync modules
- TypeScript type declarations for GIS globals

### Out of scope (deferred to Stage 5)
- Sync status UI (top bar indicator, manual sync button)
- `useSync` React hook (will consume SyncManager in Stage 5)

---

## 3. Architecture

### 3.1 Module Structure

```
src/sync/
  auth.ts           — GoogleAuth class: wraps GIS token model
  drive.ts          — DriveClient class: wraps Drive REST API v3
  sync-manager.ts   — SyncManager class: orchestration layer
src/types/
  google.d.ts       — TypeScript declarations for GIS globals
```

### 3.2 Dependency Graph

```
SyncManager
  ├── GoogleAuth (for access tokens)
  ├── DriveClient (for Drive operations)
  └── persistence.ts (for local lastModified)
```

`SyncManager` is the only module that coordinates auth + drive + persistence. `GoogleAuth` and `DriveClient` are standalone — they don't import each other. The access token flows from `GoogleAuth` → `SyncManager` → `DriveClient` as a function parameter.

### 3.3 Data Flow

**On app load (signed in):**
1. App loads DB from IndexedDB (instant — Stage 3)
2. SyncManager calls `DriveClient.getFileMetadata()` to get remote `modifiedTime`
3. Compares local `lastModified` (from IndexedDB) vs remote `modifiedTime`
4. If remote newer → download remote DB, replace in-memory + IndexedDB
5. If local newer → upload local DB to Drive
6. If equal → no action

**After each database mutation:**
1. Caller invokes `persistDatabase()` (saves to IndexedDB, updates `lastModified`)
2. Caller (or context) notifies SyncManager via `scheduleUpload()`
3. SyncManager debounces: resets a 30-second timer on each call
4. When timer fires, uploads the latest IndexedDB data to Drive

**On offline → online transition:**
1. SyncManager listens to `window.addEventListener('online')`
2. When connectivity returns, triggers a full sync (same logic as app load)

---

## 4. Key Design Decisions

### 4.1 Google Identity Services — Token Model

**Decision:** Use the GIS Token Model (`google.accounts.oauth2.initTokenClient`) with implicit grant.

**Rationale:**
- The Code Model requires a backend to exchange authorization codes for tokens — not viable for a zero-backend app
- Token Model returns an access token directly to the browser
- Tokens expire in ~1 hour; the app handles this by catching 401 responses and re-requesting a token via GIS (which auto-approves if the user previously consented)
- Scope: `https://www.googleapis.com/auth/drive.file` — can only access files the app created

### 4.2 Token Storage — Memory Only

**Decision:** Access tokens live only in JavaScript memory. Not persisted to localStorage or IndexedDB.

**Rationale:**
- Storing tokens in localStorage creates XSS risk
- The UX cost is minimal: on each app open, GIS shows a brief consent popup (auto-approved after first consent — no manual click needed)
- The app loads instantly from IndexedDB regardless; Drive sync happens in the background
- Single-user PWA on a personal device — re-auth friction is negligible

### 4.3 GIS Script Loading — Static Script Tag

**Decision:** Load the GIS library via a `<script>` tag in `index.html`.

**Rationale:**
- The script is ~50KB and needed on most sessions
- PWA service worker will precache it
- Simpler than dynamic injection — no race conditions between script load and sign-in attempt
- The `async` attribute prevents blocking the initial render

### 4.4 Drive API — Raw `fetch()`, No Client Library

**Decision:** Call the Google Drive REST API v3 directly using `fetch()`. No `gapi` or `googleapis` npm package.

**Rationale:**
- The Drive operations are simple (4 endpoints: search, create, update, download)
- `fetch()` is built-in, keeps the dependency count at zero
- The `gapi` client library is heavy (~100KB+) and designed for the old auth flow
- Raw fetch with `Authorization: Bearer <token>` is clean and testable

### 4.5 Conflict Resolution — Last Write Wins

**Decision:** Compare ISO timestamps. The newer version overwrites the older one.

**Rationale:**
- Single-user app — conflicts only happen when the same user edits on two devices without syncing
- Google Drive's built-in version history (30-day retention) is the safety net for accidental overwrites
- More complex strategies (CRDTs, merge) are overkill for a single-user, whole-file sync

### 4.6 Module Style — Classes

**Decision:** `GoogleAuth`, `DriveClient`, and `SyncManager` are classes (not plain functions).

**Rationale:**
- `SyncManager` holds mutable state: debounce timer, folder/file IDs, online status, sync-in-progress flag
- `GoogleAuth` holds the token client instance and current token
- `DriveClient` is stateless but benefits from a consistent API pattern with the other two
- Classes make dependency injection easy for testing (pass mock instances)
- The existing `persistence.ts` is functional because it's stateless — the sync layer is inherently stateful

---

## 5. Google Cloud Project Setup (Manual — Task 4.1)

This is a one-time manual setup in the Google Cloud Console. The app code expects a Client ID as an environment variable.

### Steps

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → Create project "Arth"
2. Enable the **Google Drive API**
3. Configure **OAuth consent screen**:
   - User type: External
   - Publishing status: **Testing** (no Google review required)
   - App name: "Arth"
   - Scopes: `https://www.googleapis.com/auth/drive.file`
   - Test users: add your Google account email
4. Create **OAuth Client ID**:
   - Application type: Web application
   - Authorized JavaScript origins:
     - `http://localhost:5173` (dev)
     - GitHub Pages URL (prod, added later in Stage 11)
   - Authorized redirect URIs: same as origins
5. Copy the Client ID

### Environment Variable

The Client ID is stored as a Vite environment variable:

```bash
# .env.local (not committed to git)
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

Accessed in code via `import.meta.env.VITE_GOOGLE_CLIENT_ID`.

---

## 6. API Details

### 6.1 Google Identity Services

**Script:** `https://accounts.google.com/gsi/client` (loaded in `index.html`)

**Token Model API:**

```typescript
// Initialize
const tokenClient = google.accounts.oauth2.initTokenClient({
  client_id: CLIENT_ID,
  scope: 'https://www.googleapis.com/auth/drive.file',
  callback: (tokenResponse) => {
    // tokenResponse.access_token — the bearer token
    // tokenResponse.expires_in — seconds until expiry (typically 3600)
    // tokenResponse.error — present if auth failed
  },
});

// Request token (shows popup on first call, auto-approves after)
tokenClient.requestAccessToken();

// Revoke token (sign out)
google.accounts.oauth2.revoke(accessToken);
```

### 6.2 Google Drive REST API v3

All requests use `Authorization: Bearer <access_token>` header.

**Search for folder:**
```
GET https://www.googleapis.com/drive/v3/files
  ?q=name='Arth' and mimeType='application/vnd.google-apps.folder' and trashed=false
  &fields=files(id,name)
  &spaces=drive
```

**Create folder:**
```
POST https://www.googleapis.com/drive/v3/files
Content-Type: application/json

{ "name": "Arth", "mimeType": "application/vnd.google-apps.folder" }
```

**Search for file in folder:**
```
GET https://www.googleapis.com/drive/v3/files
  ?q=name='finance.db' and '<folderId>' in parents and trashed=false
  &fields=files(id,name,modifiedTime)
  &spaces=drive
```

**Upload file (multipart — create new):**
```
POST https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart
Content-Type: multipart/related; boundary=BOUNDARY

--BOUNDARY
Content-Type: application/json

{ "name": "finance.db", "parents": ["<folderId>"] }
--BOUNDARY
Content-Type: application/x-sqlite3

<binary data>
--BOUNDARY--
```

**Update file (multipart — overwrite existing):**
```
PATCH https://www.googleapis.com/upload/drive/v3/files/<fileId>?uploadType=multipart
Content-Type: multipart/related; boundary=BOUNDARY

--BOUNDARY
Content-Type: application/json

{ "modifiedTime": "<ISO timestamp>" }
--BOUNDARY
Content-Type: application/x-sqlite3

<binary data>
--BOUNDARY--
```

**Get file metadata:**
```
GET https://www.googleapis.com/drive/v3/files/<fileId>
  ?fields=id,name,modifiedTime,size
```

**Download file:**
```
GET https://www.googleapis.com/drive/v3/files/<fileId>?alt=media
```

---

## 7. Error Handling

| Error | Handling |
|-------|----------|
| 401 Unauthorized | Token expired. Call `tokenClient.requestAccessToken()` to get a fresh token, then retry the Drive request once. |
| 403 Forbidden | Scope insufficient or file not owned by app. Log error, surface to user in future UI stage. |
| 404 Not Found | File/folder deleted externally. Re-create folder and upload fresh. |
| Network error | `fetch()` throws `TypeError`. Mark as offline, queue sync for when `online` event fires. |
| Concurrent sync | `SyncManager` uses a `syncInProgress` flag. If a sync is already running, the new request is queued (not dropped). |

---

## 8. TypeScript Types

### GIS Global Types (`src/types/google.d.ts`)

Since GIS is loaded via script tag, we need ambient type declarations for `window.google.accounts.oauth2`. A `.d.ts` file provides editor autocompletion and type safety without a runtime dependency.

### Sync-Related Types (added to `src/types/index.ts`)

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

## 9. Testing Strategy

All tests use vitest with `vi.mock()` and `vi.fn()`. No new test dependencies.

### 9.1 `auth.test.ts`
- Mock `window.google.accounts.oauth2` (the GIS global)
- Test: initialization, sign-in flow (callback receives token), sign-out (revoke called), `getAccessToken()` returns current token, `isSignedIn()` state tracking

### 9.2 `drive.test.ts`
- Mock `globalThis.fetch`
- Test: `ensureFolder()` (find existing / create new), `uploadDatabase()` (create / update), `downloadDatabase()` (returns Uint8Array), `getFileMetadata()` (returns modifiedTime), error handling (401, 404, network errors)

### 9.3 `sync-manager.test.ts`
- Mock both auth and drive modules via `vi.mock()`
- Use `vi.useFakeTimers()` for debounce testing
- Test: debounce behavior (multiple calls within 30s result in single upload), conflict resolution (local newer → upload, remote newer → download, equal → no-op), offline queuing (sync deferred until online), online reconnection triggers sync, concurrent sync prevention (syncInProgress flag)

---

## 10. Security Considerations

- **`drive.file` scope:** App can only access files it created. Cannot read user's other Drive files.
- **Testing mode:** Only test users (added manually in Cloud Console) can authenticate. No public access.
- **No token persistence:** Access tokens live in memory only. No XSS exposure via localStorage.
- **Client ID is public:** This is expected for OAuth 2.0 client-side apps. The Client ID alone cannot access user data — it requires user consent.
- **HTTPS required:** GitHub Pages serves over HTTPS. Localhost is exempt during development.
