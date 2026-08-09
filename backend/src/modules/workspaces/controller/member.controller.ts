import { HTTP_STATUS } from '@common/constants';
import { ForbiddenError, UnauthorizedError } from '@common/errors';
import { sendSuccess } from '@common/response';
import type { Request, Response } from 'express';

import { memberService } from '../services/member.service';
import type { InviteMemberInput, MemberIdParam, UpdateMemberRoleInput } from '../validators/member.schema';
import type { WorkspaceIdParam } from '../validators/workspace.schema';

function requireAuthUserId(req: Request): string {
  if (!req.auth) {
    throw new UnauthorizedError('Authentication required');
  }
  return req.auth.userId;
}

function requireWorkspaceContext(req: Request): { workspaceId: string; role: string } {
  if (!req.workspace) {
    throw new ForbiddenError('Workspace context is required for this action');
  }
  return req.workspace;
}

async function list(req: Request, res: Response): Promise<Response> {
  const { workspaceId } = requireWorkspaceContext(req);
  const members = await memberService.listMembers(workspaceId);

  return sendSuccess(res, {
    data: members,
    message: 'Workspace members retrieved successfully',
  });
}

async function listMyInvitations(req: Request, res: Response): Promise<Response> {
  const userId = requireAuthUserId(req);
  const invitations = await memberService.listPendingInvitationsForUser(userId);

  return sendSuccess(res, {
    data: invitations,
    message: 'Pending invitations retrieved successfully',
  });
}

async function invite(req: Request, res: Response): Promise<Response> {
  const { workspaceId, role } = requireWorkspaceContext(req);
  const input = req.body as InviteMemberInput;

  const member = await memberService.inviteMember(
    workspaceId,
    role as 'OWNER' | 'ADMIN' | 'TEAM_MEMBER',
    input,
  );

  return sendSuccess(res, {
    data: member,
    message: 'Invitation sent successfully',
    statusCode: HTTP_STATUS.CREATED,
  });
}

async function accept(req: Request, res: Response): Promise<Response> {
  const userId = requireAuthUserId(req);
  const { workspaceId } = req.params as unknown as WorkspaceIdParam;

  const member = await memberService.acceptInvitation(userId, workspaceId);

  return sendSuccess(res, {
    data: member,
    message: 'Invitation accepted successfully',
  });
}

async function updateRole(req: Request, res: Response): Promise<Response> {
  const { workspaceId, role } = requireWorkspaceContext(req);
  const userId = requireAuthUserId(req);
  const { memberId } = req.params as unknown as MemberIdParam;
  const { role: newRole } = req.body as UpdateMemberRoleInput;

  const member = await memberService.updateMemberRole(
    workspaceId,
    { userId, role: role as 'OWNER' | 'ADMIN' | 'TEAM_MEMBER' },
    memberId,
    newRole as 'OWNER' | 'ADMIN' | 'TEAM_MEMBER',
  );

  return sendSuccess(res, {
    data: member,
    message: 'Member role updated successfully',
  });
}

async function remove(req: Request, res: Response): Promise<Response> {
  const { workspaceId, role } = requireWorkspaceContext(req);
  const userId = requireAuthUserId(req);
  const { memberId } = req.params as unknown as MemberIdParam;

  await memberService.removeMember(
    workspaceId,
    { userId, role: role as 'OWNER' | 'ADMIN' | 'TEAM_MEMBER' },
    memberId,
  );

  return sendSuccess(res, {
    data: null,
    message: 'Member removed successfully',
  });
}

export const memberController = { list, listMyInvitations, invite, accept, updateRole, remove };
