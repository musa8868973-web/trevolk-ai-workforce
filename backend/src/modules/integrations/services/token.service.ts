// backend/src/modules/integrations/services/token.service.ts
/**
 * OAuth token refresh and expiry management for Google OAuth2 integrations
 * (Gmail and Google Calendar). Automatically renews access tokens before
 * they expire so downstream provider calls never fail with 401.
 */
import { credentialService, type IntegrationProvider } from './credential.service';

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 minutes before expiry

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  scope?: string;
}

export const tokenService = {
  /**
   * Returns a valid access token for the given OAuth provider.
   * If the stored token is expired (or will expire within the buffer window),
   * it triggers a refresh and persists the new credentials automatically.
   */
  async getValidAccessToken(
    workspaceId: string,
    provider: IntegrationProvider,
  ): Promise<string> {
    const credentials = await credentialService.getCredentials(workspaceId, provider);

    if (!credentials.accessToken) {
      throw new Error(`No access token stored for ${provider} integration`);
    }

    const expiresAt = credentials.tokenExpiresAt
      ? new Date(credentials.tokenExpiresAt).getTime()
      : null;

    const isExpiredOrExpiring =
      expiresAt !== null && Date.now() + TOKEN_EXPIRY_BUFFER_MS >= expiresAt;

    if (!isExpiredOrExpiring) {
      return credentials.accessToken;
    }

    // Token needs refresh
    if (!credentials.refreshToken) {
      throw new Error(
        `Access token for ${provider} expired and no refresh token is available. ` +
          'Please re-authorise the integration.',
      );
    }

    const refreshed = await tokenService._refreshGoogleToken(
      credentials.refreshToken,
    );

    // Persist refreshed tokens
    await credentialService.upsertCredentials(workspaceId, provider, {
      ...credentials,
      accessToken: refreshed.accessToken,
      tokenExpiresAt: refreshed.tokenExpiresAt,
    });

    return refreshed.accessToken;
  },

  /**
   * Internal: exchanges a refresh token for a new access token using the
   * Google OAuth2 token endpoint.
   *
   * @internal
   */
  async _refreshGoogleToken(refreshToken: string): Promise<Pick<OAuthTokens, 'accessToken' | 'tokenExpiresAt'>> {
    const clientId = process.env['GOOGLE_CLIENT_ID'];
    const clientSecret = process.env['GOOGLE_CLIENT_SECRET'];

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) not configured');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Google token refresh failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };

    const tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

    return {
      accessToken: data.access_token,
      tokenExpiresAt,
    };
  },
};
