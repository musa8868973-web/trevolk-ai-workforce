// backend/src/modules/appointments/services/appointment.service.ts
import { ConflictError, NotFoundError } from '@common/errors';
import { prisma } from '@database/index';
import { logger } from '@shared/logger';
import { toSafeAppointment, type SafeAppointment } from '../mappers/appointment.mapper';
import type {
  CreateAppointmentInput,
  ListAppointmentsQuery,
  UpdateAppointmentInput,
} from '../validators/appointment.schema';

async function findWorkspaceAppointmentOrThrow(workspaceId: string, id: string) {
  const appointment = await prisma.appointment.findFirst({
    where: { id, workspaceId, deletedAt: null },
  });
  if (!appointment) {
    throw new NotFoundError('Appointment not found');
  }
  return appointment;
}

export async function checkSlotAvailability(
  workspaceId: string,
  startTime: Date,
  endTime: Date,
  excludeId?: string,
): Promise<boolean> {
  const all = await prisma.appointment.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

  const conflicting = all.find((app) => {
    if (app.status === 'CANCELLED' || app.status === 'NO_SHOW') return false;
    
    const startMs = new Date(app.startTime).getTime();
    const endMs = new Date(app.endTime).getTime();
    return startMs < endTime.getTime() && endMs > startTime.getTime();
  });

  return !conflicting;
}

export async function createAppointment(
  workspaceId: string,
  input: CreateAppointmentInput,
): Promise<SafeAppointment> {
  const startTime = new Date(input.startTime);
  const endTime = new Date(input.endTime);

  if (endTime <= startTime) {
    throw new ConflictError('End time must be after start time');
  }

  const isAvailable = await checkSlotAvailability(workspaceId, startTime, endTime);
  if (!isAvailable) {
    throw new ConflictError('Selected time slot conflicts with an existing appointment');
  }

  const appointment = await prisma.appointment.create({
    data: {
      workspaceId,
      customerId: input.customerId,
      leadId: input.leadId ?? null,
      aiEmployeeId: input.aiEmployeeId,
      integrationId: input.integrationId ?? null,
      startTime,
      endTime,
      externalCalendarRef: input.externalCalendarRef ?? null,
      status: 'SCHEDULED',
    },
  });

  logger.info({ workspaceId, appointmentId: appointment.id }, 'Appointment created');
  return toSafeAppointment(appointment);
}

export async function listAppointments(
  workspaceId: string,
  query: ListAppointmentsQuery,
): Promise<SafeAppointment[]> {
  const appointments = await prisma.appointment.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.leadId ? { leadId: query.leadId } : {}),
      ...(query.aiEmployeeId ? { aiEmployeeId: query.aiEmployeeId } : {}),
      ...(query.status ? { status: query.status } : {}),
    },
    orderBy: { startTime: 'asc' },
  });
  return appointments.map(toSafeAppointment);
}

export async function getAppointment(
  workspaceId: string,
  id: string,
): Promise<SafeAppointment> {
  const appointment = await findWorkspaceAppointmentOrThrow(workspaceId, id);
  return toSafeAppointment(appointment);
}

export async function updateAppointment(
  workspaceId: string,
  id: string,
  input: UpdateAppointmentInput,
): Promise<SafeAppointment> {
  const existing = await findWorkspaceAppointmentOrThrow(workspaceId, id);

  let startTime = existing.startTime;
  let endTime = existing.endTime;

  if (input.startTime) startTime = new Date(input.startTime);
  if (input.endTime) endTime = new Date(input.endTime);

  if (endTime <= startTime) {
    throw new ConflictError('End time must be after start time');
  }

  if (input.startTime || input.endTime) {
    const isAvailable = await checkSlotAvailability(workspaceId, startTime, endTime, id);
    if (!isAvailable) {
      throw new ConflictError('Updated time slot conflicts with an existing appointment');
    }
  }

  const updated = await prisma.appointment.update({
    where: { id: existing.id },
    data: {
      ...(input.startTime !== undefined ? { startTime } : {}),
      ...(input.endTime !== undefined ? { endTime } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.externalCalendarRef !== undefined ? { externalCalendarRef: input.externalCalendarRef } : {}),
      ...(input.reminderSentAt !== undefined ? { reminderSentAt: input.reminderSentAt ? new Date(input.reminderSentAt) : null } : {}),
    },
  });

  logger.info({ workspaceId, appointmentId: updated.id }, 'Appointment updated');
  return toSafeAppointment(updated);
}

export async function cancelAppointment(
  workspaceId: string,
  id: string,
): Promise<SafeAppointment> {
  const existing = await findWorkspaceAppointmentOrThrow(workspaceId, id);
  const updated = await prisma.appointment.update({
    where: { id: existing.id },
    data: { status: 'CANCELLED' },
  });
  logger.info({ workspaceId, appointmentId: updated.id }, 'Appointment cancelled');
  return toSafeAppointment(updated);
}

export const appointmentService = {
  createAppointment,
  listAppointments,
  getAppointment,
  updateAppointment,
  cancelAppointment,
  checkSlotAvailability,
};
