// backend/src/modules/leads/routes/lead.routes.ts
import { PERMISSIONS } from '@common/constants';
import { requireAuth, requirePermission, resolveWorkspace, validate } from '@common/middlewares';
import { asyncHandler } from '@shared/utils';
import { Router } from 'express';

import { leadController } from '../controller/lead.controller';
import {
  leadIdParamSchema,
  createLeadSchema,
  listLeadsQuerySchema,
  updateLeadSchema,
} from '../validators/lead.schema';

const router: Router = Router();

router.get(
  '/',
  requireAuth,
  validate({ query: listLeadsQuerySchema }),
  resolveWorkspace,
  asyncHandler(leadController.list),
);

router.post(
  '/',
  requireAuth,
  validate({ body: createLeadSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.LEAD_MANAGE),
  asyncHandler(leadController.create),
);

router.get(
  '/:id',
  requireAuth,
  validate({ params: leadIdParamSchema }),
  resolveWorkspace,
  asyncHandler(leadController.getOne),
);

router.patch(
  '/:id',
  requireAuth,
  validate({ params: leadIdParamSchema, body: updateLeadSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.LEAD_MANAGE),
  asyncHandler(leadController.update),
);

export { router as leadRoutes };
