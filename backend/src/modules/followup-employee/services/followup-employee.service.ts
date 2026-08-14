// backend/src/modules/followup-employee/services/followup-employee.service.ts
import { ConflictError, NotFoundError } from '@common/errors';
import { prisma } from '@database/index';
import { AI_EMPLOYEE_TYPES } from '@modules/ai-employees/constants/employee-type.constants';
import { aiEmployeeService } from '@modules/ai-employees/services/ai-employee.service';
import type { AIEmployeeConfiguration } from '@modules/ai-employees/types/ai-employee-configuration.types';
import { getAIProvider } from '@modules/ai-employees/providers/provider.registry';
import type { AIProviderName } from '@modules/ai-employees/providers/ai-provider.types';
import { logger } from '@shared/logger';

import { toSafeFollowUp, type SafeFollowUp } from '../mappers/followup.mapper';
import type {
  CreateFollowUpInput,
  ListFollowUpsQuery,
  StopFollowUpInput,
  UpdateFollowUpInput,
} from '../validators/followup-employee.schema';

const listEmployees = aiEmployeeService.listEmployees;
const createEmployee = aiEmployeeService.createEmployee;
const getEmployee = aiEmployeeService.getEmployee;
const updateEmployee = aiEmployeeService.updateEmployee;
const activateEmployee = aiEmployeeService.activateEmployee;
const deactivateEmployee = aiEmployeeService.deactivateEmployee;

function parseEmployeeConfiguration(raw: string): AIEmployeeConfiguration {
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as AIEmployeeConfiguration)
      : {};
  } catch {
    return {};
  }
}

async function findWorkspaceFollowUpOrThrow(workspaceId: string, followUpId: string) {
  const followUp = await prisma.followUp.findFirst({
    where: { id: followUpId, workspaceId, deletedAt: null },
  });
  if (!followUp) {
    throw new NotFoundError('Follow-up not found');
  }
  return followUp;
}

async function assertWorkspaceResource(
  workspaceId: string,
  refs: Pick<CreateFollowUpInput, 'leadId' | 'customerId' | 'conversationId' | 'appointmentId'>,
): Promise<void> {
  if (refs.leadId) {
    const lead = await prisma.lead.findFirst({
      where: { id: refs.leadId, workspaceId, deletedAt: null },
    });
    if (!lead) throw new NotFoundError('Lead not found');
  }
  if (refs.customerId) {
    const customer = await prisma.customer.findFirst({
      where: { id: refs.customerId, workspaceId, deletedAt: null },
    });
    if (!customer) throw new NotFoundError('Customer not found');
  }
  if (refs.conversationId) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: refs.conversationId, workspaceId, deletedAt: null },
    });
    if (!conversation) throw new NotFoundError('Conversation not found');
  }
  if (refs.appointmentId) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: refs.appointmentId, workspaceId, deletedAt: null },
    });
    if (!appointment) throw new NotFoundError('Appointment not found');
  }
}

async function resolveFollowUpEmployee(
  workspaceId: string,
  aiEmployeeId: string | null | undefined,
) {
  if (aiEmployeeId) {
    const employee = await prisma.aIEmployee.findFirst({
      where: { id: aiEmployeeId, workspaceId, deletedAt: null },
    });
    if (!employee || employee.employeeType !== AI_EMPLOYEE_TYPES.FOLLOW_UP) {
      throw new NotFoundError('Follow-up AI Employee not found');
    }
    return employee;
  }

  const employee = await prisma.aIEmployee.findFirst({
    where: {
      workspaceId,
      employeeType: AI_EMPLOYEE_TYPES.FOLLOW_UP,
      deletedAt: null,
    },
  });
  if (!employee) {
    throw new NotFoundError('Follow-up AI Employee not found');
  }
  return employee;
}

async function buildFollowUpContext(
  workspaceId: string,
  followUp: {
    leadId: string | null;
    customerId: string | null;
    conversationId: string | null;
    appointmentId: string | null;
    triggerType: string;
  },
): Promise<string> {
  const parts: string[] = [`Trigger: ${followUp.triggerType}`];

  if (followUp.leadId) {
    const lead = await prisma.lead.findFirst({
      where: { id: followUp.leadId, workspaceId, deletedAt: null },
    });
    if (lead) {
      parts.push(`Lead status: ${lead.status}, score: ${lead.score ?? 'unknown'}`);
      if (lead.qualificationAnswers) {
        parts.push(`Qualification: ${lead.qualificationAnswers}`);
      }
    }
  }

  if (followUp.customerId) {
    const customer = await prisma.customer.findFirst({
      where: { id: followUp.customerId, workspaceId, deletedAt: null },
    });
    if (customer) {
      parts.push(
        `Customer: ${customer.name ?? 'unknown'} (${customer.email ?? 'no email on file'})`,
      );
    }
  }

  if (followUp.conversationId) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: followUp.conversationId, workspaceId, deletedAt: null },
    });
    if (conversation) {
      parts.push(`Conversation channel: ${conversation.channel}, status: ${conversation.status}`);
    }
  }

  if (followUp.appointmentId) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: followUp.appointmentId, workspaceId, deletedAt: null },
    });
    if (appointment) {
      parts.push(
        `Appointment: ${appointment.status} from ${appointment.startTime.toISOString()} to ${appointment.endTime.toISOString()}`,
      );
    }
  }

  return parts.join('\n');
}

export async function createFollowUp(
  workspaceId: string,
  input: CreateFollowUpInput,
): Promise<SafeFollowUp> {
  await assertWorkspaceResource(workspaceId, input);

  if (input.aiEmployeeId) {
    await resolveFollowUpEmployee(workspaceId, input.aiEmployeeId);
  }

  const followUp = await prisma.followUp.create({
    data: {
      workspaceId,
      aiEmployeeId: input.aiEmployeeId ?? null,
      leadId: input.leadId ?? null,
      customerId: input.customerId ?? null,
      conversationId: input.conversationId ?? null,
      appointmentId: input.appointmentId ?? null,
      triggerType: input.triggerType,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      status: 'PENDING',
    },
  });

  logger.info({ workspaceId, followUpId: followUp.id }, 'Follow-up sequence created');
  return toSafeFollowUp(followUp);
}

export async function listFollowUps(
  workspaceId: string,
  query: ListFollowUpsQuery,
): Promise<SafeFollowUp[]> {
  const followUps = await prisma.followUp.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.leadId ? { leadId: query.leadId } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.conversationId ? { conversationId: query.conversationId } : {}),
      ...(query.appointmentId ? { appointmentId: query.appointmentId } : {}),
      ...(query.triggerType ? { triggerType: query.triggerType } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  return followUps.map(toSafeFollowUp);
}

export async function getFollowUp(workspaceId: string, followUpId: string): Promise<SafeFollowUp> {
  const followUp = await findWorkspaceFollowUpOrThrow(workspaceId, followUpId);
  return toSafeFollowUp(followUp);
}

export async function updateFollowUp(
  workspaceId: string,
  followUpId: string,
  input: UpdateFollowUpInput,
): Promise<SafeFollowUp> {
  const existing = await findWorkspaceFollowUpOrThrow(workspaceId, followUpId);

  if (existing.status === 'STOPPED' || existing.status === 'CONVERTED') {
    throw new ConflictError('Cannot update a follow-up that has been stopped or converted');
  }

  const updated = await prisma.followUp.update({
    where: { id: existing.id },
    data: {
      ...(input.triggerType !== undefined ? { triggerType: input.triggerType } : {}),
      ...(input.scheduledAt !== undefined
        ? { scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.optedOut !== undefined ? { optedOut: input.optedOut } : {}),
      ...(input.stopReason !== undefined ? { stopReason: input.stopReason } : {}),
    },
  });

  logger.info({ workspaceId, followUpId: updated.id }, 'Follow-up updated');
  return toSafeFollowUp(updated);
}

export async function triggerFollowUp(
  workspaceId: string,
  followUpId: string,
): Promise<SafeFollowUp & { generatedMessage?: string }> {
  const existing = await findWorkspaceFollowUpOrThrow(workspaceId, followUpId);

  if (existing.optedOut) {
    throw new ConflictError('Follow-up cannot be triggered — customer has opted out');
  }

  if (existing.status !== 'PENDING') {
    throw new ConflictError(`Follow-up cannot be triggered while status is ${existing.status}`);
  }

  const employee = await resolveFollowUpEmployee(workspaceId, existing.aiEmployeeId);
  const configuration = parseEmployeeConfiguration(employee.configuration);
  const providerName = configuration.aiProvider as AIProviderName | undefined;
  const provider = providerName ? getAIProvider(providerName) : undefined;

  if (!provider || !configuration.aiModel) {
    await prisma.followUp.update({
      where: { id: existing.id },
      data: {
        status: 'FAILED',
        attemptCount: existing.attemptCount + 1,
        stopReason: 'AI provider is not configured for the Follow-up Employee',
      },
    });
    logger.warn(
      { workspaceId, followUpId: existing.id },
      'Follow-up trigger failed — no AI provider configured',
    );
    throw new ConflictError('AI provider is not configured for the Follow-up Employee');
  }

  const context = await buildFollowUpContext(workspaceId, existing);
  const systemInstructions =
    configuration.systemInstructions ??
    'You are the AI Follow-up Employee. Write a concise, on-brand follow-up message using the provided context. Do not invent facts not present in the context.';

  let generatedContent: string;
  try {
    const result = await provider.complete({
      model: configuration.aiModel,
      messages: [
        { role: 'system', content: systemInstructions },
        {
          role: 'user',
          content: `Write a follow-up message for this situation:\n\n${context}`,
        },
      ],
      parameters: configuration.behaviorSettings,
    });
    generatedContent = result.content;
  } catch (error) {
    await prisma.followUp.update({
      where: { id: existing.id },
      data: {
        status: 'FAILED',
        attemptCount: existing.attemptCount + 1,
        stopReason: error instanceof Error ? error.message : 'AI provider request failed',
      },
    });
    logger.error({ workspaceId, followUpId: existing.id, error }, 'Follow-up AI generation failed');
    throw new ConflictError('Follow-up message generation failed');
  }

  const messagePayload = JSON.stringify({
    content: generatedContent,
    provider: provider.name,
    generatedAt: new Date().toISOString(),
  });

  const sent = await prisma.followUp.update({
    where: { id: existing.id },
    data: {
      status: 'SENT',
      attemptCount: existing.attemptCount + 1,
      lastMessageSent: messagePayload,
      aiEmployeeId: employee.id,
    },
  });

  logger.info({ workspaceId, followUpId: sent.id }, 'Follow-up triggered and message generated');
  return { ...toSafeFollowUp(sent), generatedMessage: generatedContent };
}

export async function stopFollowUp(
  workspaceId: string,
  followUpId: string,
  input: StopFollowUpInput,
): Promise<SafeFollowUp> {
  const existing = await findWorkspaceFollowUpOrThrow(workspaceId, followUpId);

  if (existing.status === 'STOPPED') {
    return toSafeFollowUp(existing);
  }

  const stopped = await prisma.followUp.update({
    where: { id: existing.id },
    data: {
      status: 'STOPPED',
      stopReason: input.reason,
    },
  });

  logger.info({ workspaceId, followUpId: stopped.id, reason: input.reason }, 'Follow-up stopped');
  return toSafeFollowUp(stopped);
}

export const followupEmployeeService = {
  listEmployees,
  createEmployee,
  getEmployee,
  updateEmployee,
  activateEmployee,
  deactivateEmployee,
  createFollowUp,
  listFollowUps,
  getFollowUp,
  updateFollowUp,
  triggerFollowUp,
  stopFollowUp,
};
