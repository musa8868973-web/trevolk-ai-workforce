// backend/src/modules/sales-employee/routes/sales-employee.routes.ts
import { PERMISSIONS } from '@common/constants';
import { requireAuth, requirePermission, resolveWorkspace, validate } from '@common/middlewares';
import { asyncHandler } from '@shared/utils';
import { Router } from 'express';

import { salesEmployeeController } from '../controller/sales-employee.controller';
import {
  aiEmployeeIdParamSchema,
  bookSalesAppointmentSchema,
  createAIEmployeeSchema,
  listAIEmployeesQuerySchema,
  qualifyLeadSchema,
  updateAIEmployeeSchema,
} from '../validators/sales-employee.schema';

const router: Router = Router();

router.get(
  '/',
  requireAuth,
  validate({ query: listAIEmployeesQuerySchema }),
  resolveWorkspace,
  asyncHandler(salesEmployeeController.list),
);

router.post(
  '/',
  requireAuth,
  validate({ body: createAIEmployeeSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.SALES_EMPLOYEE_MANAGE),
  asyncHandler(salesEmployeeController.create),
);

router.post(
  '/qualify-lead',
  requireAuth,
  validate({ body: qualifyLeadSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.SALES_EMPLOYEE_QUALIFY),
  asyncHandler(salesEmployeeController.qualifyLead),
);

router.post(
  '/book-appointment',
  requireAuth,
  validate({ body: bookSalesAppointmentSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.SALES_EMPLOYEE_BOOK),
  asyncHandler(salesEmployeeController.bookAppointment),
);

router.get(
  '/:id',
  requireAuth,
  validate({ params: aiEmployeeIdParamSchema }),
  resolveWorkspace,
  asyncHandler(salesEmployeeController.getOne),
);

router.patch(
  '/:id',
  requireAuth,
  validate({ params: aiEmployeeIdParamSchema, body: updateAIEmployeeSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.SALES_EMPLOYEE_MANAGE),
  asyncHandler(salesEmployeeController.update),
);

export { router as salesEmployeeRoutes };
