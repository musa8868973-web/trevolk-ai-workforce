// backend/src/modules/appointments/controller/appointment.controller.ts
import { HTTP_STATUS } from '@common/constants';
import { ForbiddenError } from '@common/errors';
import { sendSuccess } from '@common/response';
import type { Request, Response } from 'express';
import { appointmentService } from '../services/appointment.service';
import type {
  AppointmentIdParam,
  CreateAppointmentInput,
  ListAppointmentsQuery,
  UpdateAppointmentInput,
} from '../validators/appointment.schema';

function requireWorkspaceId(req: Request): string {
  if (!req.workspace) {
    throw new ForbiddenError('Workspace context is required');
  }
  return req.workspace.workspaceId;
}

export async function list(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const query = req.query as unknown as ListAppointmentsQuery;
  const appointments = await appointmentService.listAppointments(workspaceId, query);
  return sendSuccess(res, { data: appointments, message: 'Appointments retrieved' });
}

export async function create(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const input = req.body as CreateAppointmentInput;
  const appointment = await appointmentService.createAppointment(workspaceId, input);
  return sendSuccess(res, {
    data: appointment,
    message: 'Appointment created',
    statusCode: HTTP_STATUS.CREATED,
  });
}

export async function getOne(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const { id } = req.params as unknown as AppointmentIdParam;
  const appointment = await appointmentService.getAppointment(workspaceId, id);
  return sendSuccess(res, { data: appointment, message: 'Appointment retrieved' });
}

export async function update(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const { id } = req.params as unknown as AppointmentIdParam;
  const input = req.body as UpdateAppointmentInput;
  const appointment = await appointmentService.updateAppointment(workspaceId, id, input);
  return sendSuccess(res, { data: appointment, message: 'Appointment updated' });
}

export async function cancel(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const { id } = req.params as unknown as AppointmentIdParam;
  const appointment = await appointmentService.cancelAppointment(workspaceId, id);
  return sendSuccess(res, { data: appointment, message: 'Appointment cancelled' });
}

export const appointmentController = {
  list,
  create,
  getOne,
  update,
  cancel,
};
