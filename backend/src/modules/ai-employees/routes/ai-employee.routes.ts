import { PERMISSIONS } from '@common/constants';
import { requireAuth, requirePermission, resolveWorkspace, validate } from '@common/middlewares';
import { asyncHandler } from '@shared/utils';
import { Router } from 'express';

import { aiEmployeeController } from '../controller/ai-employee.controller';
import {
  aiEmployeeIdParamSchema,
  createAIEmployeeSchema,
  listAIEmployeesQuerySchema,
  updateAIEmployeeSchema,
} from '../validators/ai-employee.schema';

const router: Router = Router();

/**
 * AI Employee endpoints (Backend Specification §5.3, §6.3; Phase 5A §7).
 * Unlike `/workspaces/:workspaceId/...`, these routes carry no workspace
 * segment in the path — the active workspace is resolved by
 * `resolveWorkspace` from the `X-Workspace-Id` header (same middleware,
 * same guarantee: membership is independently re-verified server-side on
 * every request, never trusted from the client — Phase 5A §5, §12).
 *
 * Read access (list/get) only requires confirmed workspace membership.
 * Write access (create/update, which includes activate/deactivate via a
 * `status` field — Phase 5A §6) additionally requires the
 * `ai_employee:manage` permission, granted to Owner/Admin only (Backend
 * Specification §2.5, §5.3 — "sensitive actions ... restricted to
 * Owner/Admin").
 */

/**
 * GET /api/v1/ai-employees
 * Lists AI Employees for the resolved workspace, optionally filtered by
 * `employeeType`/`status`.
 */
router.get(
  '/',
  requireAuth,
  validate({ query: listAIEmployeesQuerySchema }),
  resolveWorkspace,
  asyncHandler(aiEmployeeController.list),
);

/**
 * POST /api/v1/ai-employees
 * Creates a new AI Employee instance in the resolved workspace. One
 * instance per `employeeType` per workspace at MVP (Database Design
 * §5.5).
 */
router.post(
  '/',
  requireAuth,
  validate({ body: createAIEmployeeSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.AI_EMPLOYEE_MANAGE),
  asyncHandler(aiEmployeeController.create),
);

/**
 * GET /api/v1/ai-employees/:id
 * Retrieves a single AI Employee, scoped to the resolved workspace.
 */
router.get(
  '/:id',
  requireAuth,
  validate({ params: aiEmployeeIdParamSchema }),
  resolveWorkspace,
  asyncHandler(aiEmployeeController.getOne),
);

/**
 * PATCH /api/v1/ai-employees/:id
 * Updates an AI Employee's name/description/configuration, and/or
 * transitions its `status` (this is the activate/deactivate mechanism —
 * Phase 5A §6 — rather than a separate endpoint, per Phase 5A §7's
 * explicit route list).
 */
router.patch(
  '/:id',
  requireAuth,
  validate({ params: aiEmployeeIdParamSchema, body: updateAIEmployeeSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.AI_EMPLOYEE_MANAGE),
  asyncHandler(aiEmployeeController.update),
);

export { router as aiEmployeeRoutes };
