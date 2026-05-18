import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { saveDatabase, loadDatabase, getLastModified } from '../persistence';

beforeEach(() => {
  indexedDB = new IDBFactory();
});

describe('saveDatabase / loadDatabase', () => {
  it('returns null when no data has been saved', async () => {
    const result = await loadDatabase();
    expect(result).toBeNull();
  });

  it('round-trips a Uint8Array through IndexedDB', async () => {
    const original = new Uint8Array([1, 2, 3, 4, 5]);
    await saveDatabase(original);
    const result = await loadDatabase();
    expect(result).not.toBeNull();
    expect(result!.data).toBeInstanceOf(Uint8Array);
    expect(result!.data).toEqual(original);
  });

  it('overwrites previous data on subsequent saves', async () => {
    await saveDatabase(new Uint8Array([1, 2, 3]));
    await saveDatabase(new Uint8Array([4, 5, 6, 7]));
    const result = await loadDatabase();
    expect(result!.data).toEqual(new Uint8Array([4, 5, 6, 7]));
  });
});

describe('lastModified tracking', () => {
  it('returns null when nothing has been saved', async () => {
    const ts = await getLastModified();
    expect(ts).toBeNull();
  });

  it('returns an ISO timestamp after save', async () => {
    await saveDatabase(new Uint8Array([1]));
    const ts = await getLastModified();
    expect(ts).not.toBeNull();
    expect(new Date(ts!).toISOString()).toBe(ts);
  });

  it('updates timestamp on each save', async () => {
    await saveDatabase(new Uint8Array([1]));
    const ts1 = await getLastModified();
    await new Promise((r) => setTimeout(r, 10));
    await saveDatabase(new Uint8Array([2]));
    const ts2 = await getLastModified();
    expect(ts2).not.toBe(ts1);
    expect(new Date(ts2!).getTime()).toBeGreaterThan(new Date(ts1!).getTime());
  });

  it('saveDatabase returns the timestamp', async () => {
    const returned = await saveDatabase(new Uint8Array([1]));
    const stored = await getLastModified();
    expect(returned).toBe(stored);
  });

  it('loadDatabase returns lastModified alongside data', async () => {
    const returned = await saveDatabase(new Uint8Array([10, 20]));
    const result = await loadDatabase();
    expect(result!.lastModified).toBe(returned);
  });
});

describe('full sql.js round-trip', () => {
  it('saves and restores a sql.js database', async () => {
    const initSqlJs = (await import('sql.js')).default;
    const SQL = await initSqlJs();

    const db1 = new SQL.Database();
    db1.run('CREATE TABLE test (id INTEGER, value TEXT)');
    db1.run("INSERT INTO test VALUES (1, 'hello')");
    const exported = db1.export();
    db1.close();

    await saveDatabase(exported);

    const result = await loadDatabase();
    expect(result).not.toBeNull();
    const db2 = new SQL.Database(result!.data);
    const rows = db2.exec('SELECT * FROM test');
    expect(rows[0].values).toEqual([[1, 'hello']]);
    db2.close();
  });
});
