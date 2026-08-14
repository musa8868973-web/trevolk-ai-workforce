// backend/src/modules/integrations/services/credential.service.ts
/**
 * CRUD service for storing/retrieving encrypted integration credentials.
 *
 * Uses the existing `Integration` Prisma model where:
 *   - `credentialsEncrypted` stores an AES-256-GCM encrypted JSON blob.
 *   - `provider` is a unique key per workspace (enforced by @@unique).
 */
import { prisma } from '@database/index';
import { encryptJSON, decryptJSON } from '@common/crypto';
import { NotFoundError } from '@common/errors';
import type { Integration } from '@prisma/client';

export type IntegrationProvider =
  | 'whatsapp'
  | 'gmail'
  | 'google_calendar'
  | 'stripe'
  | 'generic_webhook';

export type IntegrationStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'PENDING_AUTH';

export interface IntegrationCredentials {
  // OAuth providers
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string; // ISO-8601
  scope?: string;
  // API key providers
  apiKey?: string;
  webhookSecret?: string;
  // WhatsApp specific
  phoneNumberId?: string;
  wabaId?: string;
  // SMTP fallback
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  // Stripe
  stripeAccountId?: string;
  // Generic
  [key: string]: unknown;
}

export interface SafeIntegration {
  id: string;
  workspaceId: string;
  provider: string;
  status: string;
  /** Credentials are never returned; only a boolean indicating they exist */
  hasCredentials: boolean;
  metadata: Record<string, unknown> | null;
  connectedByUserId: string | null;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function toSafe(integration: Integration): SafeIntegration {
  return {
    id: integration.id,
    workspaceId: integration.workspaceId,
    provider: integration.provider,
    status: integration.status,
    hasCredentials: !!integration.credentialsEncrypted,
    metadata: integration.metadata
      ? (JSON.parse(integration.metadata) as Record<string, unknown>)
      : null,
    connectedByUserId: integration.connectedByUserId,
    lastSyncedAt: integration.lastSyncedAt,
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt,
  };
}

export const credentialService = {
  /** Upserts an integration record with encrypted credentials. */
  async upsertCredentials(
    workspaceId: string,
    provider: IntegrationProvider,
    credentials: IntegrationCredentials,
    connectedByUserId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<SafeIntegration> {
    const credentialsEncrypted = encryptJSON(credentials);

    const integration = await prisma.integration.upsert({
      where: { workspaceId_provider: { workspaceId, provider } },
      create: {
        workspaceId,
        provider,
        status: 'CONNECTED',
        credentialsEncrypted,
        connectedByUserId: connectedByUserId ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
      update: {
        status: 'CONNECTED',
        credentialsEncrypted,
        ...(connectedByUserId && { connectedByUserId }),
        ...(metadata && { metadata: JSON.stringify(metadata) }),
        lastSyncedAt: new Date(),
      },
    });

    return toSafe(integration);
  },

  /** Retrieves decrypted credentials for internal use (never exposed to API). */
  async getCredentials(
    workspaceId: string,
    provider: IntegrationProvider,
  ): Promise<IntegrationCredentials> {
    const integration = await prisma.integration.findUnique({
      where: { workspaceId_provider: { workspaceId, provider } },
    });

    if (!integration || !integration.credentialsEncrypted) {
      throw new NotFoundError(
        `No ${provider} integration credentials found for this workspace`,
      );
    }

    return decryptJSON<IntegrationCredentials>(integration.credentialsEncrypted);
  },

  /** Returns the safe (no-secret) integration record or null. */
  async findIntegration(
    workspaceId: string,
    provider: IntegrationProvider,
  ): Promise<SafeIntegration | null> {
    const integration = await prisma.integration.findUnique({
      where: { workspaceId_provider: { workspaceId, provider } },
    });
    return integration ? toSafe(integration) : null;
  },

  /** Lists all integrations for a workspace (safe, no credentials). */
  async listIntegrations(workspaceId: string): Promise<SafeIntegration[]> {
    const integrations = await prisma.integration.findMany({
      where: { workspaceId },
      orderBy: { provider: 'asc' },
    });
    return integrations.map(toSafe);
  },

  /** Sets the integration status (e.g., to ERROR or DISCONNECTED). */
  async updateStatus(
    workspaceId: string,
    provider: IntegrationProvider,
    status: IntegrationStatus,
  ): Promise<SafeIntegration> {
    const integration = await prisma.integration.upsert({
      where: { workspaceId_provider: { workspaceId, provider } },
      create: { workspaceId, provider, status },
      update: { status },
    });
    return toSafe(integration);
  },

  /** Disconnects and wipes credentials for a provider. */
  async disconnect(workspaceId: string, provider: IntegrationProvider): Promise<void> {
    await prisma.integration.upsert({
      where: { workspaceId_provider: { workspaceId, provider } },
      create: { workspaceId, provider, status: 'DISCONNECTED' },
      update: {
        status: 'DISCONNECTED',
        credentialsEncrypted: null,
        lastSyncedAt: null,
      },
    });
  },
};
