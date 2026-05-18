import { useDatabaseContext } from '@/context/DatabaseContext';
import type { Database } from 'sql.js';

export function useDatabase(): { db: Database; isLoading: false; isSeeded: boolean } | { db: null; isLoading: true; isSeeded: false } {
  const context = useDatabaseContext();
  if (context.isLoading || !context.db) {
    return { db: null, isLoading: true as const, isSeeded: false };
  }
  return { db: context.db, isLoading: false as const, isSeeded: context.isSeeded };
}
