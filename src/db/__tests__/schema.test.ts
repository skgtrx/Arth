import { describe, it, expect, beforeEach } from 'vitest';
import initSqlJs, { type Database } from 'sql.js';
import { createSchema, getSchemaVersion } from '../schema';

let db: Database;

beforeEach(async () => {
  const SQL = await initSqlJs();
  db = new SQL.Database();
  createSchema(db);
  db.run('PRAGMA foreign_keys=ON;');
});

describe('createSchema', () => {
  it('creates all 6 tables', () => {
    const result = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    const tables = result[0].values.map(r => r[0]);
    expect(tables).toContain('accounts');
    expect(tables).toContain('funds');
    expect(tables).toContain('categories');
    expect(tables).toContain('sub_categories');
    expect(tables).toContain('transactions');
    expect(tables).toContain('schema_version');
  });

  it('sets schema version to 1', () => {
    expect(getSchemaVersion(db)).toBe(1);
  });

  it('is idempotent', () => {
    createSchema(db);
    expect(getSchemaVersion(db)).toBe(1);
  });
});

describe('constraints', () => {
  it('rejects invalid account type', () => {
    expect(() => {
      db.run("INSERT INTO accounts (name, type, created_at) VALUES ('Test', 'invalid', '2026-01-01')");
    }).toThrow();
  });

  it('rejects invalid transaction type', () => {
    db.run("INSERT INTO accounts (name, type, created_at) VALUES ('TestAcct', 'bank', '2026-01-01')");
    db.run("INSERT INTO funds (name, created_at) VALUES ('TestFund', '2026-01-01')");
    db.run("INSERT INTO categories (name) VALUES ('TestCat')");
    db.run("INSERT INTO sub_categories (name, category_id) VALUES ('TestSub', 1)");

    expect(() => {
      db.run(
        `INSERT INTO transactions (date, category_id, sub_category_id, transaction_type, fund_id, account_id, amount, comments, created_at, updated_at)
         VALUES ('2026-01-01', 1, 1, 'invalid', 1, 1, 100, NULL, '2026-01-01', '2026-01-01')`
      );
    }).toThrow();
  });

  it('rejects zero or negative amount', () => {
    db.run("INSERT INTO accounts (name, type, created_at) VALUES ('TestAcct', 'bank', '2026-01-01')");
    db.run("INSERT INTO funds (name, created_at) VALUES ('TestFund', '2026-01-01')");
    db.run("INSERT INTO categories (name) VALUES ('TestCat')");
    db.run("INSERT INTO sub_categories (name, category_id) VALUES ('TestSub', 1)");

    expect(() => {
      db.run(
        `INSERT INTO transactions (date, category_id, sub_category_id, transaction_type, fund_id, account_id, amount, comments, created_at, updated_at)
         VALUES ('2026-01-01', 1, 1, 'debit', 1, 1, 0, NULL, '2026-01-01', '2026-01-01')`
      );
    }).toThrow();

    expect(() => {
      db.run(
        `INSERT INTO transactions (date, category_id, sub_category_id, transaction_type, fund_id, account_id, amount, comments, created_at, updated_at)
         VALUES ('2026-01-01', 1, 1, 'debit', 1, 1, -100, NULL, '2026-01-01', '2026-01-01')`
      );
    }).toThrow();
  });

  it('rejects duplicate account name', () => {
    db.run("INSERT INTO accounts (name, type, created_at) VALUES ('HDFC', 'bank', '2026-01-01')");
    expect(() => {
      db.run("INSERT INTO accounts (name, type, created_at) VALUES ('HDFC', 'bank', '2026-01-01')");
    }).toThrow();
  });

  it('rejects duplicate sub-category within same category', () => {
    db.run("INSERT INTO categories (name) VALUES ('TestCat')");
    db.run("INSERT INTO sub_categories (name, category_id) VALUES ('TestSub', 1)");
    expect(() => {
      db.run("INSERT INTO sub_categories (name, category_id) VALUES ('TestSub', 1)");
    }).toThrow();
  });

  it('allows same sub-category name in different categories', () => {
    db.run("INSERT INTO categories (name) VALUES ('Cat1')");
    db.run("INSERT INTO categories (name) VALUES ('Cat2')");
    db.run("INSERT INTO sub_categories (name, category_id) VALUES ('Other', 1)");
    expect(() => {
      db.run("INSERT INTO sub_categories (name, category_id) VALUES ('Other', 2)");
    }).not.toThrow();
  });

  it('enforces foreign key on transactions', () => {
    expect(() => {
      db.run(
        `INSERT INTO transactions (date, category_id, sub_category_id, transaction_type, fund_id, account_id, amount, comments, created_at, updated_at)
         VALUES ('2026-01-01', 999, 999, 'debit', 999, 999, 100, NULL, '2026-01-01', '2026-01-01')`
      );
    }).toThrow();
  });
});
