import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DriveClient, DriveError } from '../drive';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  } as Response;
}

function binaryResponse(data: Uint8Array, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve({}),
    arrayBuffer: () => Promise.resolve(data.buffer),
  } as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('DriveClient', () => {
  describe('ensureFolder', () => {
    it('returns existing folder ID when found', async () => {
      const client = new DriveClient();
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ files: [{ id: 'folder-123', name: 'Arth' }] }),
      );

      const id = await client.ensureFolder('token-abc');
      expect(id).toBe('folder-123');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toContain('Arth');
    });

    it('creates folder when not found', async () => {
      const client = new DriveClient();
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ files: [] }))
        .mockResolvedValueOnce(jsonResponse({ id: 'new-folder-456' }));

      const id = await client.ensureFolder('token-abc');
      expect(id).toBe('new-folder-456');
      expect(mockFetch).toHaveBeenCalledTimes(2);

      const createCall = mockFetch.mock.calls[1];
      expect(createCall[1].method).toBe('POST');
      expect(JSON.parse(createCall[1].body)).toEqual({
        name: 'Arth',
        mimeType: 'application/vnd.google-apps.folder',
      });
    });

    it('caches folder ID on subsequent calls', async () => {
      const client = new DriveClient();
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ files: [{ id: 'folder-123', name: 'Arth' }] }),
      );

      await client.ensureFolder('token-abc');
      const id2 = await client.ensureFolder('token-abc');
      expect(id2).toBe('folder-123');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('throws DriveError on API failure', async () => {
      const client = new DriveClient();
      mockFetch.mockResolvedValueOnce(jsonResponse({}, 401));

      await expect(client.ensureFolder('bad-token')).rejects.toThrow(DriveError);

      mockFetch.mockResolvedValueOnce(jsonResponse({}, 401));
      await expect(client.ensureFolder('bad-token')).rejects.toThrow('401');
    });
  });

  describe('findFile', () => {
    it('returns file metadata when found', async () => {
      const client = new DriveClient();
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          files: [
            { id: 'file-789', name: 'finance.db', modifiedTime: '2026-05-18T10:00:00Z', size: '1024' },
          ],
        }),
      );

      const file = await client.findFile('token-abc', 'folder-123');
      expect(file).toEqual({
        id: 'file-789',
        name: 'finance.db',
        modifiedTime: '2026-05-18T10:00:00Z',
        size: '1024',
      });
    });

    it('returns null when file not found', async () => {
      const client = new DriveClient();
      mockFetch.mockResolvedValueOnce(jsonResponse({ files: [] }));

      const file = await client.findFile('token-abc', 'folder-123');
      expect(file).toBeNull();
    });
  });

  describe('uploadDatabase', () => {
    it('creates a new file when none exists', async () => {
      const client = new DriveClient();
      const data = new Uint8Array([1, 2, 3]);

      mockFetch
        .mockResolvedValueOnce(jsonResponse({ files: [] }))
        .mockResolvedValueOnce(
          jsonResponse({ id: 'new-file-1', name: 'finance.db', modifiedTime: '2026-05-18T10:00:00Z' }),
        );

      const result = await client.uploadDatabase('token-abc', 'folder-123', data, '2026-05-18T10:00:00Z');
      expect(result.id).toBe('new-file-1');

      const uploadCall = mockFetch.mock.calls[1];
      expect(uploadCall[0]).toContain('uploadType=multipart');
      expect(uploadCall[1].method).toBe('POST');
    });

    it('updates existing file when found', async () => {
      const client = new DriveClient();
      const data = new Uint8Array([1, 2, 3]);

      mockFetch
        .mockResolvedValueOnce(
          jsonResponse({
            files: [{ id: 'existing-file', name: 'finance.db', modifiedTime: '2026-05-17T10:00:00Z' }],
          }),
        )
        .mockResolvedValueOnce(
          jsonResponse({ id: 'existing-file', name: 'finance.db', modifiedTime: '2026-05-18T10:00:00Z' }),
        );

      const result = await client.uploadDatabase('token-abc', 'folder-123', data, '2026-05-18T10:00:00Z');
      expect(result.id).toBe('existing-file');

      const uploadCall = mockFetch.mock.calls[1];
      expect(uploadCall[0]).toContain('existing-file');
      expect(uploadCall[1].method).toBe('PATCH');
    });
  });

  describe('downloadDatabase', () => {
    it('returns file data as Uint8Array', async () => {
      const client = new DriveClient();
      const expected = new Uint8Array([10, 20, 30]);
      mockFetch.mockResolvedValueOnce(binaryResponse(expected));

      const data = await client.downloadDatabase('token-abc', 'file-789');
      expect(data).toEqual(expected);
    });

    it('throws on download failure', async () => {
      const client = new DriveClient();
      mockFetch.mockResolvedValueOnce(binaryResponse(new Uint8Array(), 404));

      await expect(client.downloadDatabase('token-abc', 'file-789')).rejects.toThrow(DriveError);
    });
  });

  describe('getFileMetadata', () => {
    it('returns metadata for a file', async () => {
      const client = new DriveClient();
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          id: 'file-789',
          name: 'finance.db',
          modifiedTime: '2026-05-18T12:00:00Z',
          size: '2048',
        }),
      );

      const meta = await client.getFileMetadata('token-abc', 'file-789');
      expect(meta.modifiedTime).toBe('2026-05-18T12:00:00Z');
      expect(meta.size).toBe('2048');
    });
  });

  describe('resetCache', () => {
    it('clears cached folder and file IDs', async () => {
      const client = new DriveClient();
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ files: [{ id: 'folder-123', name: 'Arth' }] }),
      );

      await client.ensureFolder('token-abc');

      client.resetCache();

      mockFetch.mockResolvedValueOnce(
        jsonResponse({ files: [{ id: 'folder-456', name: 'Arth' }] }),
      );

      const id = await client.ensureFolder('token-abc');
      expect(id).toBe('folder-456');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
