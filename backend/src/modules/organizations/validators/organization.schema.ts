import { z } from 'zod';

export const organizationIdParamSchema = z.object({
  id: z.string().uuid('A valid organization ID is required'),
});
export type OrganizationIdParam = z.infer<typeof organizationIdParamSchema>;

/**
 * Business/organization profile fields, per Database Design §5.2 and the
 * Phase 4 spec's "Business Information" list. Deliberately limited to
 * fields that already exist on the `Organization` model — no new fields
 * are invented.
 */
export const updateOrganizationSchema = z
  .object({
    name: z.string().trim().min(1, 'Business name is required').max(160).optional(),
    industry: z.string().trim().max(120).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update the organization',
  });
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
