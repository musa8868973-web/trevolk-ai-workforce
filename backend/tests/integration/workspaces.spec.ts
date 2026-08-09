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

function authed(token: string) {
  return { Authorization: `Bearer ${token}` };
}

describe('GET /api/v1/workspaces', () => {
  it("lists the caller's own workspace with an ACTIVE Owner membership", async () => {
    const owner = await registerUser('list-owner');

    const response = await request(app).get('/api/v1/workspaces').set(authed(owner.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      id: owner.workspaceId,
      role: 'OWNER',
      membershipStatus: 'ACTIVE',
    });
  });
});

describe('POST /api/v1/workspaces', () => {
  it('lets an organization owner create an additional workspace', async () => {
    const owner = await registerUser('create-ws-owner');

    const response = await request(app)
      .post('/api/v1/workspaces')
      .set(authed(owner.accessToken))
      .send({ organizationId: owner.organizationId, name: 'Second Location', timezone: 'UTC' });

    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe('Second Location');
    expect(response.body.data.role).toBe('OWNER');
  });

  it('rejects workspace creation from a non-owner of the organization', async () => {
    const owner = await registerUser('create-ws-owner2');
    const stranger = await registerUser('create-ws-stranger2');

    const response = await request(app)
      .post('/api/v1/workspaces')
      .set(authed(stranger.accessToken))
      .send({ organizationId: owner.organizationId, name: 'Hijacked Workspace' });

    expect(response.status).toBe(403);
  });
});

describe('GET/PATCH /api/v1/workspaces/:workspaceId', () => {
  it('returns workspace detail to a confirmed member', async () => {
    const owner = await registerUser('get-ws-owner');

    const response = await request(app)
      .get(`/api/v1/workspaces/${owner.workspaceId}`)
      .set(authed(owner.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(owner.workspaceId);
  });

  it('rejects a user with no membership in the workspace (multi-tenant isolation)', async () => {
    const owner = await registerUser('get-ws-owner2');
    const stranger = await registerUser('get-ws-stranger2');

    const response = await request(app)
      .get(`/api/v1/workspaces/${owner.workspaceId}`)
      .set(authed(stranger.accessToken));

    expect(response.status).toBe(403);
  });

  it('lets an Owner/Admin update workspace settings', async () => {
    const owner = await registerUser('patch-ws-owner');

    const response = await request(app)
      .patch(`/api/v1/workspaces/${owner.workspaceId}`)
      .set(authed(owner.accessToken))
      .send({ name: 'Renamed Workspace', timezone: 'America/New_York' });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('Renamed Workspace');
    expect(response.body.data.timezone).toBe('America/New_York');
  });

  it('rejects a Team Member updating workspace settings', async () => {
    const owner = await registerUser('patch-ws-owner2');
    const member = await registerUser('patch-ws-member2');

    await request(app)
      .post(`/api/v1/workspaces/${owner.workspaceId}/members/invite`)
      .set(authed(owner.accessToken))
      .send({ email: member.email, role: 'TEAM_MEMBER' });
    await request(app)
      .post(`/api/v1/workspaces/${owner.workspaceId}/members/accept`)
      .set(authed(member.accessToken));

    const response = await request(app)
      .patch(`/api/v1/workspaces/${owner.workspaceId}`)
      .set(authed(member.accessToken))
      .send({ name: 'Hijacked Workspace' });

    expect(response.status).toBe(403);
  });
});

describe('workspace invitations', () => {
  it('invites an existing user, keeps them pending until accepted, and blocks access until then', async () => {
    const owner = await registerUser('invite-owner');
    const invitee = await registerUser('invite-invitee');

    const inviteResponse = await request(app)
      .post(`/api/v1/workspaces/${owner.workspaceId}/members/invite`)
      .set(authed(owner.accessToken))
      .send({ email: invitee.email, role: 'TEAM_MEMBER' });

    expect(inviteResponse.status).toBe(201);
    expect(inviteResponse.body.data.status).toBe('PENDING');

    // Not yet accepted — must not have workspace access.
    const blockedAccess = await request(app)
      .get(`/api/v1/workspaces/${owner.workspaceId}`)
      .set(authed(invitee.accessToken));
    expect(blockedAccess.status).toBe(403);

    // Shows up in the invitee's own pending-invitations list.
    const invitations = await request(app)
      .get('/api/v1/workspaces/invitations')
      .set(authed(invitee.accessToken));
    expect(invitations.status).toBe(200);
    expect(invitations.body.data.map((w: { id: string }) => w.id)).toContain(owner.workspaceId);

    const acceptResponse = await request(app)
      .post(`/api/v1/workspaces/${owner.workspaceId}/members/accept`)
      .set(authed(invitee.accessToken));
    expect(acceptResponse.status).toBe(200);
    expect(acceptResponse.body.data.status).toBe('ACTIVE');

    const afterAcceptAccess = await request(app)
      .get(`/api/v1/workspaces/${owner.workspaceId}`)
      .set(authed(invitee.accessToken));
    expect(afterAcceptAccess.status).toBe(200);
  });

  it('rejects inviting an email with no Trevolk account', async () => {
    const owner = await registerUser('invite-owner-noacct');

    const response = await request(app)
      .post(`/api/v1/workspaces/${owner.workspaceId}/members/invite`)
      .set(authed(owner.accessToken))
      .send({ email: 'nobody-registered@example.com', role: 'TEAM_MEMBER' });

    expect(response.status).toBe(404);
  });

  it('rejects a duplicate invite to an already-member/invited user', async () => {
    const owner = await registerUser('invite-owner-dup');
    const invitee = await registerUser('invite-invitee-dup');

    const first = await request(app)
      .post(`/api/v1/workspaces/${owner.workspaceId}/members/invite`)
      .set(authed(owner.accessToken))
      .send({ email: invitee.email, role: 'TEAM_MEMBER' });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post(`/api/v1/workspaces/${owner.workspaceId}/members/invite`)
      .set(authed(owner.accessToken))
      .send({ email: invitee.email, role: 'TEAM_MEMBER' });
    expect(second.status).toBe(409);
  });

  it('blocks a Team Member from inviting anyone (permission-gated)', async () => {
    const owner = await registerUser('invite-owner-tm');
    const member = await registerUser('invite-member-tm');
    const target = await registerUser('invite-target-tm');

    await request(app)
      .post(`/api/v1/workspaces/${owner.workspaceId}/members/invite`)
      .set(authed(owner.accessToken))
      .send({ email: member.email, role: 'TEAM_MEMBER' });
    await request(app)
      .post(`/api/v1/workspaces/${owner.workspaceId}/members/accept`)
      .set(authed(member.accessToken));

    const response = await request(app)
      .post(`/api/v1/workspaces/${owner.workspaceId}/members/invite`)
      .set(authed(member.accessToken))
      .send({ email: target.email, role: 'TEAM_MEMBER' });

    expect(response.status).toBe(403);
  });

  it('blocks an Admin from granting the Owner role (privilege escalation)', async () => {
    const owner = await registerUser('invite-owner-esc');
    const admin = await registerUser('invite-admin-esc');
    const target = await registerUser('invite-target-esc');

    await request(app)
      .post(`/api/v1/workspaces/${owner.workspaceId}/members/invite`)
      .set(authed(owner.accessToken))
      .send({ email: admin.email, role: 'ADMIN' });
    await request(app)
      .post(`/api/v1/workspaces/${owner.workspaceId}/members/accept`)
      .set(authed(admin.accessToken));

    const response = await request(app)
      .post(`/api/v1/workspaces/${owner.workspaceId}/members/invite`)
      .set(authed(admin.accessToken))
      .send({ email: target.email, role: 'OWNER' });

    expect(response.status).toBe(403);
  });
});

describe('workspace member role updates and removal', () => {
  async function buildOwnerAndAcceptedMember(prefix: string, role: 'ADMIN' | 'TEAM_MEMBER') {
    const owner = await registerUser(`${prefix}-owner`);
    const member = await registerUser(`${prefix}-member`);

    const inviteResponse = await request(app)
      .post(`/api/v1/workspaces/${owner.workspaceId}/members/invite`)
      .set(authed(owner.accessToken))
      .send({ email: member.email, role });
    await request(app)
      .post(`/api/v1/workspaces/${owner.workspaceId}/members/accept`)
      .set(authed(member.accessToken));

    return { owner, member, memberId: inviteResponse.body.data.id as string };
  }

  it('lets an Owner promote a Team Member to Admin', async () => {
    const { owner, memberId } = await buildOwnerAndAcceptedMember('promote', 'TEAM_MEMBER');

    const response = await request(app)
      .patch(`/api/v1/workspaces/${owner.workspaceId}/members/${memberId}`)
      .set(authed(owner.accessToken))
      .send({ role: 'ADMIN' });

    expect(response.status).toBe(200);
    expect(response.body.data.role).toBe('ADMIN');
  });

  it('blocks a member from changing their own role, even as Admin', async () => {
    const { owner, member, memberId } = await buildOwnerAndAcceptedMember('selfchange', 'ADMIN');
    void owner;

    const response = await request(app)
      .patch(`/api/v1/workspaces/${owner.workspaceId}/members/${memberId}`)
      .set(authed(member.accessToken))
      .send({ role: 'TEAM_MEMBER' });

    expect(response.status).toBe(403);
  });

  it("blocks an Admin from demoting the workspace's Owner", async () => {
    const { owner, member } = await buildOwnerAndAcceptedMember('demote-owner', 'ADMIN');

    // Find the Owner's own membership id via the members list.
    const membersResponse = await request(app)
      .get(`/api/v1/workspaces/${owner.workspaceId}/members`)
      .set(authed(member.accessToken));
    const ownerMembership = membersResponse.body.data.find(
      (m: { role: string }) => m.role === 'OWNER',
    );

    const response = await request(app)
      .patch(`/api/v1/workspaces/${owner.workspaceId}/members/${ownerMembership.id}`)
      .set(authed(member.accessToken))
      .send({ role: 'ADMIN' });

    expect(response.status).toBe(403);
  });

  it('lets an Owner remove a Team Member', async () => {
    const { owner, memberId } = await buildOwnerAndAcceptedMember('remove', 'TEAM_MEMBER');

    const response = await request(app)
      .delete(`/api/v1/workspaces/${owner.workspaceId}/members/${memberId}`)
      .set(authed(owner.accessToken));

    expect(response.status).toBe(200);

    const membersAfter = await request(app)
      .get(`/api/v1/workspaces/${owner.workspaceId}/members`)
      .set(authed(owner.accessToken));
    expect(membersAfter.body.data.map((m: { id: string }) => m.id)).not.toContain(memberId);
  });

  it("blocks an Admin from removing the workspace's Owner", async () => {
    const { owner, member } = await buildOwnerAndAcceptedMember('remove-owner', 'ADMIN');

    const membersResponse = await request(app)
      .get(`/api/v1/workspaces/${owner.workspaceId}/members`)
      .set(authed(member.accessToken));
    const ownerMembership = membersResponse.body.data.find(
      (m: { role: string }) => m.role === 'OWNER',
    );

    const response = await request(app)
      .delete(`/api/v1/workspaces/${owner.workspaceId}/members/${ownerMembership.id}`)
      .set(authed(member.accessToken));

    expect(response.status).toBe(403);
  });

  it('blocks a member from removing themselves via this endpoint', async () => {
    const { owner, member, memberId } = await buildOwnerAndAcceptedMember('self-remove', 'ADMIN');
    void owner;

    const response = await request(app)
      .delete(`/api/v1/workspaces/${owner.workspaceId}/members/${memberId}`)
      .set(authed(member.accessToken));

    expect(response.status).toBe(403);
  });
});
