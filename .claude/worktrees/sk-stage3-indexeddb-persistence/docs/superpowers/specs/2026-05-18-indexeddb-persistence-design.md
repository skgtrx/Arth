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

### Data stored in IndexedDB

A single object store `arth` in an IndexedDB database named `arth-db`:

| Key               | Value                | Purpose                                      |
|--------------------|----------------------|----------------------------------------------|
| `db`              | `Uint8Array`         | The full serialized sql.js database           |
| `lastModified`    | ISO 8601 string      | Timestamp of the last mutation (for Stage 4 sync) |

Using a key-value object store (not auto-increment) keeps the design trivial and avoids IndexedDB versioning complexity.

### Why raw IndexedDB instead of a wrapper library

- Zero dependencies to add — IndexedDB is available in all target browsers
- We only need 3 operations: open, get, put — a wrapper would be over-engineering
- Total code: ~60 lines

## Key Design Decisions

### 1. Save after every mutation (not debounced)

The implementation plan says "Auto-save on every DB mutation." Since sql.js `export()` serializes the entire database to a `Uint8Array` (typically <1 MB for this app), the cost is negligible. Debouncing would risk data loss if the user closes the tab during the debounce window.

### 2. Integration point: DatabaseContext

The `DatabaseProvider` in `src/context/DatabaseContext.tsx` is the single place where the database is initialized. It will be modified to:

1. **On startup:** Try loading from IndexedDB first. If found, pass the `Uint8Array` to `initDatabase(existingData)`. If not found, create a fresh DB and seed it.
2. **Expose a `persistDatabase` callback** in the context that other code can call after mutations.

### 3. Mutation wrapper pattern

Rather than requiring every call site to remember `persistDatabase()`, the `DatabaseContext` will expose a `mutate` function that wraps the pattern:

```
mutate(fn) = fn(db) → persistDatabase()
```

This ensures persistence is never forgotten. The `useDatabase` hook will expose this alongside `db`.

### 4. lastModified tracking

Every call to `persistDatabase()` writes a fresh ISO timestamp alongside the serialized DB. This timestamp will be consumed by Stage 4 (Google Drive sync) to compare local vs remote versions. For now we just store it.

## Files Changed

| File | Change |
|------|--------|
| `src/db/persistence.ts` | **NEW** — IndexedDB save/load/getLastModified functions |
| `src/context/DatabaseContext.tsx` | Load from IndexedDB on startup; expose `persistDatabase` and `mutate` |
| `src/hooks/useDatabase.ts` | Return `persistDatabase` and `mutate` from the context |
| `src/db/__tests__/persistence.test.ts` | **NEW** — Unit tests for persistence layer |

## Testing Strategy

- **Unit tests** (`persistence.test.ts`): Use `fake-indexeddb` (a pure-JS IndexedDB polyfill for Node) to test save/load/lastModified round-trips without a browser
- **Existing tests**: No changes needed — they use in-memory sql.js directly without IndexedDB
