// backend/src/modules/conversations/routes/conversation.routes.ts
import { PERMISSIONS } from '@common/constants';
import { requireAuth, requirePermission, resolveWorkspace, validate } from '@common/middlewares';
import { asyncHandler } from '@shared/utils';
import { Router } from 'express';

import { conversationController } from '../controller/conversation.controller';
import {
  conversationIdParamSchema,
  createConversationSchema,
  listConversationsQuerySchema,
  updateConversationSchema,
} from '../validators/conversation.schema';

const router: Router = Router();

/**
 * Conversation endpoints (Backend Specification §5.4, §6.4; Phase 5B).
 * All routes require a resolved workspace via `resolveWorkspace`.
 */
router.get(
  '/',
  requireAuth,
  validate({ query: listConversationsQuerySchema }),
  resolveWorkspace,
  asyncHandler(conversationController.list),
);

router.post(
  '/',
  requireAuth,
  validate({ body: createConversationSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.CONVERSATION_MANAGE),
  asyncHandler(conversationController.create),
);

router.get(
  '/:id',
  requireAuth,
  validate({ params: conversationIdParamSchema }),
  resolveWorkspace,
  asyncHandler(conversationController.getOne),
);

router.patch(
  '/:id',
  requireAuth,
  validate({ params: conversationIdParamSchema, body: updateConversationSchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.CONVERSATION_MANAGE),
  asyncHandler(conversationController.update),
);

export { router as conversationRoutes };
