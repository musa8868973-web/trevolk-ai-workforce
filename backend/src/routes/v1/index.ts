import { authRoutes } from '@modules/auth';
import { healthRoutes } from '@modules/health';
import { organizationRoutes } from '@modules/organizations';
import { workspaceRoutes } from '@modules/workspaces';
import { Router } from 'express';

const router = Router();

/**
 * API surface, per the Backend Specification §6. Phase 3 adds the
 * Authentication module (`/auth`); Phase 4 adds Organization/Business and
 * Workspace + team management (`/organizations`, `/workspaces`).
 * Remaining domains are mounted in later phases:
 *   /employees, /conversations, /leads, /customers, /appointments,
 *   /knowledge-base, /analytics, /integrations
 */
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/workspaces', workspaceRoutes);

export { router as v1Router };
