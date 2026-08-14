// backend/src/modules/conversations/index.ts
export { conversationRoutes } from './routes/conversation.routes';
export { conversationService } from './services/conversation.service';
export { toSafeConversation, type SafeConversation } from './mappers/conversation.mapper';
export * from './types';
