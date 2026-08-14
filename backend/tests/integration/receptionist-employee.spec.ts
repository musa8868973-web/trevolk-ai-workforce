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

describe('AI Receptionist Employee Domain API', () => {
  describe('AI Receptionist CRUD', () => {
    it('creates, lists, gets, and updates a Receptionist AI Employee', async () => {
      const owner = await registerUser('receptionist-crud');

      // Create Receptionist Employee
      const createRes = await request(app)
        .post('/api/v1/receptionist-employees')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({ name: 'Front Desk AI', description: 'Handles phone and booking' });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.employeeType).toBe('RECEPTIONIST');
      expect(createRes.body.data.name).toBe('Front Desk AI');
      const employeeId = createRes.body.data.id;

      // List Receptionist Employees
      const listRes = await request(app)
        .get('/api/v1/receptionist-employees')
        .set(authed(owner.accessToken, owner.workspaceId));

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body.data)).toBe(true);
      expect(listRes.body.data.some((e: { id: string }) => e.id === employeeId)).toBe(true);

      // Get Receptionist Employee
      const getRes = await request(app)
        .get(`/api/v1/receptionist-employees/${employeeId}`)
        .set(authed(owner.accessToken, owner.workspaceId));

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.id).toBe(employeeId);

      // Update Receptionist Employee
      const updateRes = await request(app)
        .patch(`/api/v1/receptionist-employees/${employeeId}`)
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({ name: 'Updated Front Desk AI', status: 'ACTIVE' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.name).toBe('Updated Front Desk AI');
      expect(updateRes.body.data.status).toBe('ACTIVE');
    });

    it('prevents cross-workspace access to Receptionist Employees', async () => {
      const userA = await registerUser('receptionist-ws-a');
      const userB = await registerUser('receptionist-ws-b');

      const createRes = await request(app)
        .post('/api/v1/receptionist-employees')
        .set(authed(userA.accessToken, userA.workspaceId))
        .send({ name: 'Workspace A Receptionist' });

      const employeeId = createRes.body.data.id;

      // User B tries to access User A's employee
      const getRes = await request(app)
        .get(`/api/v1/receptionist-employees/${employeeId}`)
        .set(authed(userB.accessToken, userB.workspaceId));

      expect(getRes.status).toBe(404);
    });
  });

  describe('Appointment Operations via Receptionist', () => {
    it('checks slot availability', async () => {
      const owner = await registerUser('receptionist-avail');

      const startTime = new Date(Date.now() + 3600000).toISOString();
      const endTime = new Date(Date.now() + 7200000).toISOString();

      const response = await request(app)
        .post('/api/v1/receptionist-employees/check-availability')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({ startTime, endTime });

      expect(response.status).toBe(200);
      expect(response.body.data.available).toBe(true);
    });

    it('books an appointment and automatically creates customer on first contact', async () => {
      const owner = await registerUser('receptionist-book');

      // Create Receptionist Employee
      const empRes = await request(app)
        .post('/api/v1/receptionist-employees')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({ name: 'Booking Receptionist' });
      const aiEmployeeId = empRes.body.data.id;

      const startTime = new Date(Date.now() + 86400000).toISOString();
      const endTime = new Date(Date.now() + 90000000).toISOString();

      const response = await request(app)
        .post('/api/v1/receptionist-employees/book-appointment')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({
          aiEmployeeId,
          customerName: 'Jane Doe',
          customerEmail: 'jane.doe@example.com',
          startTime,
          endTime,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.aiEmployeeId).toBe(aiEmployeeId);
      expect(response.body.data.status).toBe('SCHEDULED');
      expect(response.body.data.customerId).toBeDefined();
    });

    it('reschedules an appointment', async () => {
      const owner = await registerUser('receptionist-resched');

      const empRes = await request(app)
        .post('/api/v1/receptionist-employees')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({ name: 'Reschedule Bot' });
      const aiEmployeeId = empRes.body.data.id;

      const startTime = new Date(Date.now() + 86400000).toISOString();
      const endTime = new Date(Date.now() + 90000000).toISOString();

      const bookRes = await request(app)
        .post('/api/v1/receptionist-employees/book-appointment')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({
          aiEmployeeId,
          customerName: 'John Smith',
          startTime,
          endTime,
        });

      const appointmentId = bookRes.body.data.id;

      const newStart = new Date(Date.now() + 172800000).toISOString();
      const newEnd = new Date(Date.now() + 176400000).toISOString();

      const response = await request(app)
        .post('/api/v1/receptionist-employees/reschedule-appointment')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({
          appointmentId,
          startTime: newStart,
          endTime: newEnd,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(appointmentId);
    });

    it('cancels an appointment', async () => {
      const owner = await registerUser('receptionist-cancel');

      const empRes = await request(app)
        .post('/api/v1/receptionist-employees')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({ name: 'Cancel Bot' });
      const aiEmployeeId = empRes.body.data.id;

      const startTime = new Date(Date.now() + 86400000).toISOString();
      const endTime = new Date(Date.now() + 90000000).toISOString();

      const bookRes = await request(app)
        .post('/api/v1/receptionist-employees/book-appointment')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({
          aiEmployeeId,
          customerName: 'Bob Vance',
          startTime,
          endTime,
        });

      const appointmentId = bookRes.body.data.id;

      const response = await request(app)
        .post('/api/v1/receptionist-employees/cancel-appointment')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({ appointmentId });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('CANCELLED');
    });
  });

  describe('Escalation', () => {
    it('escalates a conversation to human agent', async () => {
      const owner = await registerUser('receptionist-escalate');

      const convRes = await request(app)
        .post('/api/v1/conversations')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({ channel: 'PHONE' });

      const conversationId = convRes.body.data.id;

      const response = await request(app)
        .post('/api/v1/receptionist-employees/escalate')
        .set(authed(owner.accessToken, owner.workspaceId))
        .send({
          conversationId,
          reason: 'Caller requested human front desk manager',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.conversation.status).toBe('ESCALATED');
      expect(response.body.data.escalationNote.isInternalNote).toBe(true);
    });
  });
});
