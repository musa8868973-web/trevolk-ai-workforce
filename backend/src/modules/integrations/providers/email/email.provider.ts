// backend/src/modules/integrations/providers/email/email.provider.ts
/**
 * Email integration provider: Gmail OAuth2 + SMTP fallback.
 *
 * Responsibilities:
 *  - Build OAuth2 authorisation URL for Gmail.
 *  - Exchange OAuth2 code for tokens and persist credentials.
 *  - Send HTML emails via Gmail API or Nodemailer SMTP.
 *  - Parse inbound email threading headers (In-Reply-To, References).
 */
import { credentialService, type IntegrationCredentials } from '../../services/credential.service';
import { tokenService } from '../../services/token.service';
import { logger } from '@shared/logger';

/** Default system email used when no workspace-specific sender is configured. */
export const DEFAULT_SYSTEM_EMAIL = process.env['DEFAULT_SYSTEM_EMAIL'] || 'trevolk.official@gmail.com';

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  inReplyTo?: string;   // Message-ID for threading
  references?: string;  // Space-separated list of parent message IDs
  fromName?: string;
  fromEmail?: string;
}

export interface GmailOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface ParsedEmailThread {
  messageId: string;
  inReplyTo?: string;
  references: string[];
  from: string;
  subject: string;
  body: string;
  receivedAt: Date;
}

/**
 * Builds the Google OAuth2 consent URL for Gmail access.
 * The state parameter should encode the workspaceId for the callback.
 */
export function buildGmailOAuthUrl(config: GmailOAuthConfig, state: string): string {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'openid',
    'email',
  ].join(' ');

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchanges an OAuth2 authorisation code for access + refresh tokens,
 * persists them encrypted, and returns the safe integration record.
 */
export async function exchangeGmailCode(
  workspaceId: string,
  code: string,
  connectedByUserId: string,
): Promise<void> {
  const clientId = process.env['GOOGLE_CLIENT_ID'];
  const clientSecret = process.env['GOOGLE_CLIENT_SECRET'];
  const redirectUri = process.env['GOOGLE_REDIRECT_URI'];

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google OAuth environment variables not configured');
  }

  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gmail OAuth token exchange failed: ${body}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
  };

  const credentials: IntegrationCredentials = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    scope: data.scope,
  };

  await credentialService.upsertCredentials(
    workspaceId,
    'gmail',
    credentials,
    connectedByUserId,
  );
}

export const emailProvider = {
  /**
   * Sends an email using Gmail API (preferred) or falls back to workspace SMTP.
   */
  async sendEmail(workspaceId: string, message: EmailMessage): Promise<void> {
    const credentials = await credentialService.getCredentials(workspaceId, 'gmail');

    // If OAuth credentials are present, use Gmail API
    if (credentials.accessToken || credentials.refreshToken) {
      await emailProvider._sendViaGmailAPI(workspaceId, message);
    } else if (credentials.smtpHost) {
      await emailProvider._sendViaSMTP(credentials, message);
    } else {
      throw new Error('No email transport configured for this workspace');
    }
  },

  async _sendViaGmailAPI(workspaceId: string, message: EmailMessage): Promise<void> {
    const accessToken = await tokenService.getValidAccessToken(workspaceId, 'gmail');

    const toList = Array.isArray(message.to) ? message.to.join(', ') : message.to;
    const fromName = message.fromName || 'Trevolk AI';
    const fromEmail = message.fromEmail || DEFAULT_SYSTEM_EMAIL;
    const headers = [
      `From: ${fromName} <${fromEmail}>`,
      `To: ${toList}`,
      `Subject: ${message.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      ...(message.inReplyTo ? [`In-Reply-To: ${message.inReplyTo}`] : []),
      ...(message.references ? [`References: ${message.references}`] : []),
    ].join('\r\n');

    const rawEmail = `${headers}\r\n\r\n${message.html}`;
    const encoded = Buffer.from(rawEmail).toString('base64url');

    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encoded }),
      },
    );

    if (!response.ok) {
      const err = await response.text();
      logger.error({ workspaceId, err }, 'Gmail API send failed');
      throw new Error(`Gmail API error: ${err}`);
    }
  },

  async _sendViaSMTP(
    credentials: IntegrationCredentials,
    message: EmailMessage,
  ): Promise<void> {
    // Lazy-load nodemailer to avoid issues when not installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const nodemailer = require('nodemailer') as typeof import('nodemailer');

    const transporter = nodemailer.createTransport({
      host: credentials.smtpHost,
      port: credentials.smtpPort ?? 587,
      secure: (credentials.smtpPort ?? 587) === 465,
      auth: {
        user: credentials.smtpUser,
        pass: credentials.smtpPassword,
      },
    });

    const fromAddr = credentials.smtpUser || DEFAULT_SYSTEM_EMAIL;
    await transporter.sendMail({
      from: fromAddr,
      to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.inReplyTo && { inReplyTo: message.inReplyTo }),
      ...(message.references && { references: message.references }),
    });
  },
};
