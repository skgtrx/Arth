const SCOPES = 'https://www.googleapis.com/auth/drive.file';

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
          this.accessToken = null;
          this.tokenExpiresAt = 0;
          this.notifyListeners(false);
          if (this.initPromiseReject) {
            this.initPromiseReject(new Error(response.error_description || response.error));
            this.initPromiseReject = null;
            this.initPromiseResolve = null;
          }
          return;
        }

        this.accessToken = response.access_token;
        this.tokenExpiresAt = Date.now() + response.expires_in * 1000;
        this.notifyListeners(true);

        if (this.initPromiseResolve) {
          this.initPromiseResolve(response.access_token);
          this.initPromiseResolve = null;
          this.initPromiseReject = null;
        }
      },
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
      if (this.accessToken) {
        google.accounts.oauth2.revoke(this.accessToken, () => {
          this.accessToken = null;
          this.tokenExpiresAt = 0;
          this.notifyListeners(false);
          resolve();
        });
      } else {
        this.accessToken = null;
        this.tokenExpiresAt = 0;
        this.notifyListeners(false);
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

  private notifyListeners(isSignedIn: boolean): void {
    for (const listener of this.listeners) {
      listener(isSignedIn);
    }
  }
}
