// backend/src/modules/receptionist-employee/routes/receptionist-employee.routes.ts
import { PERMISSIONS } from '@common/constants';
import { requireAuth, requirePermission, resolveWorkspace, validate } from '@common/middlewares';
import { asyncHandler } from '@shared/utils';
import { Router } from 'express';

import { receptionistEmployeeController } from '../controller/receptionist-employee.controller';
import {
  aiEmployeeIdParamSchema,
  cancelAppointmentByReceptionistSchema,
  checkAvailabilitySchema,
  createAIEmployeeSchema,
  listAIEmployeesQuerySchema,
  receptionistBookAppointmentSchema,
  receptionistEscalationSchema,
  rescheduleAppointmentSchema,
  updateAIEmployeeSchema,
} from '../validators/receptionist-employee.schema';

const router: Router = Router();

router.get(
  '/',
  requireAuth,
  validate({ query: listAIEmployeesQuerySchema }),
  resolveWorkspace,
  asyncHandler(receptionistEmployeeController.list),
);

router.post(
  '/',
  requireAuth,
  validate({ body: createAIEmployeeSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.RECEPTIONIST_EMPLOYEE_MANAGE),
  asyncHandler(receptionistEmployeeController.create),
);

router.post(
  '/check-availability',
  requireAuth,
  validate({ body: checkAvailabilitySchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.RECEPTIONIST_EMPLOYEE_BOOK),
  asyncHandler(receptionistEmployeeController.checkAvailability),
);

router.post(
  '/book-appointment',
  requireAuth,
  validate({ body: receptionistBookAppointmentSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.RECEPTIONIST_EMPLOYEE_BOOK),
  asyncHandler(receptionistEmployeeController.bookAppointment),
);

router.post(
  '/reschedule-appointment',
  requireAuth,
  validate({ body: rescheduleAppointmentSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.RECEPTIONIST_EMPLOYEE_BOOK),
  asyncHandler(receptionistEmployeeController.rescheduleAppointment),
);

router.post(
  '/cancel-appointment',
  requireAuth,
  validate({ body: cancelAppointmentByReceptionistSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.RECEPTIONIST_EMPLOYEE_BOOK),
  asyncHandler(receptionistEmployeeController.cancelAppointment),
);

router.post(
  '/escalate',
  requireAuth,
  validate({ body: receptionistEscalationSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.CONVERSATION_MANAGE),
  asyncHandler(receptionistEmployeeController.escalate),
);

router.get(
  '/:id',
  requireAuth,
  validate({ params: aiEmployeeIdParamSchema }),
  resolveWorkspace,
  asyncHandler(receptionistEmployeeController.getOne),
);

router.patch(
  '/:id',
  requireAuth,
  validate({ params: aiEmployeeIdParamSchema, body: updateAIEmployeeSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.RECEPTIONIST_EMPLOYEE_MANAGE),
  asyncHandler(receptionistEmployeeController.update),
);

export { router as receptionistEmployeeRoutes };
