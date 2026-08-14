// backend/src/modules/sales-employee/validators/sales-employee.schema.ts
import { z } from 'zod';

export * from '@modules/ai-employees/validators/ai-employee.schema';

export const qualifyLeadSchema = z.object({
  leadId: z.string().uuid('Valid Lead ID is required'),
  fit: z.string().optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  authority: z.string().optional(),
  notes: z.string().optional(),
});
export type QualifyLeadInput = z.infer<typeof qualifyLeadSchema>;

export const bookSalesAppointmentSchema = z.object({
  leadId: z.string().uuid('Valid Lead ID is required'),
  aiEmployeeId: z.string().uuid('Valid AI Employee ID is required'),
  startTime: z.string().datetime('Valid start time ISO string is required'),
  endTime: z.string().datetime('Valid end time ISO string is required'),
  externalCalendarRef: z.string().optional().nullable(),
});
export type BookSalesAppointmentInput = z.infer<typeof bookSalesAppointmentSchema>;
