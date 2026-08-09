import { signJwt } from '../../src/shared/security/jwt.util';
import type { PrismaMock } from '../helpers/prisma-mock';

const JWT_SECRET = 'test-access-secret-value-long-enough';
const JWT_REFRESH_SECRET = 'test-refresh-secret-value-long-enough';

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

jest.mock('@config/index', () => ({
  appConfig: {
    auth: {
      jwt: {
        secret: 'test-access-secret-value-long-enough',
        expiresIn: '1h',
        refreshSecret: 'test-refresh-secret-value-long-enough',
        refreshExpiresIn: '30d',
      },
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const databaseModule = require('@database/index');

import { PERMISSIONS, WORKSPACE_ROLES } from '../../src/common/constants';
import {
  requireAuth,
  requirePermission,
  requireRole,
  resolveWorkspace,
} from '../../src/common/middlewares/auth.middleware';

let prismaMock: PrismaMock;

function mockReqRes(
  overrides: Partial<{ headers: Record<string, string>; params: Record<string, string> }> = {},
) {
  const headers = overrides.headers ?? {};
  const req: any = {
    header: (name: string) => headers[name.toLowerCase()] ?? headers[name] ?? undefined,
    params: overrides.params ?? {},
  };
  const res: any = {};
  const next = jest.fn();
  return { req, res, next };
}

beforeEach(() => {
  prismaMock = databaseModule.prisma as PrismaMock;
});

describe('requireAuth', () => {
  it('rejects a request with no Authorization header', () => {
    const { req, res, next } = mockReqRes();
    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401 });
  });

  it('rejects a malformed bearer token', () => {
    const { req, res, next } = mockReqRes({ headers: { authorization: 'Bearer not-a-jwt' } });
    requireAuth(req, res, next);

    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401 });
  });

  it('attaches req.auth for a valid access token', () => {
    const token = signJwt({ sub: 'user-1', email: 'a@b.com', type: 'access' }, JWT_SECRET, '1h');
    const { req, res, next } = mockReqRes({ headers: { authorization: `Bearer ${token}` } });

    requireAuth(req, res, next);

    expect(req.auth).toEqual({ userId: 'user-1', email: 'a@b.com' });
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects a refresh token presented as an access token', () => {
    const refreshToken = signJwt(
      { sub: 'user-1', jti: 'token-1', type: 'refresh' },
      JWT_REFRESH_SECRET,
      '30d',
    );
    const { req, res, next } = mockReqRes({ headers: { authorization: `Bearer ${refreshToken}` } });

    requireAuth(req, res, next);

    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401 });
  });
});

describe('resolveWorkspace', () => {
  it('rejects when req.auth is missing', async () => {
    const { req, res, next } = mockReqRes();
    await resolveWorkspace(req, res, next);

    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401 });
  });

  it('rejects when no workspace id is provided', async () => {
    const { req, res, next } = mockReqRes();
    req.auth = { userId: 'user-1' };

    await resolveWorkspace(req, res, next);

    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400 });
  });

  it('rejects when the user is not a member of the requested workspace', async () => {
    const { req, res, next } = mockReqRes({
      headers: { 'x-workspace-id': 'workspace-does-not-exist' },
    });
    req.auth = { userId: 'user-1' };

    await resolveWorkspace(req, res, next);

    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 403 });
  });

  it('attaches req.workspace for a confirmed membership and rejects cross-tenant access', async () => {
    const owner = await prismaMock.user.create({ data: { email: 'owner@a.com' } });
    const org = await prismaMock.organization.create({
      data: { name: 'Org A', ownerUserId: owner.id },
    });
    const workspaceA = await prismaMock.workspace.create({
      data: { organizationId: org.id, name: 'WS A' },
    });
    await prismaMock.workspaceMember.create({
      data: {
        userId: owner.id,
        workspaceId: workspaceA.id,
        role: WORKSPACE_ROLES.OWNER,
        acceptedAt: new Date(),
      },
    });

    const otherUser = await prismaMock.user.create({ data: { email: 'other@a.com' } });

    const {
      req: reqA,
      res: resA,
      next: nextA,
    } = mockReqRes({ headers: { 'x-workspace-id': workspaceA.id } });
    reqA.auth = { userId: owner.id };
    await resolveWorkspace(reqA, resA, nextA);
    expect(reqA.workspace).toEqual({ workspaceId: workspaceA.id, role: WORKSPACE_ROLES.OWNER });
    expect(nextA).toHaveBeenCalledWith();

    // Multi-tenant isolation: a user outside workspace A must be rejected,
    // even though they know its id.
    const {
      req: reqB,
      res: resB,
      next: nextB,
    } = mockReqRes({ headers: { 'x-workspace-id': workspaceA.id } });
    reqB.auth = { userId: otherUser.id };
    await resolveWorkspace(reqB, resB, nextB);
    expect(reqB.workspace).toBeUndefined();
    expect(nextB.mock.calls[0][0]).toMatchObject({ statusCode: 403 });
  });
});

describe('requireRole', () => {
  it('rejects when req.workspace is missing', () => {
    const { req, res, next } = mockReqRes();
    requireRole(WORKSPACE_ROLES.OWNER)(req, res, next);

    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 403 });
  });

  it('allows a role included in the allow-list', () => {
    const { req, res, next } = mockReqRes();
    req.workspace = { workspaceId: 'w1', role: WORKSPACE_ROLES.ADMIN };

    requireRole(WORKSPACE_ROLES.OWNER, WORKSPACE_ROLES.ADMIN)(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects a role not included in the allow-list', () => {
    const { req, res, next } = mockReqRes();
    req.workspace = { workspaceId: 'w1', role: WORKSPACE_ROLES.TEAM_MEMBER };

    requireRole(WORKSPACE_ROLES.OWNER, WORKSPACE_ROLES.ADMIN)(req, res, next);

    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 403 });
  });
});

describe('requirePermission', () => {
  it('allows a role that has been granted the permission', () => {
    const { req, res, next } = mockReqRes();
    req.workspace = { workspaceId: 'w1', role: WORKSPACE_ROLES.TEAM_MEMBER };

    requirePermission(PERMISSIONS.LEAD_MANAGE)(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects a role missing the permission', () => {
    const { req, res, next } = mockReqRes();
    req.workspace = { workspaceId: 'w1', role: WORKSPACE_ROLES.TEAM_MEMBER };

    requirePermission(PERMISSIONS.INTEGRATION_MANAGE)(req, res, next);

    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 403 });
  });
});
