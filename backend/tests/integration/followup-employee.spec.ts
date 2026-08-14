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

describe('AI Follow-up Employee Domain API', () => {
  describe('AI Follow-up Employee CRUD', () => {
    it('creates, lists, gets, and updates a Follow-up AI Employee', async () => {
      const owner = await registerUser('followup-emp-crud');

      // Create Follow-up Employee
      const createRes = await request(app)
        .post('/api/v1/followup-employees')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({ name: 'Follow-up Bot', description: 'Handles lead re-engagement' });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.employeeType).toBe('FOLLOW_UP');
      expect(createRes.body.data.name).toBe('Follow-up Bot');
      const employeeId = createRes.body.data.id;

      // List Follow-up Employees
      const listRes = await request(app)
        .get('/api/v1/followup-employees')
        .set(authed(owner.accessToken, owner.workspaceId));

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body.data)).toBe(true);
      expect(listRes.body.data.some((e: { id: string }) => e.id === employeeId)).toBe(true);

      // Get Follow-up Employee
      const getRes = await request(app)
        .get(`/api/v1/followup-employees/${employeeId}`)
        .set(authed(owner.accessToken, owner.workspaceId));

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.id).toBe(employeeId);

      // Update Follow-up Employee
      const updateRes = await request(app)
        .patch(`/api/v1/followup-employees/${employeeId}`)
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({ name: 'Updated Follow-up Bot', status: 'ACTIVE' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.name).toBe('Updated Follow-up Bot');
    });

    it('prevents cross-workspace access to Follow-up Employees', async () => {
      const userA = await registerUser('followup-ws-a');
      const userB = await registerUser('followup-ws-b');

      const createRes = await request(app)
        .post('/api/v1/followup-employees')
        .set(authed(userA.accessToken, userA.workspaceId))
        .send({ name: 'Workspace A Follow-up' });

      const employeeId = createRes.body.data.id;

      const getRes = await request(app)
        .get(`/api/v1/followup-employees/${employeeId}`)
        .set(authed(userB.accessToken, userB.workspaceId));

      expect(getRes.status).toBe(404);
    });
  });

  describe('Follow-up Sequence CRUD & Operations', () => {
    it('creates, lists, gets, and updates a follow-up sequence', async () => {
      const owner = await registerUser('followup-seq-crud');

      // Create a lead to attach to the follow-up
      const leadRes = await request(app)
        .post('/api/v1/leads')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({ status: 'NEW' });

      const leadId = leadRes.body.data.id;

      // Create Follow-up
      const createRes = await request(app)
        .post('/api/v1/followup-employees/follow-ups')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({
          leadId,
          triggerType: 'LEAD_SILENCE',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.leadId).toBe(leadId);
      expect(createRes.body.data.triggerType).toBe('LEAD_SILENCE');
      expect(createRes.body.data.status).toBe('PENDING');

      const followUpId = createRes.body.data.id;

      // List Follow-ups
      const listRes = await request(app)
        .get('/api/v1/followup-employees/follow-ups')
        .set(authed(owner.accessToken, owner.workspaceId));

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body.data)).toBe(true);
      expect(listRes.body.data.some((f: { id: string }) => f.id === followUpId)).toBe(true);

      // Get Follow-up
      const getRes = await request(app)
        .get(`/api/v1/followup-employees/follow-ups/${followUpId}`)
        .set(authed(owner.accessToken, owner.workspaceId));

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.id).toBe(followUpId);

      // Update Follow-up
      const updateRes = await request(app)
        .patch(`/api/v1/followup-employees/follow-ups/${followUpId}`)
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({ triggerType: 'PROPOSAL_REMINDER' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.triggerType).toBe('PROPOSAL_REMINDER');
    });

    it('rejects follow-up creation without target reference', async () => {
      const owner = await registerUser('followup-no-ref');

      const response = await request(app)
        .post('/api/v1/followup-employees/follow-ups')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({ triggerType: 'LEAD_SILENCE' });

      expect(response.status).toBe(400);
    });

    it('stops a follow-up sequence with reason', async () => {
      const owner = await registerUser('followup-stop');

      const leadRes = await request(app)
        .post('/api/v1/leads')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({ status: 'NEW' });

      const leadId = leadRes.body.data.id;

      const createRes = await request(app)
        .post('/api/v1/followup-employees/follow-ups')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({ leadId, triggerType: 'CUSTOMER_REENGAGEMENT' });

      const followUpId = createRes.body.data.id;

      const stopRes = await request(app)
        .post(`/api/v1/followup-employees/follow-ups/${followUpId}/stop`)
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({ reason: 'Customer replied and converted' });

      expect(stopRes.status).toBe(200);
      expect(stopRes.body.data.status).toBe('STOPPED');
      expect(stopRes.body.data.stopReason).toBe('Customer replied and converted');
    });

    it('prevents cross-workspace access to follow-up sequences', async () => {
      const userA = await registerUser('followup-seq-a');
      const userB = await registerUser('followup-seq-b');

      const leadRes = await request(app)
        .post('/api/v1/leads')
        .set(authed(userA.accessToken, userA.workspaceId))
        .send({ status: 'NEW' });

      const createRes = await request(app)
        .post('/api/v1/followup-employees/follow-ups')
        .set(authed(userA.accessToken, userA.workspaceId))
        .send({ leadId: leadRes.body.data.id, triggerType: 'CART_ABANDONMENT' });

      const followUpId = createRes.body.data.id;

      const getRes = await request(app)
        .get(`/api/v1/followup-employees/follow-ups/${followUpId}`)
        .set(authed(userB.accessToken, userB.workspaceId));

      expect(getRes.status).toBe(404);
    });
  });
});
