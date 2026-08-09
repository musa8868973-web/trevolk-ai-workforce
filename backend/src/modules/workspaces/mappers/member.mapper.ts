import type { User, WorkspaceMember } from '@prisma/client';

export interface SafeWorkspaceMember {
  id: string;
  workspaceId: string;
  role: string;
  invitedAt: Date;
  acceptedAt: Date | null;
  status: 'ACTIVE' | 'PENDING';
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

export function toSafeWorkspaceMember(
  membership: WorkspaceMember & { user: User },
): SafeWorkspaceMember {
  return {
    id: membership.id,
    workspaceId: membership.workspaceId,
    role: membership.role,
    invitedAt: membership.invitedAt,
    acceptedAt: membership.acceptedAt,
    status: membership.acceptedAt ? 'ACTIVE' : 'PENDING',
    user: {
      id: membership.user.id,
      name: membership.user.name,
      email: membership.user.email,
      avatarUrl: membership.user.avatarUrl,
    },
  };
}
