// backend/src/modules/support-employee/services/support-employee.service.ts
import { NotFoundError } from '@common/errors';
import { prisma } from '@database/index';
import { aiEmployeeService } from '@modules/ai-employees/services/ai-employee.service';
import { toSafeConversation } from '@modules/conversations/mappers/conversation.mapper';
import { logger } from '@shared/logger';
import type {
  AnswerFaqInput,
  HandleEscalationInput,
} from '../validators/support-employee.schema';

// Re-export CRUD methods from generic AI Employee service
const listEmployees = aiEmployeeService.listEmployees;
const createEmployee = aiEmployeeService.createEmployee;
const getEmployee = aiEmployeeService.getEmployee;
const updateEmployee = aiEmployeeService.updateEmployee;
const activateEmployee = aiEmployeeService.activateEmployee;
const deactivateEmployee = aiEmployeeService.deactivateEmployee;

export async function answerFaq(
  workspaceId: string,
  input: AnswerFaqInput,
): Promise<{
  matched: boolean;
  answer: string;
  title?: string;
  entryId?: string;
  escalationRecommended?: boolean;
}> {
  const kbEntries = await prisma.knowledgeBaseEntry.findMany({
    where: {
      workspaceId,
      isActive: true,
      deletedAt: null,
    },
  });

  const keywords = input.question
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);

  let bestMatch = kbEntries.find((entry) => {
    const titleLower = entry.title.toLowerCase();
    const contentLower = (entry.content ?? '').toLowerCase();
    return keywords.some((kw) => titleLower.includes(kw) || contentLower.includes(kw));
  });

  if (!bestMatch && kbEntries.length > 0) {
    // Default to first active entry if general query
    bestMatch = kbEntries[0];
  }

  if (bestMatch && bestMatch.content) {
    logger.info(
      { workspaceId, entryId: bestMatch.id, question: input.question },
      'Support AI Employee answered FAQ from Knowledge Base',
    );
    return {
      matched: true,
      answer: bestMatch.content,
      title: bestMatch.title,
      entryId: bestMatch.id,
    };
  }

  // Hallucination prevention rule per AI Spec §4.4 & §9.3:
  // Say plainly when grounded knowledge is unavailable and trigger escalation option.
  logger.warn(
    { workspaceId, question: input.question },
    'Support AI Employee found no grounded knowledge for FAQ query; recommending escalation',
  );

  return {
    matched: false,
    answer:
      'Information is not available in the workspace knowledge base. Escalation to a human agent is recommended.',
    escalationRecommended: true,
  };
}

export async function handleEscalation(
  workspaceId: string,
  input: HandleEscalationInput,
) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: input.conversationId, workspaceId, deletedAt: null },
  });

  if (!conversation) {
    throw new NotFoundError('Conversation not found');
  }

  const updatedConversation = await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      status: 'ESCALATED',
      ...(input.assignedUserId ? { assignedUserId: input.assignedUserId } : {}),
    },
  });

  const systemNote = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderType: 'SYSTEM',
      content: `[AI ESCALATION] Handed off to human agent. Reason: ${input.reason}`,
      isInternalNote: true,
      messageType: 'TEXT',
    },
  });

  logger.info(
    {
      workspaceId,
      conversationId: conversation.id,
      reason: input.reason,
      assignedUserId: input.assignedUserId ?? null,
    },
    'Support AI Employee escalated conversation',
  );

  return {
    conversation: toSafeConversation(updatedConversation),
    escalationNote: systemNote,
    reason: input.reason,
  };
}

export const supportEmployeeService = {
  listEmployees,
  createEmployee,
  getEmployee,
  updateEmployee,
  activateEmployee,
  deactivateEmployee,
  answerFaq,
  handleEscalation,
};
