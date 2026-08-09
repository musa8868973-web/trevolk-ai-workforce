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

describe('POST /api/v1/auth/register', () => {
  it('creates a user with a workspace/organization and returns tokens', async () => {
    const email = uniqueEmail('register');

    const response = await request(app).post('/api/v1/auth/register').send({
      email,
      password: VALID_PASSWORD,
      name: 'Ayesha Khan',
      organizationName: 'Ayesha Co',
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(email);
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(response.body.data.workspace.role).toBe('OWNER');
    expect(response.body.data.tokens.accessToken).toEqual(expect.any(String));
    expect(response.body.data.tokens.refreshToken).toEqual(expect.any(String));
  });

  it('rejects a weak password', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: uniqueEmail('weak'), password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('rejects a duplicate registration with 409 Conflict', async () => {
    const email = uniqueEmail('dup');

    const first = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: VALID_PASSWORD });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: VALID_PASSWORD });

    expect(second.status).toBe(409);
    expect(second.body.success).toBe(false);
    expect(second.body.errorCode).toBe('CONFLICT');
  });
});

describe('POST /api/v1/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const email = uniqueEmail('login');
    await request(app).post('/api/v1/auth/register').send({ email, password: VALID_PASSWORD });

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: VALID_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(email);
    expect(response.body.data.tokens.accessToken).toEqual(expect.any(String));
    expect(response.body.data.workspaces).toHaveLength(1);
  });

  it('rejects an incorrect password with a generic error', async () => {
    const email = uniqueEmail('badpass');
    await request(app).post('/api/v1/auth/register').send({ email, password: VALID_PASSWORD });

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'wrongPassword1' });

    expect(response.status).toBe(401);
    expect(response.body.errorCode).toBe('UNAUTHORIZED');
    expect(response.body.message).toBe('Invalid email or password');
  });

  it('rejects a non-existent email with the same generic error (no enumeration)', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: uniqueEmail('nobody'), password: VALID_PASSWORD });

    expect(response.status).toBe(401);
    expect(response.body.errorCode).toBe('UNAUTHORIZED');
    expect(response.body.message).toBe('Invalid email or password');
  });
});

describe('GET /api/v1/auth/me', () => {
  it('rejects an unauthenticated request', async () => {
    const response = await request(app).get('/api/v1/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.errorCode).toBe('UNAUTHORIZED');
  });

  it('returns the current user and workspace memberships when authenticated', async () => {
    const email = uniqueEmail('me');
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: VALID_PASSWORD, name: 'Bilal' });

    const { accessToken } = registerResponse.body.data.tokens;

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(email);
    expect(response.body.data.workspaces).toHaveLength(1);
    expect(response.body.data.workspaces[0].role).toBe('OWNER');
  });

  it('rejects a malformed/garbage bearer token', async () => {
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer garbage.token.value');

    expect(response.status).toBe(401);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('exchanges a valid refresh token for a new token pair', async () => {
    const email = uniqueEmail('refresh');
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: VALID_PASSWORD });

    const { refreshToken } = registerResponse.body.data.tokens;

    const response = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.refreshToken).toEqual(expect.any(String));
    expect(response.body.data.refreshToken).not.toBe(refreshToken);
  });

  it('rejects a reused (already-rotated) refresh token', async () => {
    const email = uniqueEmail('rotate');
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: VALID_PASSWORD });

    const { refreshToken } = registerResponse.body.data.tokens;

    const firstUse = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(firstUse.status).toBe(200);

    const secondUse = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(secondUse.status).toBe(401);
  });

  it('rejects a malformed refresh token', async () => {
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'not-a-real-token' });

    expect(response.status).toBe(401);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('requires authentication', async () => {
    const response = await request(app).post('/api/v1/auth/logout').send({});
    expect(response.status).toBe(401);
  });

  it('revokes the presented refresh token so it can no longer be used', async () => {
    const email = uniqueEmail('logout');
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: VALID_PASSWORD });

    const { accessToken, refreshToken } = registerResponse.body.data.tokens;

    const logoutResponse = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(logoutResponse.status).toBe(200);

    const refreshAfterLogout = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });
    expect(refreshAfterLogout.status).toBe(401);
  });
});

describe('multi-tenant workspace isolation', () => {
  it('does not let one user see another workspace as their own', async () => {
    const emailA = uniqueEmail('tenantA');
    const emailB = uniqueEmail('tenantB');

    const registerA = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: emailA, password: VALID_PASSWORD });
    const registerB = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: emailB, password: VALID_PASSWORD });

    const workspaceIdA = registerA.body.data.workspace.workspaceId;
    const accessTokenB = registerB.body.data.tokens.accessToken;

    // User B's /me must reflect only their own workspace, never A's.
    const meB = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessTokenB}`);

    const workspaceIdsForB = meB.body.data.workspaces.map(
      (w: { workspaceId: string }) => w.workspaceId,
    );
    expect(workspaceIdsForB).not.toContain(workspaceIdA);
  });
});
