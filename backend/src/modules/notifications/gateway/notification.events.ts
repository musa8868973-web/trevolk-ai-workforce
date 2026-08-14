// backend/src/modules/notifications/gateway/notification.events.ts
/**
 * Real-Time Notification Event Definitions for Socket.io Gateway.
 *
 * Enforces strict typing across all workspace-scoped real-time events.
 */

export const NOTIFICATION_EVENTS = {
  NEW_MESSAGE: 'conversation:new_message',
  AI_RESPONSE: 'conversation:ai_response',
  HUMAN_ESCALATION: 'escalation:human_required',
  APPOINTMENT_BOOKED: 'appointment:booked',
  APPOINTMENT_RESCHEDULED: 'appointment:rescheduled',
  LEAD_QUALIFIED: 'lead:qualified',
  WEBHOOK_ERROR: 'integration:webhook_error',
} as const;

export type NotificationEventType =
  (typeof NOTIFICATION_EVENTS)[keyof typeof NOTIFICATION_EVENTS];

export interface NewMessagePayload {
  workspaceId: string;
  conversationId: string;
  messageId: string;
  senderType: 'CUSTOMER' | 'AI_EMPLOYEE' | 'HUMAN_AGENT';
  senderId?: string;
  content: string;
  channel: string;
  timestamp: string;
}

export interface AIResponsePayload {
  workspaceId: string;
  conversationId: string;
  messageId: string;
  aiEmployeeId: string;
  aiEmployeeType: string;
  content: string;
  channel: string;
  timestamp: string;
}

export interface HumanEscalationPayload {
  workspaceId: string;
  conversationId: string;
  customerId?: string;
  customerName?: string;
  reason: string;
  timestamp: string;
}

export interface AppointmentBookedPayload {
  workspaceId: string;
  appointmentId: string;
  customerId: string;
  customerName?: string;
  aiEmployeeId: string;
  startTime: string;
  endTime: string;
  timestamp: string;
}

export interface AppointmentRescheduledPayload {
  workspaceId: string;
  appointmentId: string;
  customerId: string;
  previousStartTime: string;
  newStartTime: string;
  newEndTime: string;
  timestamp: string;
}

export interface LeadQualifiedPayload {
  workspaceId: string;
  leadId: string;
  customerId?: string;
  customerName?: string;
  score: 'HOT' | 'WARM' | 'COLD';
  source?: string;
  timestamp: string;
}

export interface WebhookErrorPayload {
  workspaceId: string;
  integrationId?: string;
  provider: string;
  errorMessage: string;
  timestamp: string;
}

export type EventPayloadMap = {
  [NOTIFICATION_EVENTS.NEW_MESSAGE]: NewMessagePayload;
  [NOTIFICATION_EVENTS.AI_RESPONSE]: AIResponsePayload;
  [NOTIFICATION_EVENTS.HUMAN_ESCALATION]: HumanEscalationPayload;
  [NOTIFICATION_EVENTS.APPOINTMENT_BOOKED]: AppointmentBookedPayload;
  [NOTIFICATION_EVENTS.APPOINTMENT_RESCHEDULED]: AppointmentRescheduledPayload;
  [NOTIFICATION_EVENTS.LEAD_QUALIFIED]: LeadQualifiedPayload;
  [NOTIFICATION_EVENTS.WEBHOOK_ERROR]: WebhookErrorPayload;
};
