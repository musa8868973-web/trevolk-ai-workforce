// backend/src/modules/appointments/mappers/appointment.mapper.ts
import type { Appointment } from '@prisma/client';

export interface SafeAppointment {
  id: string;
  workspaceId: string;
  customerId: string;
  leadId: string | null;
  aiEmployeeId: string;
  integrationId: string | null;
  startTime: Date;
  endTime: Date;
  status: string;
  externalCalendarRef: string | null;
  reminderSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toSafeAppointment(appointment: Appointment): SafeAppointment {
  return {
    id: appointment.id,
    workspaceId: appointment.workspaceId,
    customerId: appointment.customerId,
    leadId: appointment.leadId ?? null,
    aiEmployeeId: appointment.aiEmployeeId,
    integrationId: appointment.integrationId ?? null,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    status: appointment.status,
    externalCalendarRef: appointment.externalCalendarRef ?? null,
    reminderSentAt: appointment.reminderSentAt ?? null,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
  };
}
