const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const SESSION_KEY = 'arth_google_session';
const HINT_KEY = 'arth_google_hint';

type AuthChangeCallback = (isSignedIn: boolean) => void;

export class GoogleAuth {
  private tokenClient: TokenClient | null = null;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private listeners: AuthChangeCallback[] = [];
  private initPromiseResolve: ((value: string) => void) | null = null;
  private initPromiseReject: ((reason: Error) => void) | null = null;

  init(clientId: string): void {
    if (typeof google === 'undefined') {
      throw new Error('Google Identity Services script not loaded');
    }

    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) {
          this.clearToken();
          if (this.initPromiseReject) {
            this.initPromiseReject(new Error(response.error_description || response.error));
            this.initPromiseReject = null;
            this.initPromiseResolve = null;
          }
          return;
        }

        this.accessToken = response.access_token;
        this.tokenExpiresAt = Date.now() + response.expires_in * 1000;
        sessionStorage.setItem(SESSION_KEY, '1');
        this.fetchAndStoreHint(response.access_token);
        this.notifyListeners(true);

        if (this.initPromiseResolve) {
          this.initPromiseResolve(response.access_token);
          this.initPromiseResolve = null;
          this.initPromiseReject = null;
        }
      },
    });
  }

  hadPreviousSession(): boolean {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }

  tryRestoreSession(): Promise<string> {
    if (!this.tokenClient) {
      return Promise.reject(new Error('GoogleAuth not initialized. Call init() first.'));
    }

    const hint = sessionStorage.getItem(HINT_KEY) ?? undefined;
    return new Promise<string>((resolve, reject) => {
      this.initPromiseResolve = resolve;
      this.initPromiseReject = reject;
      this.tokenClient!.requestAccessToken({ prompt: '', hint });
    });
  }

  signIn(): Promise<string> {
    if (!this.tokenClient) {
      return Promise.reject(new Error('GoogleAuth not initialized. Call init() first.'));
    }

    return new Promise<string>((resolve, reject) => {
      this.initPromiseResolve = resolve;
      this.initPromiseReject = reject;
      this.tokenClient!.requestAccessToken();
    });
  }

  signOut(): Promise<void> {
    return new Promise<void>((resolve) => {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(HINT_KEY);
      if (this.accessToken) {
        google.accounts.oauth2.revoke(this.accessToken, () => {
          this.clearToken();
          resolve();
        });
      } else {
        this.clearToken();
        resolve();
      }
    });
  }

  getAccessToken(): string | null {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }
    return null;
  }

  isSignedIn(): boolean {
    return this.getAccessToken() !== null;
  }

  async refreshToken(): Promise<string> {
    return this.signIn();
  }

  onAuthChange(callback: AuthChangeCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private fetchAndStoreHint(accessToken: string): void {
    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((info: { email?: string }) => {
        if (info.email) sessionStorage.setItem(HINT_KEY, info.email);
      })
      .catch(() => {});
  }

  private clearToken(): void {
    this.accessToken = null;
    this.tokenExpiresAt = 0;
    this.notifyListeners(false);
  }

  private notifyListeners(isSignedIn: boolean): void {
    for (const listener of this.listeners) {
      listener(isSignedIn);
    }
  }
}
