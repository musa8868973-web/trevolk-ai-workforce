import { ForbiddenError, NotFoundError } from '@common/errors';
import { prisma } from '@database/index';
import { logger } from '@shared/logger';

import { toSafeOrganization, type SafeOrganization } from '../mappers/organization.mapper';
import type { UpdateOrganizationInput } from '../validators/organization.schema';

/**
 * Business logic for the Organization/Business module (Phase 4 §2–3).
 * Every `Business` in the PRD/Database Design maps 1:1 to the existing
 * `Organization` model (Phase 2) — no new model is introduced here.
 *
 * Organization creation itself is intentionally NOT re-implemented as a
 * standalone endpoint: `authService.register` (Phase 3) already
 * provisions the caller's first Organization + Workspace (as Owner) in a
 * single transaction, which is the only organization-creation path
 * required by the Frontend Specification (signup → workspace creation
 * wizard, §2.2). This module covers read/update of that existing
 * organization.
 */

/**
 * True if `userId` belongs to at least one workspace under `organizationId`.
 * Implemented as workspace-lookup + membership-lookup (rather than a
 * single nested-relation query) so it works uniformly against Prisma and
 * the in-memory test double used by the integration test suite.
 */
async function isMemberOfOrganization(userId: string, organizationId: string): Promise<boolean> {
  const workspacesInOrg = await prisma.workspace.findMany({ where: { organizationId } });

  for (const workspace of workspacesInOrg) {
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: workspace.id } },
    });
    if (membership) {
      return true;
    }
  }

  return false;
}

/**
 * Resolves an organization the caller is allowed to see: either they own
 * it, or they hold membership in at least one of its workspaces. Anyone
 * else gets a 404 (never a 403) so the endpoint doesn't leak which
 * organization IDs exist, matching the cross-tenant-safety convention
 * used throughout the backend (`common/errors/http-errors.ts`).
 */
async function getOrganizationForUser(
  organizationId: string,
  userId: string,
): Promise<SafeOrganization> {
  const organization = await prisma.organization.findUnique({ where: { id: organizationId } });

  if (!organization) {
    throw new NotFoundError('Organization not found');
  }

  if (organization.ownerUserId !== userId && !(await isMemberOfOrganization(userId, organizationId))) {
    throw new NotFoundError('Organization not found');
  }

  return toSafeOrganization(organization);
}

/**
 * Updates business profile fields. Restricted to the organization's
 * owner — per Phase 4 §16, a workspace Admin/Team Member must never be
 * able to modify a business they don't own, even if they belong to one of
 * its workspaces.
 */
async function updateOrganization(
  organizationId: string,
  userId: string,
  input: UpdateOrganizationInput,
): Promise<SafeOrganization> {
  const organization = await prisma.organization.findUnique({ where: { id: organizationId } });

  if (!organization) {
    throw new NotFoundError('Organization not found');
  }

  if (organization.ownerUserId !== userId) {
    // 404, not 403 — don't confirm existence to a non-owner who happens
    // to guess a valid organization ID and isn't otherwise a member.
    if (!(await isMemberOfOrganization(userId, organizationId))) {
      throw new NotFoundError('Organization not found');
    }

    throw new ForbiddenError('Only the organization owner can update the business profile');
  }

  const updated = await prisma.organization.update({
    where: { id: organizationId },
    data: input,
  });

  logger.info({ organizationId, userId }, 'Organization profile updated');

  return toSafeOrganization(updated);
}

export const organizationService = { getOrganizationForUser, updateOrganization };
