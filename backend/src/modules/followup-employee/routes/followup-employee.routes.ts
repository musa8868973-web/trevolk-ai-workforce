// backend/src/modules/followup-employee/routes/followup-employee.routes.ts
import { PERMISSIONS } from '@common/constants';
import { requireAuth, requirePermission, resolveWorkspace, validate } from '@common/middlewares';
import { asyncHandler } from '@shared/utils';
import { Router } from 'express';

import { followupEmployeeController } from '../controller/followup-employee.controller';
import {
  aiEmployeeIdParamSchema,
  createAIEmployeeSchema,
  createFollowUpSchema,
  followUpIdParamSchema,
  listAIEmployeesQuerySchema,
  listFollowUpsQuerySchema,
  stopFollowUpSchema,
  updateAIEmployeeSchema,
  updateFollowUpSchema,
} from '../validators/followup-employee.schema';

const router: Router = Router();

router.get(
  '/',
  requireAuth,
  validate({ query: listAIEmployeesQuerySchema }),
  resolveWorkspace,
  asyncHandler(followupEmployeeController.listEmployees),
);

router.post(
  '/',
  requireAuth,
  validate({ body: createAIEmployeeSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.FOLLOWUP_EMPLOYEE_MANAGE),
  asyncHandler(followupEmployeeController.createEmployee),
);

router.get(
  '/follow-ups',
  requireAuth,
  validate({ query: listFollowUpsQuerySchema }),
  resolveWorkspace,
  asyncHandler(followupEmployeeController.listFollowUps),
);

router.post(
  '/follow-ups',
  requireAuth,
  validate({ body: createFollowUpSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.FOLLOWUP_EMPLOYEE_MANAGE),
  asyncHandler(followupEmployeeController.createFollowUp),
);

router.get(
  '/follow-ups/:id',
  requireAuth,
  validate({ params: followUpIdParamSchema }),
  resolveWorkspace,
  asyncHandler(followupEmployeeController.getFollowUp),
);

router.patch(
  '/follow-ups/:id',
  requireAuth,
  validate({ params: followUpIdParamSchema, body: updateFollowUpSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.FOLLOWUP_EMPLOYEE_MANAGE),
  asyncHandler(followupEmployeeController.updateFollowUp),
);

router.post(
  '/:id/trigger',
  requireAuth,
  validate({ params: followUpIdParamSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.FOLLOWUP_EMPLOYEE_TRIGGER),
  asyncHandler(followupEmployeeController.triggerFollowUp),
);

router.post(
  '/follow-ups/:id/trigger',
  requireAuth,
  validate({ params: followUpIdParamSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.FOLLOWUP_EMPLOYEE_TRIGGER),
  asyncHandler(followupEmployeeController.triggerFollowUp),
);

router.post(
  '/:id/stop',
  requireAuth,
  validate({ params: followUpIdParamSchema, body: stopFollowUpSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.FOLLOWUP_EMPLOYEE_MANAGE),
  asyncHandler(followupEmployeeController.stopFollowUp),
);

router.post(
  '/follow-ups/:id/stop',
  requireAuth,
  validate({ params: followUpIdParamSchema, body: stopFollowUpSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.FOLLOWUP_EMPLOYEE_MANAGE),
  asyncHandler(followupEmployeeController.stopFollowUp),
);

router.get(
  '/:id',
  requireAuth,
  validate({ params: aiEmployeeIdParamSchema }),
  resolveWorkspace,
  asyncHandler(followupEmployeeController.getEmployee),
);

router.patch(
  '/:id',
  requireAuth,
  validate({ params: aiEmployeeIdParamSchema, body: updateAIEmployeeSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.FOLLOWUP_EMPLOYEE_MANAGE),
  asyncHandler(followupEmployeeController.updateEmployee),
);

export { router as followupEmployeeRoutes };
