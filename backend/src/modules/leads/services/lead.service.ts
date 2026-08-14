// backend/src/modules/leads/services/lead.service.ts
import { ConflictError, NotFoundError } from '@common/errors';
import { prisma } from '@database/index';
import { logger } from '@shared/logger';
import { toSafeLead } from '../mappers/lead.mapper';
import type {
  CreateLeadInput,
  ListLeadsQuery,
  UpdateLeadInput,
} from '../validators/lead.schema';

async function findWorkspaceLeadOrThrow(workspaceId: string, leadId: string) {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, workspaceId, deletedAt: null },
  });
  if (!lead) {
    throw new NotFoundError('Lead not found');
  }
  return lead;
}

export async function createLead(workspaceId: string, input: CreateLeadInput) {
  // Ensure a lead for a given customer does not already exist in workspace
  if (input.customerId) {
    const existing = await prisma.lead.findFirst({
      where: { workspaceId, customerId: input.customerId, deletedAt: null },
    });
    if (existing) {
      throw new ConflictError('A lead for this customer already exists');
    }
  }

  const lead = await prisma.lead.create({
    data: {
      workspaceId,
      aiEmployeeId: input.aiEmployeeId ?? null,
      customerId: input.customerId ?? null,
      status: input.status ?? 'NEW',
      score: input.score ?? null,
      qualificationAnswers: input.qualificationAnswers ?? null,
      source: input.source ?? null,
      assignedUserId: input.assignedUserId ?? null,
    },
  });

  logger.info({ workspaceId, leadId: lead.id }, 'Lead created');
  return toSafeLead(lead);
}

export async function listLeads(workspaceId: string, query: ListLeadsQuery) {
  const leads = await prisma.lead.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.assignedUserId ? { assignedUserId: query.assignedUserId } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
  return leads.map(toSafeLead);
}

export async function getLead(workspaceId: string, leadId: string) {
  const lead = await findWorkspaceLeadOrThrow(workspaceId, leadId);
  return toSafeLead(lead);
}

export async function updateLead(
  workspaceId: string,
  leadId: string,
  input: UpdateLeadInput,
) {
  const existing = await findWorkspaceLeadOrThrow(workspaceId, leadId);
  const updated = await prisma.lead.update({
    where: { id: existing.id },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.score !== undefined ? { score: input.score } : {}),
      ...(input.assignedUserId !== undefined ? { assignedUserId: input.assignedUserId } : {}),
      ...(input.source !== undefined ? { source: input.source } : {}),
      ...(input.qualificationAnswers !== undefined
        ? { qualificationAnswers: input.qualificationAnswers }
        : {}),
    },
  });
  logger.info({ workspaceId, leadId: updated.id }, 'Lead updated');
  return toSafeLead(updated);
}

export const leadService = { createLead, listLeads, getLead, updateLead };
