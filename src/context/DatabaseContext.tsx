import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { Database } from 'sql.js';
import { initDatabase, closeDatabase, exportDatabase } from '@/db/database';
import { runMigrations } from '@/db/migrations';
import { saveDatabase, loadDatabase } from '@/db/persistence';

interface DatabaseContextValue {
  db: Database | null;
  isLoading: boolean;
  hasLocalData: boolean;
  lastModified: string | null;
  persistDatabase: () => Promise<void>;
  replaceDatabase: (data: Uint8Array) => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  db: null,
  isLoading: true,
  hasLocalData: false,
  lastModified: null,
  persistDatabase: async () => {},
  replaceDatabase: async () => {},
});

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLocalData, setHasLocalData] = useState(false);
  const [lastModified, setLastModified] = useState<string | null>(null);
  const dbRef = useRef<Database | null>(null);

  const persistDatabase = useCallback(async () => {
    if (!dbRef.current) return;
    const data = exportDatabase();
    const timestamp = await saveDatabase(data);
    setLastModified(timestamp);
    setHasLocalData(true);
  }, []);

  const replaceDatabase = useCallback(async (data: Uint8Array) => {
    closeDatabase();
    const database = await initDatabase(data);
    runMigrations(database);
    dbRef.current = database;
    setDb(database);
    setHasLocalData(true);
    setLastModified(new Date().toISOString());
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const persisted = await loadDatabase();

        let database: Database;
        try {
          database = persisted
            ? await initDatabase(persisted.data)
            : await initDatabase();
        } catch (loadError) {
          console.warn('Failed to load persisted database, starting fresh:', loadError);
          database = await initDatabase();
        }

        runMigrations(database);
        dbRef.current = database;

        if (persisted) {
          if (mounted) {
            setLastModified(persisted.lastModified);
            setHasLocalData(true);
          }
        }

        if (mounted) {
          setDb(database);
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
    <DatabaseContext.Provider value={{ db, isLoading, hasLocalData, lastModified, persistDatabase, replaceDatabase }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabaseContext(): DatabaseContextValue {
  return useContext(DatabaseContext);
}
