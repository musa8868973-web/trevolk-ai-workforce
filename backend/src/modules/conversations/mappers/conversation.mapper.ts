// backend/src/modules/conversations/mappers/conversation.mapper.ts
import type { Conversation } from '@prisma/client';

export interface SafeConversation {
  id: string;
  workspaceId: string;
  customerId: string | null;
  leadId: string | null;
  aiEmployeeId: string | null;
  integrationId: string | null;
  channel: string;
  status: string;
  assignedUserId: string | null;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toSafeConversation(conv: Conversation): SafeConversation {
  return {
    id: conv.id,
    workspaceId: conv.workspaceId,
    customerId: conv.customerId ?? null,
    leadId: conv.leadId ?? null,
    aiEmployeeId: conv.aiEmployeeId ?? null,
    integrationId: conv.integrationId ?? null,
    channel: conv.channel,
    status: conv.status,
    assignedUserId: conv.assignedUserId ?? null,
    lastMessageAt: conv.lastMessageAt ?? null,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
  };
}
