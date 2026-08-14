import { authRateLimit, requireAuth, validate } from '@common/middlewares';
import { asyncHandler } from '@shared/utils';
import { Router } from 'express';

import { authController } from '../controller/auth.controller';
import {
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
} from '../validators/auth.schema';

const router: Router = Router();

/**
 * POST /api/v1/auth/register
 * Public. Creates a User plus their first Organization/Workspace (Owner).
 */
router.post(
  '/register',
  authRateLimit,
  validate({ body: registerSchema }),
  asyncHandler(authController.register),
);

/**
 * POST /api/v1/auth/login
 * Public. Returns an access/refresh token pair on success.
 */
router.post(
  '/login',
  authRateLimit,
  validate({ body: loginSchema }),
  asyncHandler(authController.login),
);

/**
 * POST /api/v1/auth/refresh
 * Public (requires a valid refresh token in the body, not an access token).
 * Rotates the presented refresh token and returns a new pair.
 */
router.post(
  '/refresh',
  authRateLimit,
  validate({ body: refreshTokenSchema }),
  asyncHandler(authController.refresh),
);

/**
 * POST /api/v1/auth/logout
 * Requires a valid access token. Revokes the presented refresh token, or
 * every active session for the caller if none is presented.
 */
router.post(
  '/logout',
  requireAuth,
  validate({ body: logoutSchema }),
  asyncHandler(authController.logout),
);

/**
 * GET /api/v1/auth/me
 * Requires a valid access token. Returns the caller's profile and
 * workspace memberships/roles.
 */
router.get('/me', requireAuth, asyncHandler(authController.me));

export { router as authRoutes };
