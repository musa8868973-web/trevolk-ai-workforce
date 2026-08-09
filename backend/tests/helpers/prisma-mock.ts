import { randomUUID } from 'crypto';

/**
 * Minimal in-memory stand-in for the subset of `PrismaClient` the
 * Authentication module touches (`user`, `organization`, `workspace`,
 * `workspaceMember`, `refreshToken`, `$transaction`).
 *
 * Used via `jest.mock('@database/index', ...)` so auth services/
 * controllers can be exercised end-to-end (including through the real
 * Express app via supertest) without a live database connection.
 */
export function createPrismaMock() {
  const users = new Map<string, any>();
  const usersByEmail = new Map<string, string>();
  const organizations = new Map<string, any>();
  const workspaces = new Map<string, any>();
  const memberships = new Map<string, any>();
  const refreshTokens = new Map<string, any>();

  function withWorkspace(membership: any, include: any) {
    return include?.workspace
      ? { ...membership, workspace: workspaces.get(membership.workspaceId) }
      : membership;
  }

  function withUser(membership: any, include: any) {
    const base = withWorkspace(membership, include);
    return include?.user ? { ...base, user: users.get(membership.userId) } : base;
  }

  const client: any = {
    user: {
      findUnique: async ({ where }: any) => {
        if (where.email !== undefined) {
          const id = usersByEmail.get(where.email);
          return id ? (users.get(id) ?? null) : null;
        }
        if (where.id !== undefined) {
          return users.get(where.id) ?? null;
        }
        return null;
      },
      create: async ({ data }: any) => {
        const id = randomUUID();
        const now = new Date();
        const user = {
          id,
          email: data.email,
          name: data.name ?? null,
          passwordHash: data.passwordHash ?? null,
          avatarUrl: data.avatarUrl ?? null,
          authProviderId: data.authProviderId ?? null,
          status: data.status ?? 'ACTIVE',
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          lastLoginAt: null,
        };
        users.set(id, user);
        usersByEmail.set(user.email, id);
        return user;
      },
      update: async ({ where, data }: any) => {
        const user = users.get(where.id);
        if (!user) throw new Error('Mock: user not found');
        Object.assign(user, data, { updatedAt: new Date() });
        return user;
      },
    },

    organization: {
      create: async ({ data }: any) => {
        const id = randomUUID();
        const now = new Date();
        const organization = {
          id,
          name: data.name,
          industry: data.industry ?? null,
          status: data.status ?? 'ACTIVE',
          ownerUserId: data.ownerUserId,
          createdAt: now,
          updatedAt: now,
        };
        organizations.set(id, organization);
        return organization;
      },
      findUnique: async ({ where }: any) => {
        return organizations.get(where.id) ?? null;
      },
      update: async ({ where, data }: any) => {
        const organization = organizations.get(where.id);
        if (!organization) throw new Error('Mock: organization not found');
        Object.assign(organization, data, { updatedAt: new Date() });
        return organization;
      },
    },

    workspace: {
      create: async ({ data }: any) => {
        const id = randomUUID();
        const now = new Date();
        const workspace = {
          id,
          organizationId: data.organizationId,
          name: data.name,
          industry: data.industry ?? null,
          branding: data.branding ?? null,
          defaultWorkingHours: data.defaultWorkingHours ?? null,
          timezone: data.timezone ?? 'UTC',
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };
        workspaces.set(id, workspace);
        return workspace;
      },
      findUnique: async ({ where }: any) => {
        return workspaces.get(where.id) ?? null;
      },
      findMany: async ({ where }: any) => {
        let results = [...workspaces.values()];
        if (where?.organizationId !== undefined) {
          results = results.filter((w) => w.organizationId === where.organizationId);
        }
        return results;
      },
      update: async ({ where, data }: any) => {
        const workspace = workspaces.get(where.id);
        if (!workspace) throw new Error('Mock: workspace not found');
        Object.assign(workspace, data, { updatedAt: new Date() });
        return workspace;
      },
    },

    workspaceMember: {
      create: async ({ data, include }: any) => {
        const id = randomUUID();
        const now = new Date();
        const membership = {
          id,
          userId: data.userId,
          workspaceId: data.workspaceId,
          role: data.role,
          invitedAt: data.invitedAt ?? now,
          acceptedAt: data.acceptedAt ?? null,
          createdAt: now,
          updatedAt: now,
        };
        memberships.set(id, membership);
        return withUser(membership, include);
      },
      findMany: async ({ where, include }: any) => {
        let results = [...memberships.values()];
        if (where?.userId !== undefined) {
          results = results.filter((m) => m.userId === where.userId);
        }
        if (where?.workspaceId !== undefined) {
          results = results.filter((m) => m.workspaceId === where.workspaceId);
        }
        if (where?.acceptedAt === null) {
          results = results.filter((m) => m.acceptedAt === null);
        }
        if (where?.role !== undefined) {
          results = results.filter((m) => m.role === where.role);
        }
        return results.map((m) => withUser(m, include));
      },
      findUnique: async ({ where, include }: any) => {
        if (where.id !== undefined) {
          const found = memberships.get(where.id);
          return found ? withUser(found, include) : null;
        }
        const key = where.userId_workspaceId;
        const found = [...memberships.values()].find(
          (m) => m.userId === key.userId && m.workspaceId === key.workspaceId,
        );
        return found ? withUser(found, include) : null;
      },
      update: async ({ where, data, include }: any) => {
        const membership = memberships.get(where.id);
        if (!membership) throw new Error('Mock: workspace member not found');
        Object.assign(membership, data, { updatedAt: new Date() });
        return withUser(membership, include);
      },
      delete: async ({ where }: any) => {
        const membership = memberships.get(where.id);
        if (!membership) throw new Error('Mock: workspace member not found');
        memberships.delete(where.id);
        return membership;
      },
      count: async ({ where }: any) => {
        let results = [...memberships.values()];
        if (where?.workspaceId !== undefined) {
          results = results.filter((m) => m.workspaceId === where.workspaceId);
        }
        if (where?.role !== undefined) {
          results = results.filter((m) => m.role === where.role);
        }
        if (where?.id?.not !== undefined) {
          results = results.filter((m) => m.id !== where.id.not);
        }
        return results.length;
      },
    },

    refreshToken: {
      create: async ({ data }: any) => {
        const id = randomUUID();
        const now = new Date();
        const token = {
          id,
          userId: data.userId,
          expiresAt: data.expiresAt,
          revokedAt: null,
          createdAt: now,
        };
        refreshTokens.set(id, token);
        return token;
      },
      findUnique: async ({ where, include }: any) => {
        const token = refreshTokens.get(where.id);
        if (!token) return null;
        return include?.user ? { ...token, user: users.get(token.userId) } : token;
      },
      update: async ({ where, data }: any) => {
        const token = refreshTokens.get(where.id);
        if (!token) throw new Error('Mock: refresh token not found');
        Object.assign(token, data);
        return token;
      },
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        for (const token of refreshTokens.values()) {
          const matchesUser = where.userId === undefined || token.userId === where.userId;
          const matchesId = where.id === undefined || token.id === where.id;
          const matchesRevoked =
            where.revokedAt === undefined || token.revokedAt === where.revokedAt;
          if (matchesUser && matchesId && matchesRevoked) {
            Object.assign(token, data);
            count += 1;
          }
        }
        return { count };
      },
    },

    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(client),
  };

  return client;
}

export type PrismaMock = ReturnType<typeof createPrismaMock>;
