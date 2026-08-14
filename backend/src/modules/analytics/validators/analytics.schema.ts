// backend/src/modules/analytics/validators/analytics.schema.ts
import { z } from 'zod';

export const workspaceAnalyticsParamSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID format'),
});

export type WorkspaceAnalyticsParam = z.infer<typeof workspaceAnalyticsParamSchema>;

export const analyticsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  days: z.coerce.number().int().positive().optional().default(30),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
