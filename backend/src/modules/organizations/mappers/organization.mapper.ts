import type { Organization } from '@prisma/client';

/**
 * Client-safe organization shape. Explicitly whitelists fields (same
 * pattern as `auth/mappers/user.mapper.ts`) so a future column added to
 * `Organization` doesn't leak to API responses by default.
 */
export interface SafeOrganization {
  id: string;
  name: string;
  industry: string | null;
  status: string;
  ownerUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toSafeOrganization(organization: Organization): SafeOrganization {
  return {
    id: organization.id,
    name: organization.name,
    industry: organization.industry,
    status: organization.status,
    ownerUserId: organization.ownerUserId,
    createdAt: organization.createdAt,
    updatedAt: organization.updatedAt,
  };
}
