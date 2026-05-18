import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoogleAuth } from '../auth';

let mockRequestAccessToken: ReturnType<typeof vi.fn>;
let mockRevoke: ReturnType<typeof vi.fn>;
let capturedCallback: (response: TokenResponse) => void;

const sessionStore = new Map<string, string>();
(globalThis as Record<string, unknown>).sessionStorage = {
  getItem: (key: string) => sessionStore.get(key) ?? null,
  setItem: (key: string, value: string) => sessionStore.set(key, value),
  removeItem: (key: string) => sessionStore.delete(key),
  clear: () => sessionStore.clear(),
};

beforeEach(() => {
  sessionStore.clear();
  mockRequestAccessToken = vi.fn();
  mockRevoke = vi.fn((_token: string, callback?: (response: RevokeResponse) => void) => {
    if (callback) callback({ successful: true });
  });

  (globalThis as Record<string, unknown>).google = {
    accounts: {
      oauth2: {
        initTokenClient: (config: TokenClientConfig) => {
          capturedCallback = config.callback;
          return { requestAccessToken: mockRequestAccessToken };
        },
        revoke: mockRevoke,
        hasGrantedAllScopes: () => true,
      },
    },
  };
});

describe('GoogleAuth', () => {
  describe('init', () => {
    it('initializes the token client', () => {
      const auth = new GoogleAuth();
      auth.init('test-client-id');
      expect(auth.isSignedIn()).toBe(false);
      expect(auth.getAccessToken()).toBeNull();
    });

    it('throws if GIS script is not loaded', () => {
      delete (globalThis as Record<string, unknown>).google;
      const auth = new GoogleAuth();
      expect(() => auth.init('test-client-id')).toThrow('Google Identity Services script not loaded');
    });
  });

  describe('signIn', () => {
    it('requests an access token and resolves with it', async () => {
      const auth = new GoogleAuth();
      auth.init('test-client-id');

      mockRequestAccessToken.mockImplementation(() => {
        capturedCallback({
          access_token: 'mock-token-123',
          expires_in: 3600,
          scope: 'https://www.googleapis.com/auth/drive.file',
          token_type: 'Bearer',
        });
      });

      const token = await auth.signIn();
      expect(token).toBe('mock-token-123');
      expect(auth.isSignedIn()).toBe(true);
      expect(auth.getAccessToken()).toBe('mock-token-123');
    });

    it('rejects when the response has an error', async () => {
      const auth = new GoogleAuth();
      auth.init('test-client-id');

      mockRequestAccessToken.mockImplementation(() => {
        capturedCallback({
          access_token: '',
          expires_in: 0,
          scope: '',
          token_type: '',
          error: 'access_denied',
          error_description: 'User denied access',
        });
      });

      await expect(auth.signIn()).rejects.toThrow('User denied access');
      expect(auth.isSignedIn()).toBe(false);
    });

    it('rejects if not initialized', async () => {
      const auth = new GoogleAuth();
      await expect(auth.signIn()).rejects.toThrow('GoogleAuth not initialized');
    });
  });

  describe('signOut', () => {
    it('revokes the token and clears state', async () => {
      const auth = new GoogleAuth();
      auth.init('test-client-id');

      mockRequestAccessToken.mockImplementation(() => {
        capturedCallback({
          access_token: 'mock-token-123',
          expires_in: 3600,
          scope: '',
          token_type: 'Bearer',
        });
      });

      await auth.signIn();
      expect(auth.isSignedIn()).toBe(true);

      await auth.signOut();
      expect(auth.isSignedIn()).toBe(false);
      expect(auth.getAccessToken()).toBeNull();
      expect(mockRevoke).toHaveBeenCalledWith('mock-token-123', expect.any(Function));
    });

    it('resolves even if no token exists', async () => {
      const auth = new GoogleAuth();
      auth.init('test-client-id');
      await auth.signOut();
      expect(auth.isSignedIn()).toBe(false);
    });
  });

  describe('getAccessToken', () => {
    it('returns null when token is expired', async () => {
      const auth = new GoogleAuth();
      auth.init('test-client-id');

      mockRequestAccessToken.mockImplementation(() => {
        capturedCallback({
          access_token: 'mock-token-123',
          expires_in: 0,
          scope: '',
          token_type: 'Bearer',
        });
      });

      await auth.signIn();
      expect(auth.getAccessToken()).toBeNull();
    });
  });

  describe('onAuthChange', () => {
    it('notifies listeners on sign-in', async () => {
      const auth = new GoogleAuth();
      auth.init('test-client-id');

      const listener = vi.fn();
      auth.onAuthChange(listener);

      mockRequestAccessToken.mockImplementation(() => {
        capturedCallback({
          access_token: 'mock-token-123',
          expires_in: 3600,
          scope: '',
          token_type: 'Bearer',
        });
      });

      await auth.signIn();
      expect(listener).toHaveBeenCalledWith(true);
    });

    it('notifies listeners on sign-out', async () => {
      const auth = new GoogleAuth();
      auth.init('test-client-id');

      mockRequestAccessToken.mockImplementation(() => {
        capturedCallback({
          access_token: 'mock-token-123',
          expires_in: 3600,
          scope: '',
          token_type: 'Bearer',
        });
      });

      await auth.signIn();

      const listener = vi.fn();
      auth.onAuthChange(listener);

      await auth.signOut();
      expect(listener).toHaveBeenCalledWith(false);
    });

    it('returns an unsubscribe function', async () => {
      const auth = new GoogleAuth();
      auth.init('test-client-id');

      const listener = vi.fn();
      const unsubscribe = auth.onAuthChange(listener);
      unsubscribe();

      mockRequestAccessToken.mockImplementation(() => {
        capturedCallback({
          access_token: 'mock-token-123',
          expires_in: 3600,
          scope: '',
          token_type: 'Bearer',
        });
      });

      await auth.signIn();
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
