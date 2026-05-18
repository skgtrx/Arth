import { useDatabaseContext } from '@/context/DatabaseContext';
import type { Database } from 'sql.js';

interface DatabaseReady {
  db: Database;
  isLoading: false;
  lastModified: string | null;
  persistDatabase: () => Promise<void>;
  replaceDatabase: (data: Uint8Array) => Promise<void>;
}

interface DatabaseLoading {
  db: null;
  isLoading: true;
  lastModified: null;
  persistDatabase: () => Promise<void>;
  replaceDatabase: (data: Uint8Array) => Promise<void>;
}

export function useDatabase(): DatabaseReady | DatabaseLoading {
  const context = useDatabaseContext();
  if (context.isLoading || !context.db) {
    return {
      db: null,
      isLoading: true as const,
      lastModified: null,
      persistDatabase: context.persistDatabase,
      replaceDatabase: context.replaceDatabase,
    };
  }
  return {
    db: context.db,
    isLoading: false as const,
    lastModified: context.lastModified,
    persistDatabase: context.persistDatabase,
    replaceDatabase: context.replaceDatabase,
  };
}
