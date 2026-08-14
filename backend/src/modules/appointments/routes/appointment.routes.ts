// backend/src/modules/appointments/routes/appointment.routes.ts
import { PERMISSIONS } from '@common/constants';
import { requireAuth, requirePermission, resolveWorkspace, validate } from '@common/middlewares';
import { asyncHandler } from '@shared/utils';
import { Router } from 'express';

import { appointmentController } from '../controller/appointment.controller';
import {
  appointmentIdParamSchema,
  createAppointmentSchema,
  listAppointmentsQuerySchema,
  updateAppointmentSchema,
} from '../validators/appointment.schema';

const router: Router = Router();

router.get(
  '/',
  requireAuth,
  validate({ query: listAppointmentsQuerySchema }),
  resolveWorkspace,
  asyncHandler(appointmentController.list),
);

router.post(
  '/',
  requireAuth,
  validate({ body: createAppointmentSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.APPOINTMENT_MANAGE),
  asyncHandler(appointmentController.create),
);

router.get(
  '/:id',
  requireAuth,
  validate({ params: appointmentIdParamSchema }),
  resolveWorkspace,
  asyncHandler(appointmentController.getOne),
);

router.patch(
  '/:id',
  requireAuth,
  validate({ params: appointmentIdParamSchema, body: updateAppointmentSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.APPOINTMENT_MANAGE),
  asyncHandler(appointmentController.update),
);

router.delete(
  '/:id',
  requireAuth,
  validate({ params: appointmentIdParamSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.APPOINTMENT_MANAGE),
  asyncHandler(appointmentController.cancel),
);

export { router as appointmentRoutes };
