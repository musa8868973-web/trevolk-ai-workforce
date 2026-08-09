import { requireAuth, validate } from '@common/middlewares';
import { asyncHandler } from '@shared/utils';
import { Router } from 'express';

import { organizationController } from '../controller/organization.controller';
import { organizationIdParamSchema, updateOrganizationSchema } from '../validators/organization.schema';

const router = Router();

/**
 * Organization/business endpoints (Phase 4 §2–3, §13).
 *
 * There is deliberately no `POST /organizations` here: registration
 * (Phase 3, `POST /auth/register`) already provisions the caller's first
 * Organization + Workspace as Owner, which is the only creation path the
 * Frontend/Backend Specifications call for at MVP scope. Authorization for
 * both routes below is resolved inside the service layer (organization
 * ownership doesn't map to a workspace role, so it isn't gated by
 * `resolveWorkspace`/`requireRole`).
 */

/**
 * GET /api/v1/organizations/:id
 * Requires authentication. Visible to the organization's owner or any
 * member of one of its workspaces; anyone else gets a 404.
 */
router.get(
  '/:id',
  requireAuth,
  validate({ params: organizationIdParamSchema }),
  asyncHandler(organizationController.getOne),
);

/**
 * PATCH /api/v1/organizations/:id
 * Requires authentication. Restricted to the organization's owner.
 */
router.patch(
  '/:id',
  requireAuth,
  validate({ params: organizationIdParamSchema, body: updateOrganizationSchema }),
  asyncHandler(organizationController.update),
);

export { router as organizationRoutes };
