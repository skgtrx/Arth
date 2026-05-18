import { describe, it, expect, beforeEach } from 'vitest';
import initSqlJs, { type Database } from 'sql.js';
import { createSchema } from '../schema';
import { getAppSetting, setAppSetting, deleteAppSetting } from '../queries';

describe('app_settings queries', () => {
  let db: Database;

  beforeEach(async () => {
    const SQL = await initSqlJs();
    db = new SQL.Database();
    createSchema(db);
  });

  it('returns null for missing key', () => {
    expect(getAppSetting(db, 'pin_hash')).toBeNull();
  });

  it('sets and gets a value', () => {
    setAppSetting(db, 'pin_hash', 'abc123');
    expect(getAppSetting(db, 'pin_hash')).toBe('abc123');
  });

  it('upserts existing key', () => {
    setAppSetting(db, 'pin_hash', 'first');
    setAppSetting(db, 'pin_hash', 'second');
    expect(getAppSetting(db, 'pin_hash')).toBe('second');
  });

  it('deletes a key', () => {
    setAppSetting(db, 'pin_hash', 'abc123');
    deleteAppSetting(db, 'pin_hash');
    expect(getAppSetting(db, 'pin_hash')).toBeNull();
  });

  it('delete on missing key is a no-op', () => {
    expect(() => deleteAppSetting(db, 'pin_hash')).not.toThrow();
  });
});
