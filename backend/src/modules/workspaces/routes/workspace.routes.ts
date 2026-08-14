import { PERMISSIONS } from '@common/constants';
import { requireAuth, requirePermission, resolveWorkspace, validate } from '@common/middlewares';
import { asyncHandler } from '@shared/utils';
import { Router } from 'express';

import { memberController } from '../controller/member.controller';
import { workspaceController } from '../controller/workspace.controller';
import {
  inviteMemberSchema,
  memberIdParamSchema,
  updateMemberRoleSchema,
} from '../validators/member.schema';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceIdParamSchema,
} from '../validators/workspace.schema';

const router: Router = Router();

/**
 * Workspace + team-member endpoints (Backend Specification §5.2, §6.2–6.3;
 * Phase 4 §4–8, §13). Every route below `/:workspaceId` runs
 * `resolveWorkspace`, which independently re-verifies the caller's
 * membership (and acceptance status) against the *path* `workspaceId` on
 * every request — the multi-tenant isolation guarantee never depends on
 * an ID the frontend merely "remembers" being allowed to use (Phase 4 §5,
 * §11).
 */

/**
 * GET /api/v1/workspaces
 * Requires authentication. Lists every workspace the caller belongs to
 * (accepted or still-pending), with their role in each.
 */
router.get('/', requireAuth, asyncHandler(workspaceController.list));

/**
 * GET /api/v1/workspaces/invitations
 * Requires authentication. Lists the caller's own pending invitations
 * across every workspace. Mounted before `/:workspaceId` so the literal
 * segment isn't swallowed by the dynamic route.
 */
router.get('/invitations', requireAuth, asyncHandler(memberController.listMyInvitations));

/**
 * POST /api/v1/workspaces
 * Requires authentication. Creates an additional workspace under an
 * existing organization — restricted to that organization's owner
 * (verified in the service layer, since the caller has no membership in
 * the not-yet-created workspace to resolve against).
 */
router.post(
  '/',
  requireAuth,
  validate({ body: createWorkspaceSchema }),
  asyncHandler(workspaceController.create),
);

/**
 * GET /api/v1/workspaces/:workspaceId
 * Requires authentication + confirmed (accepted) membership in the
 * workspace.
 */
router.get(
  '/:workspaceId',
  requireAuth,
  validate({ params: workspaceIdParamSchema }),
  resolveWorkspace,
  asyncHandler(workspaceController.getOne),
);

/**
 * PATCH /api/v1/workspaces/:workspaceId
 * Requires authentication + Owner/Admin permission in the workspace
 * (`workspace:manage`).
 */
router.patch(
  '/:workspaceId',
  requireAuth,
  validate({ params: workspaceIdParamSchema, body: updateWorkspaceSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.WORKSPACE_MANAGE),
  asyncHandler(workspaceController.update),
);

/**
 * POST /api/v1/workspaces/:workspaceId/members/accept
 * Requires authentication only — the caller's membership is, by
 * definition, not yet accepted, so this intentionally does NOT run
 * `resolveWorkspace` (which would reject an unaccepted membership).
 */
router.post(
  '/:workspaceId/members/accept',
  requireAuth,
  validate({ params: workspaceIdParamSchema }),
  asyncHandler(memberController.accept),
);

/**
 * GET /api/v1/workspaces/:workspaceId/members
 * Requires authentication + confirmed membership in the workspace.
 */
router.get(
  '/:workspaceId/members',
  requireAuth,
  validate({ params: workspaceIdParamSchema }),
  resolveWorkspace,
  asyncHandler(memberController.list),
);

/**
 * POST /api/v1/workspaces/:workspaceId/members/invite
 * Requires authentication + Owner/Admin permission (`team:manage`).
 */
router.post(
  '/:workspaceId/members/invite',
  requireAuth,
  validate({ params: workspaceIdParamSchema, body: inviteMemberSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.TEAM_MANAGE),
  asyncHandler(memberController.invite),
);

/**
 * PATCH /api/v1/workspaces/:workspaceId/members/:memberId
 * Requires authentication + Owner/Admin permission (`team:manage`).
 * Additional privilege-escalation checks (granting/demoting Owner,
 * self-role-change, last-Owner protection) live in the service layer.
 */
router.patch(
  '/:workspaceId/members/:memberId',
  requireAuth,
  validate({ params: memberIdParamSchema, body: updateMemberRoleSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.TEAM_MANAGE),
  asyncHandler(memberController.updateRole),
);

/**
 * DELETE /api/v1/workspaces/:workspaceId/members/:memberId
 * Requires authentication + Owner/Admin permission (`team:manage`).
 */
router.delete(
  '/:workspaceId/members/:memberId',
  requireAuth,
  validate({ params: memberIdParamSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.TEAM_MANAGE),
  asyncHandler(memberController.remove),
);

export { router as workspaceRoutes };
