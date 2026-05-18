const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const FOLDER_NAME = 'Arth';
const FILE_NAME = 'finance.db';
const BOUNDARY = '----ArthSyncBoundary';

export interface DriveFileMetadata {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
}

export class DriveClient {
  private folderId: string | null = null;
  private fileId: string | null = null;

  async ensureFolder(accessToken: string): Promise<string> {
    if (this.folderId) return this.folderId;

    const query = `name='${FOLDER_NAME}' and mimeType='${FOLDER_MIME}' and trashed=false`;
    const searchUrl = `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id,name)&spaces=drive`;

    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!searchRes.ok) {
      throw new DriveError('Failed to search for folder', searchRes.status);
    }

    const searchData = await searchRes.json();

    if (searchData.files && searchData.files.length > 0) {
      this.folderId = searchData.files[0].id;
      return this.folderId!;
    }

    const createRes = await fetch(`${DRIVE_API}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: FOLDER_MIME,
      }),
    });

    if (!createRes.ok) {
      throw new DriveError('Failed to create folder', createRes.status);
    }

    const createData = await createRes.json();
    this.folderId = createData.id;
    return this.folderId!;
  }

  async findFile(accessToken: string, folderId: string): Promise<DriveFileMetadata | null> {
    const query = `name='${FILE_NAME}' and '${folderId}' in parents and trashed=false`;
    const url = `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime,size)&spaces=drive`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new DriveError('Failed to search for file', res.status);
    }

    const data = await res.json();

    if (data.files && data.files.length > 0) {
      const file = data.files[0];
      this.fileId = file.id;
      return file as DriveFileMetadata;
    }

    return null;
  }

  async uploadDatabase(
    accessToken: string,
    folderId: string,
    data: Uint8Array,
    localModifiedTime: string,
  ): Promise<DriveFileMetadata> {
    const existingFile = this.fileId ? { id: this.fileId } : await this.findFile(accessToken, folderId);

    if (existingFile) {
      return this.updateFile(accessToken, existingFile.id, data, localModifiedTime);
    }

    return this.createFile(accessToken, folderId, data, localModifiedTime);
  }

  async downloadDatabase(accessToken: string, fileId: string): Promise<Uint8Array> {
    const url = `${DRIVE_API}/files/${fileId}?alt=media`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new DriveError('Failed to download file', res.status);
    }

    const buffer = await res.arrayBuffer();
    return new Uint8Array(buffer);
  }

  async getFileMetadata(accessToken: string, fileId: string): Promise<DriveFileMetadata> {
    const url = `${DRIVE_API}/files/${fileId}?fields=id,name,modifiedTime,size`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new DriveError('Failed to get file metadata', res.status);
    }

    return (await res.json()) as DriveFileMetadata;
  }

  resetCache(): void {
    this.folderId = null;
    this.fileId = null;
  }

  private async createFile(
    accessToken: string,
    folderId: string,
    data: Uint8Array,
    localModifiedTime: string,
  ): Promise<DriveFileMetadata> {
    const metadata = JSON.stringify({
      name: FILE_NAME,
      parents: [folderId],
      modifiedTime: localModifiedTime,
    });

    const body = buildMultipartBody(metadata, data);

    const res = await fetch(
      `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,name,modifiedTime,size`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${BOUNDARY}`,
        },
        body,
      },
    );

    if (!res.ok) {
      throw new DriveError('Failed to create file', res.status);
    }

    const result = (await res.json()) as DriveFileMetadata;
    this.fileId = result.id;
    return result;
  }

  private async updateFile(
    accessToken: string,
    fileId: string,
    data: Uint8Array,
    localModifiedTime: string,
  ): Promise<DriveFileMetadata> {
    const metadata = JSON.stringify({
      modifiedTime: localModifiedTime,
    });

    const body = buildMultipartBody(metadata, data);

    const res = await fetch(
      `${DRIVE_UPLOAD_API}/files/${fileId}?uploadType=multipart&fields=id,name,modifiedTime,size`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${BOUNDARY}`,
        },
        body,
      },
    );

    if (!res.ok) {
      throw new DriveError('Failed to update file', res.status);
    }

    return (await res.json()) as DriveFileMetadata;
  }
}

function buildMultipartBody(metadataJson: string, fileData: Uint8Array): Blob {
  const metadataPart = `--${BOUNDARY}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadataJson}\r\n`;
  const closingBoundary = `\r\n--${BOUNDARY}--`;
  const binaryHeader = `--${BOUNDARY}\r\nContent-Type: application/x-sqlite3\r\n\r\n`;

  const arrayBuffer = fileData.buffer.slice(fileData.byteOffset, fileData.byteOffset + fileData.byteLength) as ArrayBuffer;
  return new Blob([metadataPart, binaryHeader, arrayBuffer, closingBoundary]);
}

export class DriveError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(`${message} (HTTP ${status})`);
    this.name = 'DriveError';
    this.status = status;
  }
}
