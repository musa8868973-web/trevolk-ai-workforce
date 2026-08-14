// backend/src/modules/receptionist-employee/services/receptionist-employee.service.ts
import { NotFoundError } from '@common/errors';
import { prisma } from '@database/index';
import { aiEmployeeService } from '@modules/ai-employees/services/ai-employee.service';
import { appointmentService } from '@modules/appointments/services/appointment.service';
import { toSafeConversation } from '@modules/conversations/mappers/conversation.mapper';
import { logger } from '@shared/logger';
import type {
  CheckAvailabilityInput,
  ReceptionistBookAppointmentInput,
  RescheduleAppointmentInput,
  CancelAppointmentByReceptionistInput,
  ReceptionistEscalationInput,
} from '../validators/receptionist-employee.schema';

/**
 * Business logic for the AI Receptionist Employee (AI Employee Spec §5).
 *
 * Owns the full appointment booking lifecycle:
 *   request → availability check → booking → rescheduling → cancellation → escalation.
 *
 * CRUD management of the Receptionist AI Employee record itself is delegated to
 * the shared aiEmployeeService (Backend Specification §5.3, §7.1).
 * Appointment persistence and conflict checking are delegated to the existing
 * appointmentService to avoid duplicating that logic (Phase 7, §14).
 */

// Re-export CRUD methods from generic AI Employee service
const listEmployees = aiEmployeeService.listEmployees;
const createEmployee = aiEmployeeService.createEmployee;
const getEmployee = aiEmployeeService.getEmployee;
const updateEmployee = aiEmployeeService.updateEmployee;
const activateEmployee = aiEmployeeService.activateEmployee;
const deactivateEmployee = aiEmployeeService.deactivateEmployee;

/**
 * Checks whether a time slot is available for a new appointment (AI Employee Spec §5.3).
 * Delegates to the existing conflict-check logic in appointmentService.
 */
export async function checkAvailability(
  workspaceId: string,
  input: CheckAvailabilityInput,
): Promise<{ available: boolean; startTime: string; endTime: string }> {
  const startTime = new Date(input.startTime);
  const endTime = new Date(input.endTime);

  const available = await appointmentService.checkSlotAvailability(workspaceId, startTime, endTime);

  logger.info(
    { workspaceId, startTime: input.startTime, endTime: input.endTime, available },
    'Receptionist checked slot availability',
  );

  return { available, startTime: input.startTime, endTime: input.endTime };
}

/**
 * Books an appointment for a customer/lead (AI Employee Spec §5.2, §5.3, §5.4).
 * Performs the availability check before confirming — never confirms without checking.
 * Creates a Customer record if no customerId is provided.
 */
export async function bookAppointment(
  workspaceId: string,
  input: ReceptionistBookAppointmentInput,
) {
  let customerId = input.customerId ?? null;

  if (!customerId) {
    // Create a customer record on first contact (AI Employee Spec §5.2)
    const newCustomer = await prisma.customer.create({
      data: {
        workspaceId,
        name: input.customerName ?? null,
        email: input.customerEmail ?? null,
        sourceChannel: 'RECEPTIONIST',
        firstContactAt: new Date(),
      },
    });
    customerId = newCustomer.id;
    logger.info(
      { workspaceId, customerId: newCustomer.id },
      'Receptionist created customer record on first contact',
    );
  } else {
    // Verify the customer belongs to this workspace (multi-tenancy guard)
    const existing = await prisma.customer.findFirst({
      where: { id: customerId, workspaceId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundError('Customer not found');
    }
  }

  const appointment = await appointmentService.createAppointment(workspaceId, {
    customerId: customerId!,
    aiEmployeeId: input.aiEmployeeId,
    startTime: input.startTime,
    endTime: input.endTime,
    externalCalendarRef: input.externalCalendarRef ?? null,
  });

  logger.info(
    { workspaceId, appointmentId: appointment.id, customerId },
    'Receptionist booked appointment',
  );

  return appointment;
}

/**
 * Reschedules an existing appointment after checking the new slot for conflicts (AI Employee Spec §5.6).
 * A fresh availability check is mandatory before confirming the reschedule.
 */
export async function rescheduleAppointment(
  workspaceId: string,
  input: RescheduleAppointmentInput,
) {
  // Verify the appointment belongs to this workspace
  const existing = await prisma.appointment.findFirst({
    where: { id: input.appointmentId, workspaceId, deletedAt: null },
  });
  if (!existing) {
    throw new NotFoundError('Appointment not found');
  }

  const appointment = await appointmentService.updateAppointment(workspaceId, input.appointmentId, {
    startTime: input.startTime,
    endTime: input.endTime,
    ...(input.externalCalendarRef !== undefined
      ? { externalCalendarRef: input.externalCalendarRef }
      : {}),
  });

  logger.info(
    { workspaceId, appointmentId: appointment.id, newStart: input.startTime },
    'Receptionist rescheduled appointment',
  );

  return appointment;
}

/**
 * Cancels an appointment (AI Employee Spec §5.2, §5.6).
 */
export async function cancelAppointment(
  workspaceId: string,
  input: CancelAppointmentByReceptionistInput,
) {
  // Verify the appointment belongs to this workspace
  const existing = await prisma.appointment.findFirst({
    where: { id: input.appointmentId, workspaceId, deletedAt: null },
  });
  if (!existing) {
    throw new NotFoundError('Appointment not found');
  }

  const appointment = await appointmentService.cancelAppointment(workspaceId, input.appointmentId);

  logger.info(
    { workspaceId, appointmentId: appointment.id },
    'Receptionist cancelled appointment',
  );

  return appointment;
}

/**
 * Escalates a conversation to a human when the Receptionist cannot serve the request
 * (AI Employee Spec §5.8). Marks the conversation ESCALATED and appends a system note.
 */
export async function handleEscalation(
  workspaceId: string,
  input: ReceptionistEscalationInput,
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
      content: `[RECEPTIONIST ESCALATION] Handed off to human agent. Reason: ${input.reason}`,
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
    'Receptionist escalated conversation',
  );

  return {
    conversation: toSafeConversation(updatedConversation),
    escalationNote: systemNote,
    reason: input.reason,
  };
}

export const receptionistEmployeeService = {
  listEmployees,
  createEmployee,
  getEmployee,
  updateEmployee,
  activateEmployee,
  deactivateEmployee,
  checkAvailability,
  bookAppointment,
  rescheduleAppointment,
  cancelAppointment,
  handleEscalation,
};
