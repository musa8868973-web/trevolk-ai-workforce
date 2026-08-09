import { z } from 'zod';

export const workspaceIdParamSchema = z.object({
  workspaceId: z.string().uuid('A valid workspace ID is required'),
});
export type WorkspaceIdParam = z.infer<typeof workspaceIdParamSchema>;

/**
 * Free-form `branding` / `defaultWorkingHours` are stored as `jsonb`
 * (Database Design §5.3); accept any JSON-serializable object and
 * (de)serialize to/from the SQLite-compatible string column at the
 * service layer.
 */
const jsonObjectSchema = z.record(z.unknown());

export const createWorkspaceSchema = z.object({
  /** The organization this new workspace belongs to (Database Design §4.1: Business → Workspace is one-to-many). */
  organizationId: z.string().uuid('A valid organization ID is required'),
  name: z.string().trim().min(1, 'Workspace name is required').max(160),
  industry: z.string().trim().max(120).optional(),
  timezone: z.string().trim().min(1).max(64).optional(),
  branding: jsonObjectSchema.optional(),
  defaultWorkingHours: jsonObjectSchema.optional(),
});
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const updateWorkspaceSchema = z
  .object({
    name: z.string().trim().min(1).max(160).optional(),
    industry: z.string().trim().max(120).optional(),
    timezone: z.string().trim().min(1).max(64).optional(),
    branding: jsonObjectSchema.optional(),
    defaultWorkingHours: jsonObjectSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update the workspace',
  });
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
