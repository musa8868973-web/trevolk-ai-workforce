// backend/src/modules/support-employee/controller/support-employee.controller.ts
import { HTTP_STATUS } from '@common/constants';
import { ForbiddenError } from '@common/errors';
import { sendSuccess } from '@common/response';
import type { Request, Response } from 'express';

import { supportEmployeeService } from '../services/support-employee.service';
import type {
  AIEmployeeIdParam,
  AnswerFaqInput,
  CreateAIEmployeeInput,
  HandleEscalationInput,
  ListAIEmployeesQuery,
  UpdateAIEmployeeInput,
} from '../validators/support-employee.schema';

function requireWorkspaceId(req: Request): string {
  if (!req.workspace) {
    throw new ForbiddenError('Workspace context is required');
  }
  return req.workspace.workspaceId;
}

async function list(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const query = req.query as unknown as ListAIEmployeesQuery;
  const employees = await supportEmployeeService.listEmployees(workspaceId, query);
  return sendSuccess(res, { data: employees, message: 'Support Employees retrieved' });
}

async function create(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const input = req.body as CreateAIEmployeeInput;
  const employee = await supportEmployeeService.createEmployee(workspaceId, input);
  return sendSuccess(res, { data: employee, message: 'Support Employee created', statusCode: HTTP_STATUS.CREATED });
}

async function getOne(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const { id } = req.params as unknown as AIEmployeeIdParam;
  const employee = await supportEmployeeService.getEmployee(workspaceId, id);
  return sendSuccess(res, { data: employee, message: 'Support Employee retrieved' });
}

async function update(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const { id } = req.params as unknown as AIEmployeeIdParam;
  const input = req.body as UpdateAIEmployeeInput;
  const employee = await supportEmployeeService.updateEmployee(workspaceId, id, input);
  return sendSuccess(res, { data: employee, message: 'Support Employee updated' });
}

async function answerFaq(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const input = req.body as AnswerFaqInput;
  const result = await supportEmployeeService.answerFaq(workspaceId, input);
  return sendSuccess(res, { data: result, message: 'FAQ answer processed' });
}

async function handleEscalation(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const input = req.body as HandleEscalationInput;
  const result = await supportEmployeeService.handleEscalation(workspaceId, input);
  return sendSuccess(res, { data: result, message: 'Escalation processed successfully' });
}

export const supportEmployeeController = {
  list,
  create,
  getOne,
  update,
  answerFaq,
  handleEscalation,
};
