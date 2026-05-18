const DB_NAME = 'arth-db';
const STORE_NAME = 'persistence';
const RECORD_KEY = 'main';

interface PersistedRecord {
  data: Uint8Array;
  lastModified: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDatabase(data: Uint8Array): Promise<string> {
  const idb = await openDatabase();
  const lastModified = new Date().toISOString();
  const record: PersistedRecord = { data, lastModified };
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(record, RECORD_KEY);
    tx.oncomplete = () => {
      idb.close();
      resolve(lastModified);
    };
    tx.onerror = () => {
      idb.close();
      reject(tx.error);
    };
  });
}

export async function loadDatabase(): Promise<{ data: Uint8Array; lastModified: string } | null> {
  const idb = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(RECORD_KEY);
    request.onsuccess = () => {
      idb.close();
      const record = request.result as PersistedRecord | undefined;
      resolve(record ? { data: record.data, lastModified: record.lastModified } : null);
    };
    request.onerror = () => {
      idb.close();
      reject(request.error);
    };
  });
}

export async function getLastModified(): Promise<string | null> {
  const result = await loadDatabase();
  return result?.lastModified ?? null;
}
