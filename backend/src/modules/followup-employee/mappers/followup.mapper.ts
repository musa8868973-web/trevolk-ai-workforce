// backend/src/modules/followup-employee/mappers/followup.mapper.ts
import type { FollowUp } from '@prisma/client';

import type { FollowUpStatus, FollowUpTriggerType } from '../types/followup-employee.types';

export interface SafeFollowUp {
  id: string;
  workspaceId: string;
  aiEmployeeId: string | null;
  leadId: string | null;
  customerId: string | null;
  conversationId: string | null;
  appointmentId: string | null;
  triggerType: FollowUpTriggerType;
  status: FollowUpStatus;
  scheduledAt: Date | null;
  attemptCount: number;
  lastMessageSent: string | null;
  optedOut: boolean;
  stopReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toSafeFollowUp(followUp: FollowUp): SafeFollowUp {
  return {
    id: followUp.id,
    workspaceId: followUp.workspaceId,
    aiEmployeeId: followUp.aiEmployeeId ?? null,
    leadId: followUp.leadId ?? null,
    customerId: followUp.customerId ?? null,
    conversationId: followUp.conversationId ?? null,
    appointmentId: followUp.appointmentId ?? null,
    triggerType: followUp.triggerType as FollowUpTriggerType,
    status: followUp.status as FollowUpStatus,
    scheduledAt: followUp.scheduledAt ?? null,
    attemptCount: followUp.attemptCount,
    lastMessageSent: followUp.lastMessageSent ?? null,
    optedOut: followUp.optedOut,
    stopReason: followUp.stopReason ?? null,
    createdAt: followUp.createdAt,
    updatedAt: followUp.updatedAt,
  };
}
