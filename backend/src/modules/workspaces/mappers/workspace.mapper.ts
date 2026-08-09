import type { Workspace, WorkspaceMember } from '@prisma/client';

export interface SafeWorkspace {
  id: string;
  organizationId: string;
  name: string;
  industry: string | null;
  timezone: string;
  branding: Record<string, unknown> | null;
  defaultWorkingHours: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Parses a jsonb-as-string column back into an object; tolerant of null/malformed values. */
function parseJsonColumn(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function toSafeWorkspace(workspace: Workspace): SafeWorkspace {
  return {
    id: workspace.id,
    organizationId: workspace.organizationId,
    name: workspace.name,
    industry: workspace.industry,
    timezone: workspace.timezone,
    branding: parseJsonColumn(workspace.branding),
    defaultWorkingHours: parseJsonColumn(workspace.defaultWorkingHours),
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  };
}

/** A workspace the caller belongs to, alongside their own role/membership status in it. */
export interface WorkspaceWithMembership extends SafeWorkspace {
  role: string;
  membershipStatus: 'ACTIVE' | 'PENDING';
}

export function toWorkspaceWithMembership(
  membership: WorkspaceMember & { workspace: Workspace },
): WorkspaceWithMembership {
  return {
    ...toSafeWorkspace(membership.workspace),
    role: membership.role,
    membershipStatus: membership.acceptedAt ? 'ACTIVE' : 'PENDING',
  };
}
