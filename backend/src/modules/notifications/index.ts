// backend/src/modules/notifications/index.ts
export {
  initializeNotificationGateway,
  getNotificationGateway,
  emitToWorkspace,
  closeNotificationGateway,
} from './gateway/notification.gateway';

export {
  NOTIFICATION_EVENTS,
  type NotificationEventType,
  type EventPayloadMap,
  type NewMessagePayload,
  type AIResponsePayload,
  type HumanEscalationPayload,
  type AppointmentBookedPayload,
  type AppointmentRescheduledPayload,
  type LeadQualifiedPayload,
  type WebhookErrorPayload,
} from './gateway/notification.events';
