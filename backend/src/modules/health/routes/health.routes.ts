import { asyncHandler } from '@shared/utils';
import { Router } from 'express';

import { healthController } from '../controller/health.controller';

const router = Router();

/**
 * GET /api/v1/health
 * Public — no auth required. Used by uptime monitors and load balancers.
 */
router.get('/', asyncHandler(healthController.check));

export { router as healthRoutes };
