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

describe('Appointments API', () => {
  it('creates, lists, gets, updates, and cancels an appointment', async () => {
    const owner = await registerUser('appointments-crud');

    // Create customer
    const custRes = await request(app)
      .post('/api/v1/customers')
      .set(authed(owner.accessToken, owner.workspaceId))
      .send({ name: 'Jane Doe', email: 'jane@example.com' });
    const customerId = custRes.body.data.id;

    // Create AI Employee
    const empRes = await request(app)
      .post('/api/v1/ai-employees')
      .set(authed(owner.accessToken, owner.workspaceId))
      .send({ employeeType: 'RECEPTIONIST', name: 'Front Desk' });
    const aiEmployeeId = empRes.body.data.id;

    const startTime = new Date(Date.now() + 86400000).toISOString();
    const endTime = new Date(Date.now() + 90000000).toISOString();

    // Create Appointment
    const createRes = await request(app)
      .post('/api/v1/appointments')
      .set(authed(owner.accessToken, owner.workspaceId))
      .send({
        customerId,
        aiEmployeeId,
        startTime,
        endTime,
      });

    expect(createRes.status).toBe(201);
    const appointmentId = createRes.body.data.id;

    // List Appointments
    const listRes = await request(app)
      .get('/api/v1/appointments')
      .set(authed(owner.accessToken, owner.workspaceId));

    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);

    // Get One
    const getRes = await request(app)
      .get(`/api/v1/appointments/${appointmentId}`)
      .set(authed(owner.accessToken, owner.workspaceId));

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(appointmentId);

    // Cancel Appointment
    const cancelRes = await request(app)
      .delete(`/api/v1/appointments/${appointmentId}`)
      .set(authed(owner.accessToken, owner.workspaceId));

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');
  });
});
