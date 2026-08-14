// backend/src/modules/appointments/validators/appointment.schema.ts
import { z } from 'zod';

export const APPOINTMENT_STATUSES = ['SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'] as const;

export const appointmentIdParamSchema = z.object({
  id: z.string().uuid('Valid Appointment ID is required'),
});
export type AppointmentIdParam = z.infer<typeof appointmentIdParamSchema>;

export const createAppointmentSchema = z.object({
  customerId: z.string().uuid('Valid Customer ID is required'),
  leadId: z.string().uuid().optional().nullable(),
  aiEmployeeId: z.string().uuid('Valid AI Employee ID is required'),
  integrationId: z.string().uuid().optional().nullable(),
  startTime: z.string().datetime('Valid start time ISO string is required'),
  endTime: z.string().datetime('Valid end time ISO string is required'),
  externalCalendarRef: z.string().optional().nullable(),
});
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentSchema = z
  .object({
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    status: z.enum(APPOINTMENT_STATUSES).optional(),
    externalCalendarRef: z.string().optional().nullable(),
    reminderSentAt: z.string().datetime().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;

export const listAppointmentsQuerySchema = z.object({
  customerId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  aiEmployeeId: z.string().uuid().optional(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
});
export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;
