// backend/src/modules/support-employee/routes/support-employee.routes.ts
import { PERMISSIONS } from '@common/constants';
import { requireAuth, requirePermission, resolveWorkspace, validate } from '@common/middlewares';
import { asyncHandler } from '@shared/utils';
import { Router } from 'express';

import { supportEmployeeController } from '../controller/support-employee.controller';
import {
  aiEmployeeIdParamSchema,
  answerFaqSchema,
  createAIEmployeeSchema,
  handleEscalationSchema,
  listAIEmployeesQuerySchema,
  updateAIEmployeeSchema,
} from '../validators/support-employee.schema';

const router: Router = Router();

router.get(
  '/',
  requireAuth,
  validate({ query: listAIEmployeesQuerySchema }),
  resolveWorkspace,
  asyncHandler(supportEmployeeController.list),
);

router.post(
  '/',
  requireAuth,
  validate({ body: createAIEmployeeSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.SUPPORT_EMPLOYEE_MANAGE),
  asyncHandler(supportEmployeeController.create),
);

router.post(
  '/answer-faq',
  requireAuth,
  validate({ body: answerFaqSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.SUPPORT_EMPLOYEE_FAQ),
  asyncHandler(supportEmployeeController.answerFaq),
);

router.post(
  '/escalate',
  requireAuth,
  validate({ body: handleEscalationSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.CONVERSATION_MANAGE),
  asyncHandler(supportEmployeeController.handleEscalation),
);

router.get(
  '/:id',
  requireAuth,
  validate({ params: aiEmployeeIdParamSchema }),
  resolveWorkspace,
  asyncHandler(supportEmployeeController.getOne),
);

router.patch(
  '/:id',
  requireAuth,
  validate({ params: aiEmployeeIdParamSchema, body: updateAIEmployeeSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.SUPPORT_EMPLOYEE_MANAGE),
  asyncHandler(supportEmployeeController.update),
);

export { router as supportEmployeeRoutes };
