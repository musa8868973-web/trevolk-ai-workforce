// backend/src/modules/sales-employee/controller/sales-employee.controller.ts
import { HTTP_STATUS } from '@common/constants';
import { ForbiddenError } from '@common/errors';
import { sendSuccess } from '@common/response';
import type { Request, Response } from 'express';

import { salesEmployeeService } from '../services/sales-employee.service';
import type {
  AIEmployeeIdParam,
  BookSalesAppointmentInput,
  CreateAIEmployeeInput,
  ListAIEmployeesQuery,
  QualifyLeadInput,
  UpdateAIEmployeeInput,
} from '../validators/sales-employee.schema';

function requireWorkspaceId(req: Request): string {
  if (!req.workspace) {
    throw new ForbiddenError('Workspace context is required');
  }
  return req.workspace.workspaceId;
}

async function list(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const query = req.query as unknown as ListAIEmployeesQuery;
  const employees = await salesEmployeeService.listEmployees(workspaceId, query);
  return sendSuccess(res, { data: employees, message: 'Sales Employees retrieved' });
}

async function create(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const input = req.body as CreateAIEmployeeInput;
  const employee = await salesEmployeeService.createEmployee(workspaceId, input);
  return sendSuccess(res, { data: employee, message: 'Sales Employee created', statusCode: HTTP_STATUS.CREATED });
}

async function getOne(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const { id } = req.params as unknown as AIEmployeeIdParam;
  const employee = await salesEmployeeService.getEmployee(workspaceId, id);
  return sendSuccess(res, { data: employee, message: 'Sales Employee retrieved' });
}

async function update(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const { id } = req.params as unknown as AIEmployeeIdParam;
  const input = req.body as UpdateAIEmployeeInput;
  const employee = await salesEmployeeService.updateEmployee(workspaceId, id, input);
  return sendSuccess(res, { data: employee, message: 'Sales Employee updated' });
}

async function qualifyLead(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const input = req.body as QualifyLeadInput;
  const result = await salesEmployeeService.qualifyLead(workspaceId, input);
  return sendSuccess(res, { data: result, message: 'Lead qualified successfully' });
}

async function bookAppointment(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const input = req.body as BookSalesAppointmentInput;
  const appointment = await salesEmployeeService.bookAppointment(workspaceId, input);
  return sendSuccess(res, {
    data: appointment,
    message: 'Appointment booked successfully',
    statusCode: HTTP_STATUS.CREATED,
  });
}

export const salesEmployeeController = {
  list,
  create,
  getOne,
  update,
  qualifyLead,
  bookAppointment,
};
