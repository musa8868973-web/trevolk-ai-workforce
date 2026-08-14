// backend/src/modules/health/routes/health.routes.ts
import { asyncHandler } from '@shared/utils';
import { Router } from 'express';

import { healthController } from '../controller/health.controller';

const router: Router = Router();

/**
 * GET /api/v1/health (Liveness Probe)
 * GET /api/v1/health/ready (Readiness Probe)
 * Public — no auth required. Used by Kubernetes / Docker / AWS ALB probes.
 */
router.get('/', asyncHandler(healthController.check));
router.get('/ready', asyncHandler(healthController.readiness));

export { router as healthRoutes };
