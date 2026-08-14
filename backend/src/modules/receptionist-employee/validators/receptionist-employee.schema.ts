// backend/src/modules/receptionist-employee/validators/receptionist-employee.schema.ts
import { z } from 'zod';

export * from '@modules/ai-employees/validators/ai-employee.schema';
import { employeeTypeSchema } from '@modules/ai-employees/validators/ai-employee.schema';

export const createAIEmployeeSchema = z.object({
  employeeType: employeeTypeSchema.optional(),
  name: z.string().trim().min(1, 'Name is required').max(160),
  description: z.string().trim().max(1000).optional(),
  configuration: z.record(z.unknown()).optional(),
});
export type CreateAIEmployeeInput = z.infer<typeof createAIEmployeeSchema>;

export const checkAvailabilitySchema = z.object({
  startTime: z.string().datetime('Valid start time ISO string is required'),
  endTime: z.string().datetime('Valid end time ISO string is required'),
});
export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;

export const receptionistBookAppointmentSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  customerName: z.string().trim().min(1).max(200).optional().nullable(),
  customerEmail: z.string().email().optional().nullable(),
  aiEmployeeId: z.string().uuid('Valid AI Employee ID is required'),
  startTime: z.string().datetime('Valid start time ISO string is required'),
  endTime: z.string().datetime('Valid end time ISO string is required'),
  externalCalendarRef: z.string().optional().nullable(),
});
export type ReceptionistBookAppointmentInput = z.infer<typeof receptionistBookAppointmentSchema>;

export const rescheduleAppointmentSchema = z.object({
  appointmentId: z.string().uuid('Valid Appointment ID is required'),
  startTime: z.string().datetime('Valid start time ISO string is required'),
  endTime: z.string().datetime('Valid end time ISO string is required'),
  externalCalendarRef: z.string().optional().nullable(),
});
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;

export const cancelAppointmentByReceptionistSchema = z.object({
  appointmentId: z.string().uuid('Valid Appointment ID is required'),
});
export type CancelAppointmentByReceptionistInput = z.infer<typeof cancelAppointmentByReceptionistSchema>;

export const receptionistEscalationSchema = z.object({
  conversationId: z.string().uuid('Valid Conversation ID is required'),
  reason: z.string().min(1, 'Escalation reason is required'),
  assignedUserId: z.string().uuid().optional().nullable(),
});
export type ReceptionistEscalationInput = z.infer<typeof receptionistEscalationSchema>;
