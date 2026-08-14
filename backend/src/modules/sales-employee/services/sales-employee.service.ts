// backend/src/modules/sales-employee/services/sales-employee.service.ts
import { NotFoundError } from '@common/errors';
import { prisma } from '@database/index';
import { aiEmployeeService } from '@modules/ai-employees/services/ai-employee.service';
import { appointmentService } from '@modules/appointments/services/appointment.service';
import { toSafeLead, type SafeLead } from '@modules/leads/mappers/lead.mapper';
import { logger } from '@shared/logger';
import type {
  BookSalesAppointmentInput,
  QualifyLeadInput,
} from '../validators/sales-employee.schema';

// Re-export CRUD methods from generic AI Employee service
const listEmployees = aiEmployeeService.listEmployees;
const createEmployee = aiEmployeeService.createEmployee;
const getEmployee = aiEmployeeService.getEmployee;
const updateEmployee = aiEmployeeService.updateEmployee;
const activateEmployee = aiEmployeeService.activateEmployee;
const deactivateEmployee = aiEmployeeService.deactivateEmployee;

/**
 * Calculates lead qualification score (HOT / WARM / COLD) based on
 * workspace-configured qualification criteria per AI Employee Spec §3.5.
 */
function calculateLeadScore(input: QualifyLeadInput): { score: 'HOT' | 'WARM' | 'COLD'; recommendedAction: string } {
  const fitLower = (input.fit ?? '').toLowerCase();
  const budgetLower = (input.budget ?? '').toLowerCase();
  const timelineLower = (input.timeline ?? '').toLowerCase();

  const isPoorFit = fitLower.includes('no') || fitLower.includes('poor') || fitLower.includes('unmatched') || fitLower.includes('invalid');
  if (isPoorFit) {
    return { score: 'COLD', recommendedAction: 'ARCHIVE' };
  }

  const isStrongFit = fitLower.includes('yes') || fitLower.includes('match') || fitLower.includes('strong') || fitLower.includes('great');
  const isImmediateTimeline = timelineLower.includes('now') || timelineLower.includes('immediate') || timelineLower.includes('soon') || timelineLower.includes('today');
  const isGoodBudget = budgetLower.includes('yes') || budgetLower.includes('high') || budgetLower.includes('workable') || budgetLower.includes('approved');

  if (isStrongFit && (isImmediateTimeline || isGoodBudget)) {
    return { score: 'HOT', recommendedAction: 'BOOK_MEETING' };
  }

  if (isStrongFit || isImmediateTimeline || isGoodBudget) {
    return { score: 'WARM', recommendedAction: 'OFFER_MEETING_OR_FOLLOW_UP' };
  }

  return { score: 'COLD', recommendedAction: 'LOG_AND_RESPECT' };
}

export async function qualifyLead(
  workspaceId: string,
  input: QualifyLeadInput,
): Promise<{ lead: SafeLead; score: string; recommendedAction: string }> {
  const lead = await prisma.lead.findFirst({
    where: { id: input.leadId, workspaceId, deletedAt: null },
  });

  if (!lead) {
    throw new NotFoundError('Lead not found');
  }

  const { score, recommendedAction } = calculateLeadScore(input);

  const qualificationAnswersObj = {
    fit: input.fit ?? null,
    budget: input.budget ?? null,
    timeline: input.timeline ?? null,
    authority: input.authority ?? null,
    notes: input.notes ?? null,
    qualifiedAt: new Date().toISOString(),
  };

  const updatedLead = await prisma.lead.update({
    where: { id: lead.id },
    data: {
      score,
      status: score === 'COLD' ? 'DISQUALIFIED' : 'QUALIFIED',
      qualificationAnswers: JSON.stringify(qualificationAnswersObj),
    },
  });

  logger.info(
    { workspaceId, leadId: lead.id, score, recommendedAction },
    'Sales AI Employee qualified lead',
  );

  return {
    lead: toSafeLead(updatedLead),
    score,
    recommendedAction,
  };
}

export async function bookAppointment(
  workspaceId: string,
  input: BookSalesAppointmentInput,
) {
  const lead = await prisma.lead.findFirst({
    where: { id: input.leadId, workspaceId, deletedAt: null },
  });

  if (!lead) {
    throw new NotFoundError('Lead not found');
  }

  let customerId = lead.customerId;
  if (!customerId) {
    // Create customer record if one does not exist for this lead
    const newCustomer = await prisma.customer.create({
      data: {
        workspaceId,
        name: `Lead Contact (${lead.id.substring(0, 8)})`,
        sourceChannel: lead.source ?? 'AI_SALES_EMPLOYEE',
        firstContactAt: new Date(),
      },
    });
    customerId = newCustomer.id;

    await prisma.lead.update({
      where: { id: lead.id },
      data: { customerId },
    });
  }

  const appointment = await appointmentService.createAppointment(workspaceId, {
    customerId,
    leadId: lead.id,
    aiEmployeeId: input.aiEmployeeId,
    startTime: input.startTime,
    endTime: input.endTime,
    externalCalendarRef: input.externalCalendarRef ?? null,
  });

  await prisma.lead.update({
    where: { id: lead.id },
    data: { status: 'MEETING_SCHEDULED' },
  });

  logger.info(
    { workspaceId, leadId: lead.id, appointmentId: appointment.id },
    'Sales AI Employee booked appointment for lead',
  );

  return appointment;
}

export const salesEmployeeService = {
  listEmployees,
  createEmployee,
  getEmployee,
  updateEmployee,
  activateEmployee,
  deactivateEmployee,
  qualifyLead,
  bookAppointment,
};
