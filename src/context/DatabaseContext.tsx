import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Database } from 'sql.js';
import { initDatabase, closeDatabase } from '@/db/database';
import { seedDatabase, isDatabaseSeeded } from '@/db/seed';
import { runMigrations } from '@/db/migrations';

interface DatabaseContextValue {
  db: Database | null;
  isLoading: boolean;
  isSeeded: boolean;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  db: null,
  isLoading: true,
  isSeeded: false,
});

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeded, setIsSeeded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const database = await initDatabase();
        runMigrations(database);

        if (!isDatabaseSeeded(database)) {
          seedDatabase(database);
        }

        if (mounted) {
          setDb(database);
          setIsSeeded(true);
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
      closeDatabase();
    };
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, isLoading, isSeeded }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabaseContext(): DatabaseContextValue {
  return useContext(DatabaseContext);
}
