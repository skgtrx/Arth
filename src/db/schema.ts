import type { Database } from 'sql.js';

const SCHEMA_VERSION = 1;

const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER NOT NULL,
    applied_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK(type IN ('bank', 'credit_card', 'wallet', 'cash', 'investment')),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS funds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    is_active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS sub_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    is_active INTEGER NOT NULL DEFAULT 1,
    UNIQUE(name, category_id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    sub_category_id INTEGER NOT NULL REFERENCES sub_categories(id),
    transaction_type TEXT NOT NULL CHECK(transaction_type IN ('credit', 'debit')),
    fund_id INTEGER NOT NULL REFERENCES funds(id),
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    amount INTEGER NOT NULL CHECK(amount > 0),
    comments TEXT,
    transfer_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

const CREATE_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
  CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_fund ON transactions(fund_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_transfer ON transactions(transfer_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_date_category ON transactions(date, category_id);
`;

export function createSchema(db: Database): void {
  db.run(CREATE_TABLES);
  db.run(CREATE_INDEXES);

  const result = db.exec('SELECT MAX(version) as v FROM schema_version');
  const currentVersion = result.length > 0 && result[0].values.length > 0
    ? (result[0].values[0][0] as number | null) ?? 0
    : 0;

  if (currentVersion < SCHEMA_VERSION) {
    db.run(
      'INSERT INTO schema_version (version, applied_at) VALUES (?, ?)',
      [SCHEMA_VERSION, new Date().toISOString()]
    );
  }
}

export function getSchemaVersion(db: Database): number {
  const result = db.exec('SELECT MAX(version) as v FROM schema_version');
  if (result.length === 0 || result[0].values.length === 0) return 0;
  return (result[0].values[0][0] as number) ?? 0;
}
