import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { SyncManager } from '../sync-manager';
import { GoogleAuth } from '../auth';
import { DriveClient } from '../drive';
import { saveDatabase } from '@/db/persistence';

vi.mock('../auth');
vi.mock('../drive');

let auth: GoogleAuth;
let drive: DriveClient;
let manager: SyncManager;

async function seedLocal(data = new Uint8Array([10, 20, 30])): Promise<void> {
  await saveDatabase(data);
}

beforeEach(() => {
  indexedDB = new IDBFactory();

  auth = new GoogleAuth();
  drive = new DriveClient();

  (auth.isSignedIn as unknown as MockInstance).mockReturnValue(true);
  (auth.getAccessToken as unknown as MockInstance).mockReturnValue('mock-token');
  (auth.refreshToken as unknown as MockInstance).mockResolvedValue('mock-token');

  (drive.ensureFolder as unknown as MockInstance).mockResolvedValue('folder-123');
  (drive.findFile as unknown as MockInstance).mockResolvedValue(null);
  (drive.uploadDatabase as unknown as MockInstance).mockResolvedValue({
    id: 'file-1',
    name: 'finance.db',
    modifiedTime: '2026-05-18T10:00:00Z',
  });
  (drive.downloadDatabase as unknown as MockInstance).mockResolvedValue(new Uint8Array([1, 2, 3]));

  Object.defineProperty(globalThis, 'navigator', {
    value: { onLine: true },
    writable: true,
    configurable: true,
  });

  manager = new SyncManager(auth, drive);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('SyncManager', () => {
  describe('sync — conflict resolution', () => {
    it('uploads when local is newer than remote', async () => {
      await seedLocal();

      (drive.findFile as unknown as MockInstance).mockResolvedValue({
        id: 'file-1',
        name: 'finance.db',
        modifiedTime: '2020-01-01T00:00:00Z',
      });

      await manager.sync();

      expect(drive.uploadDatabase).toHaveBeenCalled();
      expect(drive.downloadDatabase).not.toHaveBeenCalled();
      expect(manager.getState().direction).toBe('upload');
    });

    it('downloads when remote is newer than local', async () => {
      await seedLocal();

      const replacer = vi.fn();
      manager.setDatabaseReplacer(replacer);

      (drive.findFile as unknown as MockInstance).mockResolvedValue({
        id: 'file-1',
        name: 'finance.db',
        modifiedTime: '2099-01-01T00:00:00Z',
      });

      await manager.sync();

      expect(drive.downloadDatabase).toHaveBeenCalled();
      expect(replacer).toHaveBeenCalledWith(new Uint8Array([1, 2, 3]));
      expect(manager.getState().direction).toBe('download');
    });

    it('does nothing when timestamps are equal', async () => {
      const ts = '2026-05-18T10:00:00.000Z';

      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(ts);
      await seedLocal();
      vi.restoreAllMocks();

      (drive.findFile as unknown as MockInstance).mockResolvedValue({
        id: 'file-1',
        name: 'finance.db',
        modifiedTime: ts,
      });

      await manager.sync();

      expect(drive.uploadDatabase).not.toHaveBeenCalled();
      expect(drive.downloadDatabase).not.toHaveBeenCalled();
      expect(manager.getState().direction).toBe('none');
    });

    it('uploads when remote file does not exist', async () => {
      await seedLocal();
      (drive.findFile as unknown as MockInstance).mockResolvedValue(null);

      await manager.sync();

      expect(drive.uploadDatabase).toHaveBeenCalled();
      expect(manager.getState().direction).toBe('upload');
    });
  });

  describe('scheduleUpload — debounce', () => {
    it('uploads after 30 seconds', async () => {
      vi.useFakeTimers();
      const loadSpy = vi.spyOn(await import('@/db/persistence'), 'loadDatabase');
      loadSpy.mockResolvedValue({ data: new Uint8Array([1, 2, 3]), lastModified: '2026-05-18T10:00:00Z' });

      manager.scheduleUpload();

      expect(drive.uploadDatabase).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(30_000);

      expect(drive.uploadDatabase).toHaveBeenCalledTimes(1);
      loadSpy.mockRestore();
    });

    it('resets timer on subsequent calls', async () => {
      vi.useFakeTimers();
      const loadSpy = vi.spyOn(await import('@/db/persistence'), 'loadDatabase');
      loadSpy.mockResolvedValue({ data: new Uint8Array([1, 2, 3]), lastModified: '2026-05-18T10:00:00Z' });

      manager.scheduleUpload();
      await vi.advanceTimersByTimeAsync(20_000);

      manager.scheduleUpload();
      await vi.advanceTimersByTimeAsync(20_000);

      expect(drive.uploadDatabase).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(10_000);

      expect(drive.uploadDatabase).toHaveBeenCalledTimes(1);
      loadSpy.mockRestore();
    });

    it('does not schedule if not signed in', () => {
      vi.useFakeTimers();
      (auth.isSignedIn as unknown as MockInstance).mockReturnValue(false);

      manager.scheduleUpload();

      vi.advanceTimersByTime(30_000);
      expect(drive.uploadDatabase).not.toHaveBeenCalled();
    });

    it('does not schedule if offline', () => {
      vi.useFakeTimers();
      Object.defineProperty(globalThis, 'navigator', {
        value: { onLine: false },
        writable: true,
        configurable: true,
      });

      manager.scheduleUpload();

      vi.advanceTimersByTime(30_000);
      expect(drive.uploadDatabase).not.toHaveBeenCalled();
    });
  });

  describe('sync — not signed in', () => {
    it('skips sync when not signed in', async () => {
      (auth.isSignedIn as unknown as MockInstance).mockReturnValue(false);

      await manager.sync();

      expect(drive.ensureFolder).not.toHaveBeenCalled();
    });
  });

  describe('sync — offline', () => {
    it('sets status to offline when not connected', async () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { onLine: false },
        writable: true,
        configurable: true,
      });

      await manager.sync();

      expect(manager.getState().status).toBe('offline');
      expect(drive.ensureFolder).not.toHaveBeenCalled();
    });
  });

  describe('sync — error handling', () => {
    it('sets error state on drive failure', async () => {
      await seedLocal();
      (drive.ensureFolder as unknown as MockInstance).mockRejectedValue(new Error('Network error'));

      await manager.sync();

      expect(manager.getState().status).toBe('error');
      expect(manager.getState().error).toBe('Network error');
    });

    it('refreshes token when getAccessToken returns null', async () => {
      await seedLocal();
      (auth.getAccessToken as unknown as MockInstance).mockReturnValue(null);
      (auth.refreshToken as unknown as MockInstance).mockResolvedValue('new-token');
      (drive.findFile as unknown as MockInstance).mockResolvedValue(null);

      await manager.sync();

      expect(auth.refreshToken).toHaveBeenCalled();
      expect(drive.ensureFolder).toHaveBeenCalledWith('new-token');
    });
  });

  describe('concurrent sync prevention', () => {
    it('queues a sync when one is already in progress', async () => {
      await seedLocal();

      let resolveFirst: () => void;
      const firstSyncBlock = new Promise<void>((r) => {
        resolveFirst = r;
      });

      (drive.ensureFolder as unknown as MockInstance).mockImplementationOnce(async () => {
        await firstSyncBlock;
        return 'folder-123';
      });

      const sync1 = manager.sync();

      (drive.findFile as unknown as MockInstance).mockResolvedValue(null);
      const sync2 = manager.sync();

      resolveFirst!();
      await sync1;
      await sync2;

      expect(drive.ensureFolder).toHaveBeenCalledTimes(2);
    });
  });

  describe('onStateChange', () => {
    it('notifies listeners of state changes', async () => {
      await seedLocal();
      const listener = vi.fn();
      manager.onStateChange(listener);

      (drive.findFile as unknown as MockInstance).mockResolvedValue(null);

      await manager.sync();

      expect(listener).toHaveBeenCalled();
      const calls = listener.mock.calls;
      expect(calls[0][0].status).toBe('syncing');
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall.status).toBe('idle');
    });

    it('returns an unsubscribe function', async () => {
      const listener = vi.fn();
      const unsubscribe = manager.onStateChange(listener);
      unsubscribe();

      await seedLocal();
      (drive.findFile as unknown as MockInstance).mockResolvedValue(null);
      await manager.sync();

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
