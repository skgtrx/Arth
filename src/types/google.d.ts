interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
}

interface TokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: TokenResponse) => void;
  error_callback?: (error: { type: string; message: string }) => void;
  prompt?: '' | 'none' | 'consent' | 'select_account';
  login_hint?: string;
}

interface OverridableTokenClientConfig {
  prompt?: string;
  hint?: string;
  login_hint?: string;
}

interface TokenClient {
  requestAccessToken(overrideConfig?: OverridableTokenClientConfig): void;
}

interface RevokeResponse {
  successful: boolean;
  error?: string;
}

interface Google {
  accounts: {
    oauth2: {
      initTokenClient(config: TokenClientConfig): TokenClient;
      revoke(accessToken: string, callback?: (response: RevokeResponse) => void): void;
      hasGrantedAllScopes(tokenResponse: TokenResponse, ...scopes: string[]): boolean;
    };
  };
}

declare const google: Google;
