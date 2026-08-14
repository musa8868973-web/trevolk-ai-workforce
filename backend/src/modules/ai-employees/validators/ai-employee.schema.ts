import { z } from 'zod';

import { USER_SETTABLE_AI_EMPLOYEE_STATUSES } from '../constants/employee-status.constants';
import { ALL_AI_EMPLOYEE_TYPES } from '../constants/employee-type.constants';

export const aiEmployeeIdParamSchema = z.object({
  id: z.string().uuid('A valid AI Employee ID is required'),
});
export type AIEmployeeIdParam = z.infer<typeof aiEmployeeIdParamSchema>;

/**
 * `configuration` is stored as jsonb-as-string (Database Design §7.1;
 * `AIEmployeeConfiguration`). Accept any JSON-serializable object — same
 * pattern as `workspace.schema.ts`'s `branding`/`defaultWorkingHours` —
 * and (de)serialize at the service layer.
 *
 * SECURITY: this schema intentionally has no way to accept an API key or
 * provider credential; those are environment-only (Backend Specification
 * §2.7, §9; Phase 5A §8, §12). It does not attempt to detect/strip
 * secret-shaped values either — the guarantee here is architectural
 * (there is no field for it, and nothing in this module ever reads
 * `configuration` back out to call a provider), not a content filter.
 */
const configurationSchema = z.record(z.unknown());

export const employeeTypeSchema = z.enum(
  ALL_AI_EMPLOYEE_TYPES as [string, ...string[]],
  {
    errorMap: () => ({
      message: `employeeType must be one of: ${ALL_AI_EMPLOYEE_TYPES.join(', ')}`,
    }),
  },
);

const userSettableStatusSchema = z.enum(
  USER_SETTABLE_AI_EMPLOYEE_STATUSES as [string, ...string[]],
  {
    errorMap: () => ({
      message: `status must be one of: ${USER_SETTABLE_AI_EMPLOYEE_STATUSES.join(', ')}`,
    }),
  },
);

export const createAIEmployeeSchema = z.object({
  employeeType: employeeTypeSchema,
  name: z.string().trim().min(1, 'Name is required').max(160),
  description: z.string().trim().max(1000).optional(),
  configuration: configurationSchema.optional(),
});
export type CreateAIEmployeeInput = z.infer<typeof createAIEmployeeSchema>;

export const updateAIEmployeeSchema = z
  .object({
    name: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    status: userSettableStatusSchema.optional(),
    configuration: configurationSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update the AI Employee',
  });
export type UpdateAIEmployeeInput = z.infer<typeof updateAIEmployeeSchema>;

export const listAIEmployeesQuerySchema = z.object({
  employeeType: employeeTypeSchema.optional(),
  status: z.string().trim().min(1).max(40).optional(),
});
export type ListAIEmployeesQuery = z.infer<typeof listAIEmployeesQuerySchema>;
