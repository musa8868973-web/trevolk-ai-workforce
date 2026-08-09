import { WORKSPACE_ROLES, type WorkspaceRole } from '@common/constants';
import { ConflictError, ForbiddenError, NotFoundError } from '@common/errors';
import { prisma } from '@database/index';
import type { User, WorkspaceMember } from '@prisma/client';
import { logger } from '@shared/logger';

import {
  toSafeWorkspaceMember,
  type SafeWorkspaceMember,
} from '../mappers/member.mapper';
import { toWorkspaceWithMembership, type WorkspaceWithMembership } from '../mappers/workspace.mapper';
import type { InviteMemberInput } from '../validators/member.schema';

/**
 * Business logic for workspace team-member management and invitations
 * (Backend Specification §5.2, Phase 4 §6–8, §16). Reuses the existing
 * `WorkspaceMember` model's `invitedAt`/`acceptedAt` fields to represent a
 * pending invitation — no separate `Invitation` entity is introduced,
 * per the Database Design's entity list (§3) and the Phase 4 rule against
 * duplicating existing models.
 *
 * Every mutating function here is called only after route middleware has
 * already confirmed the caller is an accepted Owner/Admin member of the
 * target workspace (`resolveWorkspace` + `requirePermission(TEAM_MANAGE)`).
 * The additional checks below guard against privilege escalation *within*
 * that Owner/Admin boundary (Phase 4 §7, §16).
 */

async function listMembers(workspaceId: string): Promise<SafeWorkspaceMember[]> {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: true },
  });

  return members.map((member) => toSafeWorkspaceMember(member));
}

/** Pending invitations (unaccepted memberships) for the given user, across every workspace. */
async function listPendingInvitationsForUser(userId: string): Promise<WorkspaceWithMembership[]> {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId, acceptedAt: null },
    include: { workspace: true },
  });

  return memberships
    .filter((membership) => !membership.workspace.deletedAt)
    .map((membership) => toWorkspaceWithMembership(membership));
}

/**
 * Invites an existing user to a workspace by email. The invited user must
 * already hold a Trevolk account — `WorkspaceMember.userId` is a required
 * foreign key, and this phase deliberately does not send real email or
 * provision placeholder accounts for not-yet-registered addresses (Phase
 * 4 §8: "Do NOT integrate Gmail/SendGrid/other email providers").
 */
async function inviteMember(
  workspaceId: string,
  inviterRole: WorkspaceRole,
  input: InviteMemberInput,
): Promise<SafeWorkspaceMember> {
  if (input.role === WORKSPACE_ROLES.OWNER && inviterRole !== WORKSPACE_ROLES.OWNER) {
    throw new ForbiddenError('Only a workspace Owner can invite another Owner');
  }

  const invitedUser = await prisma.user.findUnique({ where: { email: input.email } });

  if (!invitedUser || invitedUser.deletedAt) {
    throw new NotFoundError(
      'No Trevolk account exists for this email — the person must sign up before being invited',
    );
  }

  const existingMembership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: invitedUser.id, workspaceId } },
  });

  if (existingMembership) {
    throw new ConflictError('This user is already a member of (or invited to) this workspace');
  }

  const membership = await prisma.workspaceMember.create({
    data: {
      userId: invitedUser.id,
      workspaceId,
      role: input.role,
      acceptedAt: null,
    },
    include: { user: true },
  });

  logger.info(
    { workspaceId, invitedUserId: invitedUser.id, role: input.role },
    'Workspace member invited',
  );

  return toSafeWorkspaceMember(membership);
}

/**
 * Accepts a pending invitation for the authenticated caller. Deliberately
 * does not go through `resolveWorkspace` (an unaccepted membership is not
 * yet treated as workspace access — see `resolveWorkspace`), so this
 * looks the membership up directly by (userId, workspaceId).
 */
async function acceptInvitation(
  userId: string,
  workspaceId: string,
): Promise<SafeWorkspaceMember> {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });

  if (!workspace || workspace.deletedAt) {
    throw new NotFoundError('Workspace not found');
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    include: { user: true },
  });

  if (!membership) {
    throw new NotFoundError('No invitation found for this workspace');
  }

  if (membership.acceptedAt) {
    return toSafeWorkspaceMember(membership);
  }

  const updated = await prisma.workspaceMember.update({
    where: { id: membership.id },
    data: { acceptedAt: new Date() },
    include: { user: true },
  });

  logger.info({ workspaceId, userId }, 'Workspace invitation accepted');

  return toSafeWorkspaceMember(updated);
}

/** Fetches a membership and confirms it belongs to `workspaceId`, treating a mismatch as 404 (never leaking cross-tenant existence). */
async function getMemberInWorkspace(
  workspaceId: string,
  memberId: string,
): Promise<WorkspaceMember & { user: User }> {
  const member = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
    include: { user: true },
  });

  if (!member || member.workspaceId !== workspaceId) {
    throw new NotFoundError('Workspace member not found');
  }

  return member;
}

async function countOwners(workspaceId: string, excludingMemberId?: string): Promise<number> {
  return prisma.workspaceMember.count({
    where: {
      workspaceId,
      role: WORKSPACE_ROLES.OWNER,
      ...(excludingMemberId ? { id: { not: excludingMemberId } } : {}),
    },
  });
}

async function updateMemberRole(
  workspaceId: string,
  caller: { userId: string; role: WorkspaceRole },
  memberId: string,
  newRole: WorkspaceRole,
): Promise<SafeWorkspaceMember> {
  const member = await getMemberInWorkspace(workspaceId, memberId);

  if (member.userId === caller.userId) {
    throw new ForbiddenError('You cannot change your own role — ask another Owner to do this');
  }

  // Granting Owner, or demoting an existing Owner, is Owner-only — an
  // Admin must never be able to escalate themselves/others to Owner or
  // strip an Owner's access.
  if (newRole === WORKSPACE_ROLES.OWNER && caller.role !== WORKSPACE_ROLES.OWNER) {
    throw new ForbiddenError('Only a workspace Owner can grant the Owner role');
  }
  if (member.role === WORKSPACE_ROLES.OWNER && caller.role !== WORKSPACE_ROLES.OWNER) {
    throw new ForbiddenError('Only a workspace Owner can change another Owner\u2019s role');
  }

  if (member.role === WORKSPACE_ROLES.OWNER && newRole !== WORKSPACE_ROLES.OWNER) {
    const remainingOwners = await countOwners(workspaceId, member.id);
    if (remainingOwners < 1) {
      throw new ConflictError('A workspace must always have at least one Owner');
    }
  }

  const updated = await prisma.workspaceMember.update({
    where: { id: member.id },
    data: { role: newRole },
    include: { user: true },
  });

  logger.info({ workspaceId, memberId, newRole }, 'Workspace member role updated');

  return toSafeWorkspaceMember(updated);
}

async function removeMember(
  workspaceId: string,
  caller: { userId: string; role: WorkspaceRole },
  memberId: string,
): Promise<void> {
  const member = await getMemberInWorkspace(workspaceId, memberId);

  if (member.userId === caller.userId) {
    throw new ForbiddenError(
      'You cannot remove yourself from the workspace using this endpoint',
    );
  }

  if (member.role === WORKSPACE_ROLES.OWNER) {
    if (caller.role !== WORKSPACE_ROLES.OWNER) {
      throw new ForbiddenError('Only a workspace Owner can remove another Owner');
    }

    const remainingOwners = await countOwners(workspaceId, member.id);
    if (remainingOwners < 1) {
      throw new ConflictError('Cannot remove the only Owner of a workspace');
    }
  }

  await prisma.workspaceMember.delete({ where: { id: member.id } });

  logger.info({ workspaceId, memberId }, 'Workspace member removed');
}

export const memberService = {
  listMembers,
  listPendingInvitationsForUser,
  inviteMember,
  acceptInvitation,
  updateMemberRole,
  removeMember,
};
