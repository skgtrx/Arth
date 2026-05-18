# Stage 3: IndexedDB Persistence — Implementation Plan

**Date:** 2026-05-18
**Design doc:** `docs/superpowers/specs/2026-05-18-indexeddb-persistence-design.md`

---

## Task 1: Install `fake-indexeddb` dev dependency

We need a test polyfill for IndexedDB since vitest runs in Node (`environment: 'node'` in vite.config.ts).

```bash
cd /Users/shashank.khandelwal/Desktop/Playground/Arth/.claude/worktrees/sk-stage3-indexeddb-persistence
npm install --save-dev fake-indexeddb
```

No source code changes.

---

## Task 2: Create `src/db/persistence.ts` — IndexedDB save/load layer

This is the core new module. It wraps three IndexedDB operations.

**Create file:** `src/db/persistence.ts`

```typescript
const DB_NAME = 'arth-db';
const STORE_NAME = 'arth';
const DB_KEY = 'db';
const LAST_MODIFIED_KEY = 'lastModified';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDatabase(data: Uint8Array): Promise<string> {
  const idb = await openDatabase();
  const timestamp = new Date().toISOString();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(data, DB_KEY);
    store.put(timestamp, LAST_MODIFIED_KEY);
    tx.oncomplete = () => {
      idb.close();
      resolve(timestamp);
    };
    tx.onerror = () => {
      idb.close();
      reject(tx.error);
    };
  });
}

export async function loadDatabase(): Promise<Uint8Array | null> {
  const idb = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(DB_KEY);
    request.onsuccess = () => {
      idb.close();
      resolve(request.result ?? null);
    };
    request.onerror = () => {
      idb.close();
      reject(request.error);
    };
  });
}

export async function getLastModified(): Promise<string | null> {
  const idb = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(LAST_MODIFIED_KEY);
    request.onsuccess = () => {
      idb.close();
      resolve(request.result ?? null);
    };
    request.onerror = () => {
      idb.close();
      reject(request.error);
    };
  });
}
```

### Key details

- `openDatabase()` is private. It opens+creates the store on version 1, then returns the `IDBDatabase` handle.
- Each public function opens, does its work, then closes the connection. This avoids holding long-lived connections (IndexedDB best practice for infrequent access patterns).
- `saveDatabase` writes both the binary data and the timestamp in a single transaction for atomicity.
- `saveDatabase` returns the timestamp so callers can track it without an extra read.

---

## Task 3: Update `src/context/DatabaseContext.tsx` — Integrate IndexedDB persistence

This is the most important change. The context must:
1. Load from IndexedDB on startup (falling back to fresh DB + seed)
2. Expose a `persistDatabase` function that serializes to IndexedDB
3. Track `lastModified` in state

**Replace the entire file** with:

```typescript
import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { Database } from 'sql.js';
import { initDatabase, closeDatabase, exportDatabase } from '@/db/database';
import { seedDatabase, isDatabaseSeeded } from '@/db/seed';
import { runMigrations } from '@/db/migrations';
import { saveDatabase, loadDatabase } from '@/db/persistence';

interface DatabaseContextValue {
  db: Database | null;
  isLoading: boolean;
  isSeeded: boolean;
  lastModified: string | null;
  persistDatabase: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  db: null,
  isLoading: true,
  isSeeded: false,
  lastModified: null,
  persistDatabase: async () => {},
});

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeded, setIsSeeded] = useState(false);
  const [lastModified, setLastModified] = useState<string | null>(null);
  const dbRef = useRef<Database | null>(null);

  const persistDatabase = useCallback(async () => {
    if (!dbRef.current) return;
    const data = exportDatabase();
    const timestamp = await saveDatabase(data);
    setLastModified(timestamp);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const existingData = await loadDatabase();

        const database = existingData
          ? await initDatabase(existingData)
          : await initDatabase();

        runMigrations(database);

        let seeded = isDatabaseSeeded(database);
        if (!seeded) {
          seedDatabase(database);
          seeded = true;
        }

        dbRef.current = database;

        if (!existingData) {
          const data = exportDatabase();
          const timestamp = await saveDatabase(data);
          if (mounted) setLastModified(timestamp);
        }

        if (mounted) {
          setDb(database);
          setIsSeeded(seeded);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to initialize database:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
      dbRef.current = null;
      closeDatabase();
    };
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, isLoading, isSeeded, lastModified, persistDatabase }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabaseContext(): DatabaseContextValue {
  return useContext(DatabaseContext);
}
```

### Changes from the existing code

1. **Added imports:** `useCallback`, `useRef`, `exportDatabase`, `saveDatabase`, `loadDatabase`
2. **New state:** `lastModified` (string | null)
3. **`dbRef`:** A ref that tracks the current Database instance so `persistDatabase` always sees the latest db without depending on state (avoids stale closure issues in callbacks)
4. **`persistDatabase` callback:** Exports the db, saves to IndexedDB, updates `lastModified` state
5. **Init flow changed:**
   - First tries `loadDatabase()` from IndexedDB
   - If data found, passes it to `initDatabase(existingData)` — restoring the persisted database
   - If no data found, creates fresh DB, seeds, then saves to IndexedDB immediately
6. **Context value expanded:** Now includes `lastModified` and `persistDatabase`

---

## Task 4: Update `src/hooks/useDatabase.ts` — Expose persistence API

The hook needs to return the new `persistDatabase` function and `lastModified`.

**Replace the entire file** with:

```typescript
import { useDatabaseContext } from '@/context/DatabaseContext';
import type { Database } from 'sql.js';

interface DatabaseReady {
  db: Database;
  isLoading: false;
  isSeeded: boolean;
  lastModified: string | null;
  persistDatabase: () => Promise<void>;
}

interface DatabaseLoading {
  db: null;
  isLoading: true;
  isSeeded: false;
  lastModified: null;
  persistDatabase: () => Promise<void>;
}

export function useDatabase(): DatabaseReady | DatabaseLoading {
  const context = useDatabaseContext();
  if (context.isLoading || !context.db) {
    return {
      db: null,
      isLoading: true as const,
      isSeeded: false,
      lastModified: null,
      persistDatabase: context.persistDatabase,
    };
  }
  return {
    db: context.db,
    isLoading: false as const,
    isSeeded: context.isSeeded,
    lastModified: context.lastModified,
    persistDatabase: context.persistDatabase,
  };
}
```

### Changes from existing code

- Added `lastModified` and `persistDatabase` to both return shapes
- Extracted named interfaces `DatabaseReady` and `DatabaseLoading` for clarity (the inline union type was getting unwieldy)

---

## Task 5: Create `src/db/__tests__/persistence.test.ts` — Tests for IndexedDB persistence

**Create file:** `src/db/__tests__/persistence.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { saveDatabase, loadDatabase, getLastModified } from '../persistence';

beforeEach(() => {
  // Clear all IndexedDB databases between tests
  indexedDB = new IDBFactory();
});

describe('saveDatabase / loadDatabase', () => {
  it('returns null when no data has been saved', async () => {
    const data = await loadDatabase();
    expect(data).toBeNull();
  });

  it('round-trips a Uint8Array through IndexedDB', async () => {
    const original = new Uint8Array([1, 2, 3, 4, 5]);
    await saveDatabase(original);
    const loaded = await loadDatabase();
    expect(loaded).toBeInstanceOf(Uint8Array);
    expect(loaded).toEqual(original);
  });

  it('overwrites previous data on subsequent saves', async () => {
    await saveDatabase(new Uint8Array([1, 2, 3]));
    await saveDatabase(new Uint8Array([4, 5, 6, 7]));
    const loaded = await loadDatabase();
    expect(loaded).toEqual(new Uint8Array([4, 5, 6, 7]));
  });
});

describe('lastModified tracking', () => {
  it('returns null when nothing has been saved', async () => {
    const ts = await getLastModified();
    expect(ts).toBeNull();
  });

  it('returns an ISO timestamp after save', async () => {
    await saveDatabase(new Uint8Array([1]));
    const ts = await getLastModified();
    expect(ts).not.toBeNull();
    expect(new Date(ts!).toISOString()).toBe(ts);
  });

  it('updates timestamp on each save', async () => {
    await saveDatabase(new Uint8Array([1]));
    const ts1 = await getLastModified();
    // Small delay to ensure timestamp differs
    await new Promise(r => setTimeout(r, 10));
    await saveDatabase(new Uint8Array([2]));
    const ts2 = await getLastModified();
    expect(ts2).not.toBe(ts1);
    expect(new Date(ts2!).getTime()).toBeGreaterThan(new Date(ts1!).getTime());
  });

  it('saveDatabase returns the timestamp', async () => {
    const returned = await saveDatabase(new Uint8Array([1]));
    const stored = await getLastModified();
    expect(returned).toBe(stored);
  });
});

describe('full sql.js round-trip', () => {
  it('saves and restores a sql.js database', async () => {
    const initSqlJs = (await import('sql.js')).default;
    const SQL = await initSqlJs();

    // Create a database with some data
    const db1 = new SQL.Database();
    db1.run('CREATE TABLE test (id INTEGER, value TEXT)');
    db1.run("INSERT INTO test VALUES (1, 'hello')");
    const exported = db1.export();
    db1.close();

    // Save to IndexedDB
    await saveDatabase(exported);

    // Load from IndexedDB and verify
    const loaded = await loadDatabase();
    expect(loaded).not.toBeNull();
    const db2 = new SQL.Database(loaded!);
    const result = db2.exec('SELECT * FROM test');
    expect(result[0].values).toEqual([[1, 'hello']]);
    db2.close();
  });
});
```

### Test structure

- **`saveDatabase / loadDatabase`:** Verifies null-when-empty, round-trip fidelity, and overwrite behavior
- **`lastModified tracking`:** Verifies null-when-empty, ISO format, monotonic increase, and return value from `saveDatabase`
- **`full sql.js round-trip`:** End-to-end test creating a real sql.js database, exporting, persisting to IndexedDB, loading back, and querying — this is the critical correctness test

### Why `fake-indexeddb/auto`

The `auto` import patches `globalThis.indexedDB` (and related globals) so the persistence module's calls to `indexedDB.open()` work in Node. The `beforeEach` resets the factory to get a clean database per test.

---

## Task 6: Verify — Run tests

```bash
cd /Users/shashank.khandelwal/Desktop/Playground/Arth/.claude/worktrees/sk-stage3-indexeddb-persistence
npm test
```

All existing tests should still pass. The new `persistence.test.ts` should pass with 8 assertions.

---

## Task 7: Verify — Type check

```bash
npm run build
```

This runs `tsc -b` first, so any type errors will be caught.

---

## Commit plan

Single commit after all tasks pass:

```
Stage 3: IndexedDB persistence — save/load/lastModified with tests
```

Branch: `sk-stage3-indexeddb-persistence`

---

## Summary of deliverables

| # | File | Status |
|---|------|--------|
| 1 | `package.json` (+ lockfile) | Modified — add `fake-indexeddb` |
| 2 | `src/db/persistence.ts` | **New** — IndexedDB save/load/getLastModified |
| 3 | `src/context/DatabaseContext.tsx` | Modified — load from IDB on startup, expose persist |
| 4 | `src/hooks/useDatabase.ts` | Modified — return persistence API |
| 5 | `src/db/__tests__/persistence.test.ts` | **New** — 8 test cases |
