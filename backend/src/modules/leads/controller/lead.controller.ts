// backend/src/modules/leads/controller/lead.controller.ts
import { HTTP_STATUS } from '@common/constants';
import { ForbiddenError } from '@common/errors';
import { sendSuccess } from '@common/response';
import type { Request, Response } from 'express';

import { leadService } from '../services/lead.service';
import type {
  LeadIdParam,
  CreateLeadInput,
  ListLeadsQuery,
  UpdateLeadInput,
} from '../validators/lead.schema';

function requireWorkspaceId(req: Request): string {
  if (!req.workspace) {
    throw new ForbiddenError('Workspace context is required');
  }
  return req.workspace.workspaceId;
}

async function list(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const query = req.query as unknown as ListLeadsQuery;
  const leads = await leadService.listLeads(workspaceId, query);
  return sendSuccess(res, { data: leads, message: 'Leads listed' });
}

async function create(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const input = req.body as CreateLeadInput;
  const lead = await leadService.createLead(workspaceId, input);
  return sendSuccess(res, { data: lead, message: 'Lead created', statusCode: HTTP_STATUS.CREATED });
}

async function getOne(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const { id } = req.params as unknown as LeadIdParam;
  const lead = await leadService.getLead(workspaceId, id);
  return sendSuccess(res, { data: lead, message: 'Lead retrieved' });
}

async function update(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const { id } = req.params as unknown as LeadIdParam;
  const input = req.body as UpdateLeadInput;
  const lead = await leadService.updateLead(workspaceId, id, input);
  return sendSuccess(res, { data: lead, message: 'Lead updated' });
}

export const leadController = { list, create, getOne, update };
