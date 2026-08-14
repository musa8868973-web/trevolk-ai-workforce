// backend/src/routes/v1/index.ts
import { Router } from 'express';

import { aiEmployeeRoutes } from '@modules/ai-employees';
import { appointmentRoutes } from '@modules/appointments';
import { authRoutes } from '@modules/auth';
import { conversationRoutes } from '@modules/conversations';
import { customerRoutes } from '@modules/customers';
import { followupEmployeeRoutes } from '@modules/followup-employee';
import { healthRoutes } from '@modules/health';
import { leadRoutes } from '@modules/leads';
import { organizationRoutes } from '@modules/organizations';
import { receptionistEmployeeRoutes } from '@modules/receptionist-employee';
import { salesEmployeeRoutes } from '@modules/sales-employee';
import { supportEmployeeRoutes } from '@modules/support-employee';
import { workspaceRoutes } from '@modules/workspaces';
import { integrationRoutes } from '@modules/integrations';
import { analyticsRoutes } from '@modules/analytics';
import { auditLogRoutes } from '@modules/audit';

const router: Router = Router();

/**
 * API surface, per the Backend Specification §6.
 */
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/workspaces/:workspaceId/analytics', analyticsRoutes);
router.use('/workspaces/:workspaceId/audit-logs', auditLogRoutes);
router.use('/ai-employees', aiEmployeeRoutes);
router.use('/conversations', conversationRoutes);
router.use('/leads', leadRoutes);
router.use('/customers', customerRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/sales-employees', salesEmployeeRoutes);
router.use('/support-employees', supportEmployeeRoutes);
router.use('/receptionist-employees', receptionistEmployeeRoutes);
router.use('/followup-employees', followupEmployeeRoutes);
router.use('/integrations', integrationRoutes);

export { router as v1Router };
