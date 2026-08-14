import { HTTP_STATUS } from '@common/constants';
import { ForbiddenError } from '@common/errors';
import { sendSuccess } from '@common/response';
import type { Request, Response } from 'express';

import { aiEmployeeService } from '../services/ai-employee.service';
import type {
  AIEmployeeIdParam,
  CreateAIEmployeeInput,
  ListAIEmployeesQuery,
  UpdateAIEmployeeInput,
} from '../validators/ai-employee.schema';

/** Every route mounts `resolveWorkspace` before this controller, so `req.workspace` is always populated. */
function requireWorkspaceId(req: Request): string {
  if (!req.workspace) {
    throw new ForbiddenError('Workspace context is required for this action');
  }
  return req.workspace.workspaceId;
}

async function list(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const query = req.query as unknown as ListAIEmployeesQuery;

  const employees = await aiEmployeeService.listEmployees(workspaceId, query);

  return sendSuccess(res, {
    data: employees,
    message: 'AI Employees retrieved successfully',
  });
}

async function create(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const input = req.body as CreateAIEmployeeInput;

  const employee = await aiEmployeeService.createEmployee(workspaceId, input);

  return sendSuccess(res, {
    data: employee,
    message: 'AI Employee created successfully',
    statusCode: HTTP_STATUS.CREATED,
  });
}

async function getOne(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const { id } = req.params as unknown as AIEmployeeIdParam;

  const employee = await aiEmployeeService.getEmployee(workspaceId, id);

  return sendSuccess(res, {
    data: employee,
    message: 'AI Employee retrieved successfully',
  });
}

async function update(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const { id } = req.params as unknown as AIEmployeeIdParam;
  const input = req.body as UpdateAIEmployeeInput;

  const employee = await aiEmployeeService.updateEmployee(workspaceId, id, input);

  return sendSuccess(res, {
    data: employee,
    message: 'AI Employee updated successfully',
  });
}

export const aiEmployeeController = { list, create, getOne, update };
