// backend/src/modules/leads/constants/lead-status.constants.ts
export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'DISQUALIFIED', 'CONVERTED'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
