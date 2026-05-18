import type { Database } from 'sql.js';
import { getSchemaVersion } from './schema';

interface Migration {
  version: number;
  up: (db: Database) => void;
}

const MIGRATIONS: Migration[] = [];

export function runMigrations(db: Database): void {
  const currentVersion = getSchemaVersion(db);
  const pending = MIGRATIONS.filter(m => m.version > currentVersion);

  for (const migration of pending) {
    migration.up(db);
    db.run(
      'INSERT INTO schema_version (version, applied_at) VALUES (?, ?)',
      [migration.version, new Date().toISOString()]
    );
  }
}
