// backend/src/modules/leads/mappers/lead.mapper.ts
import type { Lead } from '@prisma/client';

export interface SafeLead {
  id: string;
  workspaceId: string;
  aiEmployeeId: string | null;
  customerId: string | null;
  status: string;
  score: string | null;
  qualificationAnswers: string | null;
  source: string | null;
  assignedUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toSafeLead(lead: Lead): SafeLead {
  return {
    id: lead.id,
    workspaceId: lead.workspaceId,
    aiEmployeeId: lead.aiEmployeeId ?? null,
    customerId: lead.customerId ?? null,
    status: lead.status,
    score: lead.score ?? null,
    qualificationAnswers: lead.qualificationAnswers ?? null,
    source: lead.source ?? null,
    assignedUserId: lead.assignedUserId ?? null,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
}
