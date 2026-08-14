jest.mock('@database/index', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createPrismaMock } = require('../helpers/prisma-mock');
  const prisma = createPrismaMock();
  return {
    prisma,
    disconnectPrisma: jest.fn(),
    isDatabaseReachable: jest.fn().mockResolvedValue(true),
  };
});

import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();
const VALID_PASSWORD = 'correctHorseBattery9';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@example.com`;
}

async function registerUser(prefix: string) {
  const email = uniqueEmail(prefix);
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password: VALID_PASSWORD, name: prefix });

  return {
    email,
    accessToken: response.body.data.tokens.accessToken as string,
    organizationId: response.body.data.workspace.organizationId as string,
    workspaceId: response.body.data.workspace.workspaceId as string,
  };
}

function authed(token: string, workspaceId: string) {
  return { Authorization: `Bearer ${token}`, 'X-Workspace-Id': workspaceId };
}

describe('Support Employee Domain API', () => {
  describe('POST /api/v1/support-employees/answer-faq', () => {
    it('returns an answer if grounded knowledge is available, or recommends escalation', async () => {
      const owner = await registerUser('support-faq');

      const response = await request(app)
        .post('/api/v1/support-employees/answer-faq')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({
          question: 'What are your working hours and refund policies?',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('POST /api/v1/support-employees/escalate', () => {
    it('escalates a conversation to human support', async () => {
      const owner = await registerUser('support-escalate');

      // Create conversation
      const convRes = await request(app)
        .post('/api/v1/conversations')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({ channel: 'WEB_CHAT' });

      expect(convRes.status).toBe(201);
      const conversationId = convRes.body.data.id;

      const response = await request(app)
        .post('/api/v1/support-employees/escalate')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({
          conversationId,
          reason: 'Customer requested human agent for custom discount',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.conversation.status).toBe('ESCALATED');
      expect(response.body.data.escalationNote.isInternalNote).toBe(true);
    });
  });
});
