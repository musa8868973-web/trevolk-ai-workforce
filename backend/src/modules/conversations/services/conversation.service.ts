// backend/src/modules/conversations/services/conversation.service.ts
import { ConflictError, NotFoundError } from '@common/errors';
import { prisma } from '@database/index';
import { logger } from '@shared/logger';
import { toSafeConversation } from '../mappers/conversation.mapper';
import type {
  CreateConversationInput,
  ListConversationsQuery,
  UpdateConversationInput,
} from '../validators/conversation.schema';

// Helper to fetch a conversation scoped to workspace
async function findWorkspaceConversationOrThrow(workspaceId: string, conversationId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId, deletedAt: null },
  });
  if (!conversation) {
    throw new NotFoundError('Conversation not found');
  }
  return conversation;
}

export async function createConversation(
  workspaceId: string,
  input: CreateConversationInput,
) {
  // Simple conflict check – ensure no duplicate open conversation on same channel
  const existing = await prisma.conversation.findFirst({
    where: {
      workspaceId,
      channel: input.channel,
      status: 'OPEN',
      deletedAt: null,
    },
  });
  if (existing) {
    throw new ConflictError('An open conversation on this channel already exists');
  }

  const conversation = await prisma.conversation.create({
    data: {
      workspaceId,
      channel: input.channel,
      status: input.status ?? 'OPEN',
      customerId: input.customerId ?? null,
      leadId: input.leadId ?? null,
      aiEmployeeId: input.aiEmployeeId ?? null,
      integrationId: input.integrationId ?? null,
      assignedUserId: input.assignedUserId ?? null,
    },
  });

  logger.info({ workspaceId, conversationId: conversation.id }, 'Conversation created');
  return toSafeConversation(conversation);
}

export async function listConversations(
  workspaceId: string,
  query: ListConversationsQuery,
) {
  const conversations = await prisma.conversation.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.channel ? { channel: query.channel } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
  return conversations.map(toSafeConversation);
}

export async function getConversation(workspaceId: string, conversationId: string) {
  const conversation = await findWorkspaceConversationOrThrow(workspaceId, conversationId);
  return toSafeConversation(conversation);
}

export async function updateConversation(
  workspaceId: string,
  conversationId: string,
  input: UpdateConversationInput,
) {
  const existing = await findWorkspaceConversationOrThrow(workspaceId, conversationId);
  const updated = await prisma.conversation.update({
    where: { id: existing.id },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.channel !== undefined ? { channel: input.channel } : {}),
      ...(input.assignedUserId !== undefined ? { assignedUserId: input.assignedUserId } : {}),
    },
  });
  logger.info({ workspaceId, conversationId: updated.id }, 'Conversation updated');
  return toSafeConversation(updated);
}

export const conversationService = {
  createConversation,
  listConversations,
  getConversation,
  updateConversation,
};
