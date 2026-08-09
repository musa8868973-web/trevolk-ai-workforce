/**
 * Workspace-level roles, per Backend Specification §2.5 and
 * Database Design §5.4 (WorkspaceMember.role).
 *
 * Values match `WorkspaceMember.role` exactly as persisted in the database
 * (see `prisma/schema.prisma` default and `prisma/seed.ts`), so the app
 * layer never needs a translation step between the two.
 */
export const WORKSPACE_ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  TEAM_MEMBER: 'TEAM_MEMBER',
} as const;

export type WorkspaceRole = (typeof WORKSPACE_ROLES)[keyof typeof WORKSPACE_ROLES];

/** All known workspace roles, in no particular priority order. */
export const ALL_WORKSPACE_ROLES: WorkspaceRole[] = Object.values(WORKSPACE_ROLES);
