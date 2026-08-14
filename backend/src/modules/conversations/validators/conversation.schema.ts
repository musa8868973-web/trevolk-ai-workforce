// backend/src/modules/conversations/validators/conversation.schema.ts
import { z } from 'zod';

export const conversationIdParamSchema = z.object({
  id: z.string().uuid('Valid Conversation ID is required'),
});
export type ConversationIdParam = z.infer<typeof conversationIdParamSchema>;

export const createConversationSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  leadId: z.string().uuid().optional().nullable(),
  aiEmployeeId: z.string().uuid().optional().nullable(),
  integrationId: z.string().uuid().optional().nullable(),
  channel: z.string().default('WEB_CHAT'),
  status: z.enum(['OPEN', 'CLOSED', 'ESCALATED', 'PENDING']).optional(),
  assignedUserId: z.string().uuid().optional().nullable(),
});
export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export const updateConversationSchema = z.object({
  status: z.enum(['OPEN', 'CLOSED', 'ESCALATED', 'PENDING']).optional(),
  channel: z.string().optional(),
  assignedUserId: z.string().uuid().optional().nullable(),
});
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;

export const listConversationsQuerySchema = z.object({
  status: z.enum(['OPEN', 'CLOSED', 'ESCALATED', 'PENDING']).optional(),
  channel: z.string().optional(),
  customerId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  aiEmployeeId: z.string().uuid().optional(),
});
export type ListConversationsQuery = z.infer<typeof listConversationsQuerySchema>;
