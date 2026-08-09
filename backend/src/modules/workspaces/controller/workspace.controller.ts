import { HTTP_STATUS } from '@common/constants';
import { UnauthorizedError } from '@common/errors';
import { sendSuccess } from '@common/response';
import type { Request, Response } from 'express';

import { workspaceService } from '../services/workspace.service';
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceIdParam,
} from '../validators/workspace.schema';

function requireAuthUserId(req: Request): string {
  if (!req.auth) {
    throw new UnauthorizedError('Authentication required');
  }
  return req.auth.userId;
}

async function list(req: Request, res: Response): Promise<Response> {
  const userId = requireAuthUserId(req);
  const workspaces = await workspaceService.listWorkspacesForUser(userId);

  return sendSuccess(res, {
    data: workspaces,
    message: 'Workspaces retrieved successfully',
  });
}

async function create(req: Request, res: Response): Promise<Response> {
  const userId = requireAuthUserId(req);
  const input = req.body as CreateWorkspaceInput;

  const workspace = await workspaceService.createWorkspace(userId, input);

  return sendSuccess(res, {
    data: workspace,
    message: 'Workspace created successfully',
    statusCode: HTTP_STATUS.CREATED,
  });
}

async function getOne(req: Request, res: Response): Promise<Response> {
  const { workspaceId } = req.params as unknown as WorkspaceIdParam;
  const workspace = await workspaceService.getWorkspace(workspaceId);

  return sendSuccess(res, {
    data: workspace,
    message: 'Workspace retrieved successfully',
  });
}

async function update(req: Request, res: Response): Promise<Response> {
  const { workspaceId } = req.params as unknown as WorkspaceIdParam;
  const input = req.body as UpdateWorkspaceInput;

  const workspace = await workspaceService.updateWorkspace(workspaceId, input);

  return sendSuccess(res, {
    data: workspace,
    message: 'Workspace updated successfully',
  });
}

export const workspaceController = { list, create, getOne, update };
