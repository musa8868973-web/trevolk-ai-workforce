import { WORKSPACE_ROLES } from '@common/constants';
import { ForbiddenError, NotFoundError } from '@common/errors';
import { prisma } from '@database/index';
import { logger } from '@shared/logger';

import {
  toSafeWorkspace,
  toWorkspaceWithMembership,
  type SafeWorkspace,
  type WorkspaceWithMembership,
} from '../mappers/workspace.mapper';
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from '../validators/workspace.schema';

/**
 * Business logic for the Workspace module (Backend Specification §5.2,
 * Phase 4 §4). Workspace access is never trusted from the caller — every
 * function here either receives an already-membership-verified
 * `workspaceId` (from `resolveWorkspace`) or independently re-checks
 * ownership (workspace creation), per Phase 4 §5 and §16.
 */

/** Lists every workspace the caller belongs to (accepted or still-pending invitations), with their role. */
async function listWorkspacesForUser(userId: string): Promise<WorkspaceWithMembership[]> {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: { workspace: true },
  });

  return memberships
    .filter((membership) => !membership.workspace.deletedAt)
    .map((membership) => toWorkspaceWithMembership(membership));
}

/**
 * Creates an additional workspace under an existing organization
 * (Database Design §4.1 — Business → Workspace is one-to-many).
 * Restricted to the organization's owner, and the creator is enrolled as
 * that workspace's Owner in the same transaction — mirroring the
 * registration flow in `authService.register`.
 */
async function createWorkspace(
  userId: string,
  input: CreateWorkspaceInput,
): Promise<WorkspaceWithMembership> {
  const organization = await prisma.organization.findUnique({
    where: { id: input.organizationId },
  });

  if (!organization) {
    throw new NotFoundError('Organization not found');
  }

  if (organization.ownerUserId !== userId) {
    throw new ForbiddenError('Only the organization owner can create a new workspace');
  }

  const { workspace, membership } = await prisma.$transaction(async (tx) => {
    const createdWorkspace = await tx.workspace.create({
      data: {
        organizationId: organization.id,
        name: input.name,
        industry: input.industry ?? null,
        timezone: input.timezone ?? 'UTC',
        branding: input.branding ? JSON.stringify(input.branding) : null,
        defaultWorkingHours: input.defaultWorkingHours
          ? JSON.stringify(input.defaultWorkingHours)
          : null,
      },
    });

    const createdMembership = await tx.workspaceMember.create({
      data: {
        userId,
        workspaceId: createdWorkspace.id,
        role: WORKSPACE_ROLES.OWNER,
        acceptedAt: new Date(),
      },
    });

    return { workspace: createdWorkspace, membership: createdMembership };
  });

  logger.info({ workspaceId: workspace.id, organizationId: organization.id }, 'Workspace created');

  return toWorkspaceWithMembership({ ...membership, workspace });
}

/**
 * Fetches a workspace's detail. The caller's membership has already been
 * verified by `resolveWorkspace` before this is reached, so this is a
 * straightforward lookup rather than an authorization decision.
 */
async function getWorkspace(workspaceId: string): Promise<SafeWorkspace> {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });

  if (!workspace || workspace.deletedAt) {
    throw new NotFoundError('Workspace not found');
  }

  return toSafeWorkspace(workspace);
}

/** Updates workspace profile/settings fields. Caller's Owner/Admin role is enforced by route middleware. */
async function updateWorkspace(
  workspaceId: string,
  input: UpdateWorkspaceInput,
): Promise<SafeWorkspace> {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });

  if (!workspace || workspace.deletedAt) {
    throw new NotFoundError('Workspace not found');
  }

  const updated = await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.industry !== undefined ? { industry: input.industry } : {}),
      ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
      ...(input.branding !== undefined ? { branding: JSON.stringify(input.branding) } : {}),
      ...(input.defaultWorkingHours !== undefined
        ? { defaultWorkingHours: JSON.stringify(input.defaultWorkingHours) }
        : {}),
    },
  });

  logger.info({ workspaceId }, 'Workspace updated');

  return toSafeWorkspace(updated);
}

export const workspaceService = {
  listWorkspacesForUser,
  createWorkspace,
  getWorkspace,
  updateWorkspace,
};
