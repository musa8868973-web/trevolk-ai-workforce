// backend/src/modules/receptionist-employee/controller/receptionist-employee.controller.ts
import { HTTP_STATUS } from '@common/constants';
import { ForbiddenError, NotFoundError } from '@common/errors';
import { sendSuccess } from '@common/response';
import { AI_EMPLOYEE_TYPES } from '@modules/ai-employees/constants/employee-type.constants';
import type { Request, Response } from 'express';

import { receptionistEmployeeService } from '../services/receptionist-employee.service';
import type {
  AIEmployeeIdParam,
  CancelAppointmentByReceptionistInput,
  CheckAvailabilityInput,
  CreateAIEmployeeInput,
  ListAIEmployeesQuery,
  ReceptionistBookAppointmentInput,
  ReceptionistEscalationInput,
  RescheduleAppointmentInput,
  UpdateAIEmployeeInput,
} from '../validators/receptionist-employee.schema';

function requireWorkspaceId(req: Request): string {
  if (!req.workspace) {
    throw new ForbiddenError('Workspace context is required');
  }
  return req.workspace.workspaceId;
}

function assertReceptionistEmployee(employee: { employeeType: string }): void {
  if (employee.employeeType !== AI_EMPLOYEE_TYPES.RECEPTIONIST) {
    throw new NotFoundError('AI Employee not found');
  }
}

async function list(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const query = req.query as unknown as ListAIEmployeesQuery;
  const employees = await receptionistEmployeeService.listEmployees(workspaceId, {
    ...query,
    employeeType: AI_EMPLOYEE_TYPES.RECEPTIONIST,
  });
  return sendSuccess(res, { data: employees, message: 'Receptionist Employees retrieved' });
}

async function create(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const input = req.body as CreateAIEmployeeInput;
  const employee = await receptionistEmployeeService.createEmployee(workspaceId, {
    ...input,
    employeeType: AI_EMPLOYEE_TYPES.RECEPTIONIST,
  });
  return sendSuccess(res, {
    data: employee,
    message: 'Receptionist Employee created',
    statusCode: HTTP_STATUS.CREATED,
  });
}

async function getOne(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const { id } = req.params as unknown as AIEmployeeIdParam;
  const employee = await receptionistEmployeeService.getEmployee(workspaceId, id);
  assertReceptionistEmployee(employee);
  return sendSuccess(res, { data: employee, message: 'Receptionist Employee retrieved' });
}

async function update(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const { id } = req.params as unknown as AIEmployeeIdParam;
  const existing = await receptionistEmployeeService.getEmployee(workspaceId, id);
  assertReceptionistEmployee(existing);
  const input = req.body as UpdateAIEmployeeInput;
  const employee = await receptionistEmployeeService.updateEmployee(workspaceId, id, input);
  return sendSuccess(res, { data: employee, message: 'Receptionist Employee updated' });
}

async function checkAvailability(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const input = req.body as CheckAvailabilityInput;
  const result = await receptionistEmployeeService.checkAvailability(workspaceId, input);
  return sendSuccess(res, { data: result, message: 'Availability checked' });
}

async function bookAppointment(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const input = req.body as ReceptionistBookAppointmentInput;
  const appointment = await receptionistEmployeeService.bookAppointment(workspaceId, input);
  return sendSuccess(res, {
    data: appointment,
    message: 'Appointment booked successfully',
    statusCode: HTTP_STATUS.CREATED,
  });
}

async function rescheduleAppointment(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const input = req.body as RescheduleAppointmentInput;
  const appointment = await receptionistEmployeeService.rescheduleAppointment(workspaceId, input);
  return sendSuccess(res, { data: appointment, message: 'Appointment rescheduled successfully' });
}

async function cancelAppointment(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const input = req.body as CancelAppointmentByReceptionistInput;
  const appointment = await receptionistEmployeeService.cancelAppointment(workspaceId, input);
  return sendSuccess(res, { data: appointment, message: 'Appointment cancelled successfully' });
}

async function escalate(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const input = req.body as ReceptionistEscalationInput;
  const result = await receptionistEmployeeService.handleEscalation(workspaceId, input);
  return sendSuccess(res, { data: result, message: 'Escalation processed successfully' });
}

export const receptionistEmployeeController = {
  list,
  create,
  getOne,
  update,
  checkAvailability,
  bookAppointment,
  rescheduleAppointment,
  cancelAppointment,
  escalate,
};
