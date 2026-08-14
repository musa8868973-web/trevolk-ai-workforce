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

describe('Sales Employee Domain API', () => {
  describe('POST /api/v1/sales-employees/qualify-lead', () => {
    it('qualifies a lead as HOT and updates lead status & score', async () => {
      const owner = await registerUser('qualify-hot');

      // Create a lead first
      const leadRes = await request(app)
        .post('/api/v1/leads')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({ status: 'NEW' });

      expect(leadRes.status).toBe(201);
      const leadId = leadRes.body.data.id;

      const response = await request(app)
        .post('/api/v1/sales-employees/qualify-lead')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({
          leadId,
          fit: 'Strong match',
          budget: 'Approved high budget',
          timeline: 'Immediate implementation',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.score).toBe('HOT');
      expect(response.body.data.recommendedAction).toBe('BOOK_MEETING');
      expect(response.body.data.lead.status).toBe('QUALIFIED');
    });

    it('qualifies a lead as COLD for poor fit', async () => {
      const owner = await registerUser('qualify-cold');

      const leadRes = await request(app)
        .post('/api/v1/leads')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({ status: 'NEW' });

      const leadId = leadRes.body.data.id;

      const response = await request(app)
        .post('/api/v1/sales-employees/qualify-lead')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({
          leadId,
          fit: 'Poor fit / invalid domain',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.score).toBe('COLD');
      expect(response.body.data.lead.status).toBe('DISQUALIFIED');
    });
  });

  describe('POST /api/v1/sales-employees/book-appointment', () => {
    it('books an appointment for a qualified lead', async () => {
      const owner = await registerUser('sales-book');

      // Create AI Employee
      const empRes = await request(app)
        .post('/api/v1/ai-employees')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({ employeeType: 'SALES', name: 'Sales Bot' });
      const aiEmployeeId = empRes.body.data.id;

      // Create Lead
      const leadRes = await request(app)
        .post('/api/v1/leads')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({ status: 'QUALIFIED' });
      const leadId = leadRes.body.data.id;

      const startTime = new Date(Date.now() + 86400000).toISOString();
      const endTime = new Date(Date.now() + 90000000).toISOString();

      const response = await request(app)
        .post('/api/v1/sales-employees/book-appointment')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({
          leadId,
          aiEmployeeId,
          startTime,
          endTime,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.leadId).toBe(leadId);
      expect(response.body.data.aiEmployeeId).toBe(aiEmployeeId);
      expect(response.body.data.status).toBe('SCHEDULED');
    });
  });
});
