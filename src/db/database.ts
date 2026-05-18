import initSqlJs, { type Database } from 'sql.js';
import { createSchema } from './schema';

let dbInstance: Database | null = null;

export async function initDatabase(existingData?: ArrayLike<number>): Promise<Database> {
  const SQL = await initSqlJs({
    locateFile: () => `${import.meta.env.BASE_URL}sql-wasm.wasm`,
  });

  if (existingData) {
    dbInstance = new SQL.Database(existingData);
  } else {
    dbInstance = new SQL.Database();
    createSchema(dbInstance);
  }

  dbInstance.run('PRAGMA foreign_keys=ON;');

  return dbInstance;
}

export function getDatabase(): Database {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export function exportDatabase(): Uint8Array {
  return getDatabase().export();
}
