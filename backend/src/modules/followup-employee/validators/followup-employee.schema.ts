// backend/src/modules/followup-employee/validators/followup-employee.schema.ts
import { z } from 'zod';

import { FOLLOW_UP_STATUSES, FOLLOW_UP_TRIGGER_TYPES } from '../types/followup-employee.types';

export * from '@modules/ai-employees/validators/ai-employee.schema';
import { employeeTypeSchema } from '@modules/ai-employees/validators/ai-employee.schema';

export const createAIEmployeeSchema = z.object({
  employeeType: employeeTypeSchema.optional(),
  name: z.string().trim().min(1, 'Name is required').max(160),
  description: z.string().trim().max(1000).optional(),
  configuration: z.record(z.unknown()).optional(),
});
export type CreateAIEmployeeInput = z.infer<typeof createAIEmployeeSchema>;

const followUpTriggerTypeSchema = z.enum(FOLLOW_UP_TRIGGER_TYPES as [string, ...string[]], {
  errorMap: () => ({
    message: `triggerType must be one of: ${FOLLOW_UP_TRIGGER_TYPES.join(', ')}`,
  }),
});

const followUpStatusSchema = z.enum(FOLLOW_UP_STATUSES as [string, ...string[]], {
  errorMap: () => ({
    message: `status must be one of: ${FOLLOW_UP_STATUSES.join(', ')}`,
  }),
});

export const followUpIdParamSchema = z.object({
  id: z.string().uuid('A valid Follow-up ID is required'),
});
export type FollowUpIdParam = z.infer<typeof followUpIdParamSchema>;

export const createFollowUpSchema = z
  .object({
    aiEmployeeId: z.string().uuid().optional().nullable(),
    leadId: z.string().uuid().optional().nullable(),
    customerId: z.string().uuid().optional().nullable(),
    conversationId: z.string().uuid().optional().nullable(),
    appointmentId: z.string().uuid().optional().nullable(),
    triggerType: followUpTriggerTypeSchema,
    scheduledAt: z.string().datetime().optional().nullable(),
  })
  .refine(
    (data) =>
      Boolean(data.leadId || data.customerId || data.conversationId || data.appointmentId),
    { message: 'At least one of leadId, customerId, conversationId, or appointmentId is required' },
  );
export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;

export const updateFollowUpSchema = z
  .object({
    triggerType: followUpTriggerTypeSchema.optional(),
    scheduledAt: z.string().datetime().optional().nullable(),
    status: followUpStatusSchema.optional(),
    optedOut: z.boolean().optional(),
    stopReason: z.string().trim().max(2000).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update the follow-up',
  });
export type UpdateFollowUpInput = z.infer<typeof updateFollowUpSchema>;

export const listFollowUpsQuerySchema = z.object({
  status: followUpStatusSchema.optional(),
  leadId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),
  appointmentId: z.string().uuid().optional(),
  triggerType: followUpTriggerTypeSchema.optional(),
});
export type ListFollowUpsQuery = z.infer<typeof listFollowUpsQuerySchema>;

export const stopFollowUpSchema = z.object({
  reason: z.string().trim().min(1, 'Stop reason is required').max(2000),
});
export type StopFollowUpInput = z.infer<typeof stopFollowUpSchema>;
