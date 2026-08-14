// backend/src/modules/conversations/controller/conversation.controller.ts
import { HTTP_STATUS } from '@common/constants';
import { ForbiddenError } from '@common/errors';
import { sendSuccess } from '@common/response';
import type { Request, Response } from 'express';

import { conversationService } from '../services/conversation.service';
import type {
  ConversationIdParam,
  CreateConversationInput,
  ListConversationsQuery,
  UpdateConversationInput,
} from '../validators/conversation.schema';

function requireWorkspaceId(req: Request): string {
  if (!req.workspace) {
    throw new ForbiddenError('Workspace context is required');
  }
  return req.workspace.workspaceId;
}

async function list(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const query = req.query as unknown as ListConversationsQuery;
  const conversations = await conversationService.listConversations(workspaceId, query);
  return sendSuccess(res, { data: conversations, message: 'Conversations listed' });
}

async function create(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const input = req.body as CreateConversationInput;
  const conversation = await conversationService.createConversation(workspaceId, input);
  return sendSuccess(res, { data: conversation, message: 'Conversation created', statusCode: HTTP_STATUS.CREATED });
}

async function getOne(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const { id } = req.params as unknown as ConversationIdParam;
  const conversation = await conversationService.getConversation(workspaceId, id);
  return sendSuccess(res, { data: conversation, message: 'Conversation retrieved' });
}

async function update(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const { id } = req.params as unknown as ConversationIdParam;
  const input = req.body as UpdateConversationInput;
  const conversation = await conversationService.updateConversation(workspaceId, id, input);
  return sendSuccess(res, { data: conversation, message: 'Conversation updated' });
}

export const conversationController = { list, create, getOne, update };
