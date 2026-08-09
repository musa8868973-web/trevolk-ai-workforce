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

async function registerUser(prefix: string, organizationName?: string) {
  const email = uniqueEmail(prefix);
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password: VALID_PASSWORD, name: prefix, organizationName });

  return {
    email,
    accessToken: response.body.data.tokens.accessToken as string,
    organizationId: response.body.data.workspace.organizationId as string,
    workspaceId: response.body.data.workspace.workspaceId as string,
  };
}

describe('GET /api/v1/organizations/:id', () => {
  it("returns the organization's profile to its owner", async () => {
    const owner = await registerUser('org-owner', 'Owner Co');

    const response = await request(app)
      .get(`/api/v1/organizations/${owner.organizationId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(owner.organizationId);
    expect(response.body.data.name).toBe('Owner Co');
    expect(response.body.data.ownerUserId).toBeDefined();
  });

  it('returns 404 (not 403) for a user with no relationship to the organization', async () => {
    const owner = await registerUser('org-owner2');
    const stranger = await registerUser('org-stranger');

    const response = await request(app)
      .get(`/api/v1/organizations/${owner.organizationId}`)
      .set('Authorization', `Bearer ${stranger.accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body.errorCode).toBe('NOT_FOUND');
  });

  it('requires authentication', async () => {
    const owner = await registerUser('org-owner3');

    const response = await request(app).get(`/api/v1/organizations/${owner.organizationId}`);

    expect(response.status).toBe(401);
  });

  it('is visible to a workspace member who is not the organization owner', async () => {
    const owner = await registerUser('org-owner4');
    const member = await registerUser('org-member4');

    const invite = await request(app)
      .post(`/api/v1/workspaces/${owner.workspaceId}/members/invite`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: member.email, role: 'TEAM_MEMBER' });
    expect(invite.status).toBe(201);

    await request(app)
      .post(`/api/v1/workspaces/${owner.workspaceId}/members/accept`)
      .set('Authorization', `Bearer ${member.accessToken}`);

    const response = await request(app)
      .get(`/api/v1/organizations/${owner.organizationId}`)
      .set('Authorization', `Bearer ${member.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(owner.organizationId);
  });
});

describe('PATCH /api/v1/organizations/:id', () => {
  it('lets the owner update the business profile', async () => {
    const owner = await registerUser('org-update-owner');

    const response = await request(app)
      .patch(`/api/v1/organizations/${owner.organizationId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Renamed Co', industry: 'Retail' });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('Renamed Co');
    expect(response.body.data.industry).toBe('Retail');
  });

  it('rejects an update from a workspace member who is not the owner (403, not 404)', async () => {
    const owner = await registerUser('org-update-owner2');
    const member = await registerUser('org-update-member2');

    await request(app)
      .post(`/api/v1/workspaces/${owner.workspaceId}/members/invite`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: member.email, role: 'ADMIN' });

    await request(app)
      .post(`/api/v1/workspaces/${owner.workspaceId}/members/accept`)
      .set('Authorization', `Bearer ${member.accessToken}`);

    const response = await request(app)
      .patch(`/api/v1/organizations/${owner.organizationId}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ name: 'Hijacked Name' });

    expect(response.status).toBe(403);
    expect(response.body.errorCode).toBe('FORBIDDEN');
  });

  it('rejects an update from a user with no relationship to the organization (404)', async () => {
    const owner = await registerUser('org-update-owner3');
    const stranger = await registerUser('org-update-stranger3');

    const response = await request(app)
      .patch(`/api/v1/organizations/${owner.organizationId}`)
      .set('Authorization', `Bearer ${stranger.accessToken}`)
      .send({ name: 'Hijacked Name' });

    expect(response.status).toBe(404);
  });

  it('rejects an empty update body', async () => {
    const owner = await registerUser('org-update-owner4');

    const response = await request(app)
      .patch(`/api/v1/organizations/${owner.organizationId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe('VALIDATION_ERROR');
  });
});
