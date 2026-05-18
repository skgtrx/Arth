import { describe, it, expect, beforeEach } from 'vitest';
import initSqlJs, { type Database } from 'sql.js';
import { createSchema } from '../schema';
import { seedDatabase, isDatabaseSeeded } from '../seed';

let db: Database;

beforeEach(async () => {
  const SQL = await initSqlJs();
  db = new SQL.Database();
  createSchema(db);
  db.run('PRAGMA foreign_keys=ON;');
});

describe('isDatabaseSeeded', () => {
  it('returns false for empty database', () => {
    expect(isDatabaseSeeded(db)).toBe(false);
  });

  it('returns true after seeding', () => {
    seedDatabase(db);
    expect(isDatabaseSeeded(db)).toBe(true);
  });
});

describe('seedDatabase', () => {
  it('runs without errors', () => {
    expect(() => seedDatabase(db)).not.toThrow();
  });

  it('inserts expected number of accounts', () => {
    seedDatabase(db);
    const result = db.exec('SELECT COUNT(*) FROM accounts');
    expect(result[0].values[0][0]).toBe(8);
  });

  it('inserts expected number of funds', () => {
    seedDatabase(db);
    const result = db.exec('SELECT COUNT(*) FROM funds');
    expect(result[0].values[0][0]).toBe(7);
  });

  it('inserts expected number of categories', () => {
    seedDatabase(db);
    const result = db.exec('SELECT COUNT(*) FROM categories');
    expect(result[0].values[0][0]).toBe(23);
  });

  it('inserts expected number of sub-categories', () => {
    seedDatabase(db);
    const result = db.exec('SELECT COUNT(*) FROM sub_categories');
    expect(result[0].values[0][0]).toBe(51);
  });

  it('inserts expected number of transactions', () => {
    seedDatabase(db);
    const result = db.exec('SELECT COUNT(*) FROM transactions');
    expect(result[0].values[0][0]).toBe(200);
  });

  it('has no orphaned category references', () => {
    seedDatabase(db);
    const result = db.exec(
      `SELECT COUNT(*) FROM transactions t
       WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.id = t.category_id)`
    );
    expect(result[0].values[0][0]).toBe(0);
  });

  it('has no orphaned sub-category references', () => {
    seedDatabase(db);
    const result = db.exec(
      `SELECT COUNT(*) FROM transactions t
       WHERE NOT EXISTS (SELECT 1 FROM sub_categories sc WHERE sc.id = t.sub_category_id)`
    );
    expect(result[0].values[0][0]).toBe(0);
  });

  it('has no orphaned fund references', () => {
    seedDatabase(db);
    const result = db.exec(
      `SELECT COUNT(*) FROM transactions t
       WHERE NOT EXISTS (SELECT 1 FROM funds f WHERE f.id = t.fund_id)`
    );
    expect(result[0].values[0][0]).toBe(0);
  });

  it('has no orphaned account references', () => {
    seedDatabase(db);
    const result = db.exec(
      `SELECT COUNT(*) FROM transactions t
       WHERE NOT EXISTS (SELECT 1 FROM accounts a WHERE a.id = t.account_id)`
    );
    expect(result[0].values[0][0]).toBe(0);
  });

  it('has transfer pairs with matching transfer_ids', () => {
    seedDatabase(db);
    const result = db.exec(
      `SELECT transfer_id, COUNT(*) as cnt
       FROM transactions
       WHERE transfer_id IS NOT NULL
       GROUP BY transfer_id
       HAVING cnt < 2`
    );
    expect(result).toHaveLength(0);
  });

  it('all amounts are positive integers', () => {
    seedDatabase(db);
    const result = db.exec('SELECT COUNT(*) FROM transactions WHERE amount <= 0');
    expect(result[0].values[0][0]).toBe(0);
  });
});
