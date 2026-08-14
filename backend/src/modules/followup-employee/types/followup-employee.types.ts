// backend/src/modules/followup-employee/types/followup-employee.types.ts
export type FollowUpTriggerType =
  | 'LEAD_SILENCE'
  | 'PROPOSAL_REMINDER'
  | 'CUSTOMER_REENGAGEMENT'
  | 'CART_ABANDONMENT';

export type FollowUpStatus = 'PENDING' | 'SENT' | 'FAILED' | 'STOPPED' | 'CONVERTED';

export type FollowUpEmployeeModule = 'FOLLOW_UP';

export const FOLLOW_UP_TRIGGER_TYPES: FollowUpTriggerType[] = [
  'LEAD_SILENCE',
  'PROPOSAL_REMINDER',
  'CUSTOMER_REENGAGEMENT',
  'CART_ABANDONMENT',
];

export const FOLLOW_UP_STATUSES: FollowUpStatus[] = [
  'PENDING',
  'SENT',
  'FAILED',
  'STOPPED',
  'CONVERTED',
];
