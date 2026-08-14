// backend/src/modules/leads/validators/lead.schema.ts
import { z } from 'zod';

const leadStatusEnum = z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'DISQUALIFIED', 'CONVERTED']);

export const leadIdParamSchema = z.object({
  id: z.string().uuid('Valid Lead ID is required'),
});
export type LeadIdParam = z.infer<typeof leadIdParamSchema>;

export const createLeadSchema = z.object({
  aiEmployeeId: z.string().uuid().optional().nullable(),
  customerId: z.string().uuid().optional().nullable(),
  status: leadStatusEnum.optional(),
  score: z.string().optional().nullable(),
  qualificationAnswers: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  assignedUserId: z.string().uuid().optional().nullable(),
});
export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = z
  .object({
    status: leadStatusEnum.optional(),
    score: z.string().optional().nullable(),
    assignedUserId: z.string().uuid().optional().nullable(),
    source: z.string().optional().nullable(),
    qualificationAnswers: z.string().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

export const listLeadsQuerySchema = z.object({
  status: leadStatusEnum.optional(),
  assignedUserId: z.string().uuid().optional(),
});
export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;
