// backend/src/modules/followup-employee/controller/followup-employee.controller.ts
import { HTTP_STATUS } from '@common/constants';
import { ForbiddenError, NotFoundError } from '@common/errors';
import { sendSuccess } from '@common/response';
import { AI_EMPLOYEE_TYPES } from '@modules/ai-employees/constants/employee-type.constants';
import type { Request, Response } from 'express';

import { followupEmployeeService } from '../services/followup-employee.service';
import type {
  AIEmployeeIdParam,
  CreateAIEmployeeInput,
  CreateFollowUpInput,
  FollowUpIdParam,
  ListAIEmployeesQuery,
  ListFollowUpsQuery,
  StopFollowUpInput,
  UpdateAIEmployeeInput,
  UpdateFollowUpInput,
} from '../validators/followup-employee.schema';

function requireWorkspaceId(req: Request): string {
  if (!req.workspace) {
    throw new ForbiddenError('Workspace context is required');
  }
  return req.workspace.workspaceId;
}

function assertFollowUpEmployee(employee: { employeeType: string }): void {
  if (employee.employeeType !== AI_EMPLOYEE_TYPES.FOLLOW_UP) {
    throw new NotFoundError('AI Employee not found');
  }
}

async function listEmployees(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const query = req.query as unknown as ListAIEmployeesQuery;
  const employees = await followupEmployeeService.listEmployees(workspaceId, {
    ...query,
    employeeType: AI_EMPLOYEE_TYPES.FOLLOW_UP,
  });
  return sendSuccess(res, { data: employees, message: 'Follow-up Employees retrieved' });
}

async function createEmployee(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const input = req.body as CreateAIEmployeeInput;
  const employee = await followupEmployeeService.createEmployee(workspaceId, {
    ...input,
    employeeType: AI_EMPLOYEE_TYPES.FOLLOW_UP,
  });
  return sendSuccess(res, {
    data: employee,
    message: 'Follow-up Employee created',
    statusCode: HTTP_STATUS.CREATED,
  });
}

async function getEmployee(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const { id } = req.params as unknown as AIEmployeeIdParam;
  const employee = await followupEmployeeService.getEmployee(workspaceId, id);
  assertFollowUpEmployee(employee);
  return sendSuccess(res, { data: employee, message: 'Follow-up Employee retrieved' });
}

async function updateEmployee(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const { id } = req.params as unknown as AIEmployeeIdParam;
  const existing = await followupEmployeeService.getEmployee(workspaceId, id);
  assertFollowUpEmployee(existing);
  const input = req.body as UpdateAIEmployeeInput;
  const employee = await followupEmployeeService.updateEmployee(workspaceId, id, input);
  return sendSuccess(res, { data: employee, message: 'Follow-up Employee updated' });
}

async function createFollowUp(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const input = req.body as CreateFollowUpInput;
  const followUp = await followupEmployeeService.createFollowUp(workspaceId, input);
  return sendSuccess(res, {
    data: followUp,
    message: 'Follow-up created',
    statusCode: HTTP_STATUS.CREATED,
  });
}

async function listFollowUps(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const query = req.query as unknown as ListFollowUpsQuery;
  const followUps = await followupEmployeeService.listFollowUps(workspaceId, query);
  return sendSuccess(res, { data: followUps, message: 'Follow-ups retrieved' });
}

async function getFollowUp(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const { id } = req.params as unknown as FollowUpIdParam;
  const followUp = await followupEmployeeService.getFollowUp(workspaceId, id);
  return sendSuccess(res, { data: followUp, message: 'Follow-up retrieved' });
}

async function updateFollowUp(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const { id } = req.params as unknown as FollowUpIdParam;
  const input = req.body as UpdateFollowUpInput;
  const followUp = await followupEmployeeService.updateFollowUp(workspaceId, id, input);
  return sendSuccess(res, { data: followUp, message: 'Follow-up updated' });
}

async function triggerFollowUp(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const { id } = req.params as unknown as FollowUpIdParam;
  const result = await followupEmployeeService.triggerFollowUp(workspaceId, id);
  return sendSuccess(res, { data: result, message: 'Follow-up triggered successfully' });
}

async function stopFollowUp(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const { id } = req.params as unknown as FollowUpIdParam;
  const input = req.body as StopFollowUpInput;
  const followUp = await followupEmployeeService.stopFollowUp(workspaceId, id, input);
  return sendSuccess(res, { data: followUp, message: 'Follow-up stopped successfully' });
}

export const followupEmployeeController = {
  listEmployees,
  createEmployee,
  getEmployee,
  updateEmployee,
  createFollowUp,
  listFollowUps,
  getFollowUp,
  updateFollowUp,
  triggerFollowUp,
  stopFollowUp,
};
