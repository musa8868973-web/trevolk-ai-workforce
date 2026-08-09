import type { User, WorkspaceMember } from '@prisma/client';

/**
 * Client-safe user shape — explicitly whitelists fields rather than
 * omitting `passwordHash`, so a future field added to `User` doesn't leak
 * to API responses by default.
 */
export interface SafeUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
  };
}

export interface WorkspaceMembershipSummary {
  workspaceId: string;
  workspaceName: string;
  organizationId: string;
  role: string;
}

export function toWorkspaceMembershipSummary(
  membership: WorkspaceMember & { workspace: { id: string; name: string; organizationId: string } },
): WorkspaceMembershipSummary {
  return {
    workspaceId: membership.workspace.id,
    workspaceName: membership.workspace.name,
    organizationId: membership.workspace.organizationId,
    role: membership.role,
  };
}
