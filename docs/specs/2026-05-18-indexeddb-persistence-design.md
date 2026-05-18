# Stage 3: IndexedDB Persistence — Design Doc

**Date:** 2026-05-18
**Stage:** 3 of 13 (IMPLEMENTATION_PLAN.md)
**Depends on:** Stage 2 (Database Layer) — complete

---

## Problem

Currently the sql.js database lives entirely in memory. Closing the browser tab loses all data. Stage 3 adds local persistence via IndexedDB so the database survives tab/browser restarts.

## Architecture

```
UI mutation → sql.js (in-memory) → IndexedDB (serialized Uint8Array)
                                      ↑
App startup ← sql.js (restored) ← IndexedDB (load)
```

### IndexedDB Schema

- **Database name:** `arth-db`
- **Object store:** `persistence`
- **Key:** `main`
- **Value shape:**

```typescript
{
  data: Uint8Array;       // Full serialized sql.js database
  lastModified: string;   // ISO 8601 timestamp of last mutation
}
```

Storing both fields in a single record under one key ensures atomic writes — either both the database and the timestamp update, or neither does. This is important for Stage 4's sync logic, which uses `lastModified` to decide whether to upload.

### Why raw IndexedDB instead of a wrapper library

- Zero dependencies to add — IndexedDB is available in all target browsers
- We only need 3 operations: open, get, put — a wrapper would be over-engineering
- Total code: ~50 lines

## Key Design Decisions

### 1. Save after every mutation (not debounced)

The implementation plan says "Auto-save on every DB mutation." Since sql.js `export()` serializes the entire database to a `Uint8Array` (typically <1 MB for this app), the cost is negligible. Debouncing would risk data loss if the user closes the tab during the debounce window. (Debouncing is reserved for Stage 4's Google Drive sync, which has network cost.)

### 2. Integration point: DatabaseContext

The `DatabaseProvider` in `src/context/DatabaseContext.tsx` is the single place where the database is initialized. It will be modified to:

1. **On startup:** Try loading from IndexedDB first. If found, pass the `Uint8Array` to `initDatabase(existingData)`. If not found, create a fresh DB and seed it, then persist to IndexedDB.
2. **Expose a `persistDatabase` callback** in the context that serializes the current db to IndexedDB.

### 3. Explicit persist calls

Rather than intercepting every `db.run()` call (which would require wrapping the sql.js Database object), the context exposes `persistDatabase()` as a callback. Callers invoke it after mutations. This keeps the API explicit and testable. Future UI code will call `persistDatabase()` after each transaction/account/fund/category mutation.

### 4. lastModified tracking

Every call to `persistDatabase()` writes a fresh ISO timestamp alongside the serialized DB. This timestamp will be consumed by Stage 4 (Google Drive sync) to compare local vs remote versions. For now we store it and expose it in the context.

## Files Changed

| File | Change |
|------|--------|
| `src/db/persistence.ts` | **NEW** — IndexedDB save/load/getLastModified functions |
| `src/context/DatabaseContext.tsx` | Load from IndexedDB on startup; expose `persistDatabase` and `lastModified` |
| `src/hooks/useDatabase.ts` | Return `persistDatabase` and `lastModified` from the context |
| `src/db/__tests__/persistence.test.ts` | **NEW** — Unit tests for persistence layer |

## Testing Strategy

- **Unit tests** (`persistence.test.ts`): Use `fake-indexeddb` (a pure-JS IndexedDB polyfill for Node) to test save/load/lastModified round-trips without a browser
- **Full round-trip test**: Create a real sql.js database, export, save to IndexedDB, load back, verify data integrity
- **Existing tests**: No changes needed — they use in-memory sql.js directly without IndexedDB
