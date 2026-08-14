// backend/src/modules/support-employee/validators/support-employee.schema.ts
import { z } from 'zod';

export * from '@modules/ai-employees/validators/ai-employee.schema';

export const answerFaqSchema = z.object({
  question: z.string().min(1, 'Question text is required'),
  customerId: z.string().uuid().optional().nullable(),
});
export type AnswerFaqInput = z.infer<typeof answerFaqSchema>;

export const handleEscalationSchema = z.object({
  conversationId: z.string().uuid('Valid Conversation ID is required'),
  reason: z.string().min(1, 'Escalation reason is required'),
  assignedUserId: z.string().uuid().optional().nullable(),
});
export type HandleEscalationInput = z.infer<typeof handleEscalationSchema>;
