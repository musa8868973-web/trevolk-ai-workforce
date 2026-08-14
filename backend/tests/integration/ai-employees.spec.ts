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

/** Invites and accepts `invitee` into `owner`'s workspace as a TEAM_MEMBER. */
async function addTeamMember(owner: Awaited<ReturnType<typeof registerUser>>, prefix: string) {
  const invitee = await registerUser(prefix);

  await request(app)
    .post(`/api/v1/workspaces/${owner.workspaceId}/members/invite`)
    .set(authed(owner.accessToken, owner.workspaceId))
    .send({ email: invitee.email, role: 'TEAM_MEMBER' });

  await request(app)
    .post(`/api/v1/workspaces/${owner.workspaceId}/members/accept`)
    .set(authed(invitee.accessToken, owner.workspaceId));

  return invitee;
}

describe('POST /api/v1/ai-employees', () => {
  it('creates an AI Employee for the resolved workspace, defaulting to NEEDS_SETUP', async () => {
    const owner = await registerUser('create-emp-owner');

    const response = await request(app)
      .post('/api/v1/ai-employees')
      .set(authed(owner.accessToken, owner.workspaceId))
      .send({ employeeType: 'SALES', name: 'Sales Bot' });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      workspaceId: owner.workspaceId,
      employeeType: 'SALES',
      name: 'Sales Bot',
      status: 'NEEDS_SETUP',
      configuration: {},
    });
    expect(response.body.data.id).toBeDefined();
  });

  it('rejects an invalid employee type', async () => {
    const owner = await registerUser('create-emp-invalid');

    const response = await request(app)
      .post('/api/v1/ai-employees')
      .set(authed(owner.accessToken, owner.workspaceId))
      .send({ employeeType: 'MARKETING', name: 'Not Yet Supported' });

    expect(response.status).toBe(400);
  });

  it('rejects creating a second employee of the same type in one workspace', async () => {
    const owner = await registerUser('create-emp-dup');

    await request(app)
      .post('/api/v1/ai-employees')
      .set(authed(owner.accessToken, owner.workspaceId))
      .send({ employeeType: 'SUPPORT', name: 'Support Bot' });

    const response = await request(app)
      .post('/api/v1/ai-employees')
      .set(authed(owner.accessToken, owner.workspaceId))
      .send({ employeeType: 'SUPPORT', name: 'Support Bot 2' });

    expect(response.status).toBe(409);
  });

  it('rejects a Team Member from creating an AI Employee (Owner/Admin only)', async () => {
    const owner = await registerUser('create-emp-perm-owner');
    const member = await addTeamMember(owner, 'create-emp-perm-member');

    const response = await request(app)
      .post('/api/v1/ai-employees')
      .set(authed(member.accessToken, owner.workspaceId))
      .send({ employeeType: 'RECEPTIONIST', name: 'Front Desk' });

    expect(response.status).toBe(403);
  });

  it('rejects a request without a workspace context', async () => {
    const owner = await registerUser('create-emp-noworkspace');

    const response = await request(app)
      .post('/api/v1/ai-employees')
      .set({ Authorization: `Bearer ${owner.accessToken}` })
      .send({ employeeType: 'SALES', name: 'Sales Bot' });

    expect(response.status).toBe(400);
  });

  it('rejects an unauthenticated request', async () => {
    const response = await request(app)
      .post('/api/v1/ai-employees')
      .send({ employeeType: 'SALES', name: 'Sales Bot' });

    expect(response.status).toBe(401);
  });
});

describe('GET /api/v1/ai-employees', () => {
  it("lists only the resolved workspace's AI Employees, filterable by type", async () => {
    const owner = await registerUser('list-emp-owner');
    const other = await registerUser('list-emp-other');

    await request(app)
      .post('/api/v1/ai-employees')
      .set(authed(owner.accessToken, owner.workspaceId))
      .send({ employeeType: 'SALES', name: 'Sales Bot' });
    await request(app)
      .post('/api/v1/ai-employees')
      .set(authed(owner.accessToken, owner.workspaceId))
      .send({ employeeType: 'FOLLOW_UP', name: 'Follow-up Bot' });
    await request(app)
      .post('/api/v1/ai-employees')
      .set(authed(other.accessToken, other.workspaceId))
      .send({ employeeType: 'SALES', name: 'Other Workspace Sales Bot' });

    const response = await request(app)
      .get('/api/v1/ai-employees')
      .set(authed(owner.accessToken, owner.workspaceId));

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(
      (response.body.data as Array<{ workspaceId: string }>).every(
        (e) => e.workspaceId === owner.workspaceId,
      ),
    ).toBe(true);

    const filtered = await request(app)
      .get('/api/v1/ai-employees?employeeType=SALES')
      .set(authed(owner.accessToken, owner.workspaceId));

    expect(filtered.status).toBe(200);
    expect(filtered.body.data).toHaveLength(1);
    expect(filtered.body.data[0].employeeType).toBe('SALES');
  });

  it('allows a Team Member to list AI Employees (read is not manage-gated)', async () => {
    const owner = await registerUser('list-emp-perm-owner');
    const member = await addTeamMember(owner, 'list-emp-perm-member');

    await request(app)
      .post('/api/v1/ai-employees')
      .set(authed(owner.accessToken, owner.workspaceId))
      .send({ employeeType: 'SALES', name: 'Sales Bot' });

    const response = await request(app)
      .get('/api/v1/ai-employees')
      .set(authed(member.accessToken, owner.workspaceId));

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });
});

describe('GET /api/v1/ai-employees/:id', () => {
  it('retrieves a single AI Employee within the resolved workspace', async () => {
    const owner = await registerUser('get-emp-owner');

    const created = await request(app)
      .post('/api/v1/ai-employees')
      .set(authed(owner.accessToken, owner.workspaceId))
      .send({ employeeType: 'SALES', name: 'Sales Bot' });

    const response = await request(app)
      .get(`/api/v1/ai-employees/${created.body.data.id}`)
      .set(authed(owner.accessToken, owner.workspaceId));

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(created.body.data.id);
  });

  it("returns 404 for another workspace's AI Employee (never leaks cross-tenant existence)", async () => {
    const owner = await registerUser('get-emp-owner-a');
    const otherOwner = await registerUser('get-emp-owner-b');

    const created = await request(app)
      .post('/api/v1/ai-employees')
      .set(authed(owner.accessToken, owner.workspaceId))
      .send({ employeeType: 'SALES', name: 'Sales Bot' });

    const response = await request(app)
      .get(`/api/v1/ai-employees/${created.body.data.id}`)
      .set(authed(otherOwner.accessToken, otherOwner.workspaceId));

    expect(response.status).toBe(404);
  });

  it('returns 404 for a non-existent AI Employee id', async () => {
    const owner = await registerUser('get-emp-missing');

    const response = await request(app)
      .get('/api/v1/ai-employees/00000000-0000-0000-0000-000000000000')
      .set(authed(owner.accessToken, owner.workspaceId));

    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/v1/ai-employees/:id', () => {
  it('activates an employee (status -> ACTIVE) and updates its configuration', async () => {
    const owner = await registerUser('patch-emp-owner');

    const created = await request(app)
      .post('/api/v1/ai-employees')
      .set(authed(owner.accessToken, owner.workspaceId))
      .send({ employeeType: 'SALES', name: 'Sales Bot' });

    const response = await request(app)
      .patch(`/api/v1/ai-employees/${created.body.data.id}`)
      .set(authed(owner.accessToken, owner.workspaceId))
      .send({ status: 'ACTIVE', configuration: { systemInstructions: 'Be helpful.' } });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ACTIVE');
    expect(response.body.data.configuration).toMatchObject({ systemInstructions: 'Be helpful.' });
    expect(response.body.data.lastActiveAt).not.toBeNull();
  });

  it('deactivates an employee (status -> PAUSED)', async () => {
    const owner = await registerUser('patch-emp-deactivate');

    const created = await request(app)
      .post('/api/v1/ai-employees')
      .set(authed(owner.accessToken, owner.workspaceId))
      .send({ employeeType: 'RECEPTIONIST', name: 'Front Desk' });

    const response = await request(app)
      .patch(`/api/v1/ai-employees/${created.body.data.id}`)
      .set(authed(owner.accessToken, owner.workspaceId))
      .send({ status: 'PAUSED' });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('PAUSED');
  });

  it('rejects a Team Member from updating an AI Employee (Owner/Admin only)', async () => {
    const owner = await registerUser('patch-emp-perm-owner');
    const member = await addTeamMember(owner, 'patch-emp-perm-member');

    const created = await request(app)
      .post('/api/v1/ai-employees')
      .set(authed(owner.accessToken, owner.workspaceId))
      .send({ employeeType: 'SALES', name: 'Sales Bot' });

    const response = await request(app)
      .patch(`/api/v1/ai-employees/${created.body.data.id}`)
      .set(authed(member.accessToken, owner.workspaceId))
      .send({ status: 'ACTIVE' });

    expect(response.status).toBe(403);
  });

  it("returns 404 when attempting to update another workspace's AI Employee", async () => {
    const owner = await registerUser('patch-emp-cross-a');
    const otherOwner = await registerUser('patch-emp-cross-b');

    const created = await request(app)
      .post('/api/v1/ai-employees')
      .set(authed(owner.accessToken, owner.workspaceId))
      .send({ employeeType: 'SALES', name: 'Sales Bot' });

    const response = await request(app)
      .patch(`/api/v1/ai-employees/${created.body.data.id}`)
      .set(authed(otherOwner.accessToken, otherOwner.workspaceId))
      .send({ status: 'ACTIVE' });

    expect(response.status).toBe(404);
  });

  it('rejects an update with no fields', async () => {
    const owner = await registerUser('patch-emp-empty');

    const created = await request(app)
      .post('/api/v1/ai-employees')
      .set(authed(owner.accessToken, owner.workspaceId))
      .send({ employeeType: 'SALES', name: 'Sales Bot' });

    const response = await request(app)
      .patch(`/api/v1/ai-employees/${created.body.data.id}`)
      .set(authed(owner.accessToken, owner.workspaceId))
      .send({});

    expect(response.status).toBe(400);
  });

  it('rejects an invalid status value', async () => {
    const owner = await registerUser('patch-emp-badstatus');

    const created = await request(app)
      .post('/api/v1/ai-employees')
      .set(authed(owner.accessToken, owner.workspaceId))
      .send({ employeeType: 'SALES', name: 'Sales Bot' });

    const response = await request(app)
      .patch(`/api/v1/ai-employees/${created.body.data.id}`)
      .set(authed(owner.accessToken, owner.workspaceId))
      .send({ status: 'DELETED' });

    expect(response.status).toBe(400);
  });
});
