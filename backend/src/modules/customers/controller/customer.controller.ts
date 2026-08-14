// backend/src/modules/customers/controller/customer.controller.ts
import { HTTP_STATUS } from '@common/constants';
import { ForbiddenError } from '@common/errors';
import { sendSuccess } from '@common/response';
import type { Request, Response } from 'express';

import { customerService } from '../services/customer.service';

function requireWorkspaceId(req: Request): string {
  if (!req.workspace) {
    throw new ForbiddenError('Workspace context is required');
  }
  return req.workspace.workspaceId;
}

type CustomerInput = {
  name?: string;
  email?: string;
  phone?: string;
  sourceChannel?: string;
  tags?: string;
};

export const customerController = {
  async createCustomer(req: Request, res: Response): Promise<void> {
    const workspaceId = requireWorkspaceId(req);
    const customer = await customerService.createCustomer(workspaceId, req.body as CustomerInput);
    sendSuccess(res, { data: customer, message: 'Customer created', statusCode: HTTP_STATUS.CREATED });
  },

  async listCustomers(req: Request, res: Response): Promise<void> {
    const workspaceId = requireWorkspaceId(req);
    const customers = await customerService.listCustomers(workspaceId);
    sendSuccess(res, { data: customers });
  },

  async getCustomer(req: Request, res: Response): Promise<void> {
    const workspaceId = requireWorkspaceId(req);
    const customer = await customerService.getCustomer(workspaceId, req.params['id']!);
    sendSuccess(res, { data: customer });
  },

  async updateCustomer(req: Request, res: Response): Promise<void> {
    const workspaceId = requireWorkspaceId(req);
    const customer = await customerService.updateCustomer(workspaceId, req.params['id']!, req.body as CustomerInput);
    sendSuccess(res, { data: customer });
  },

  async deleteCustomer(req: Request, res: Response): Promise<void> {
    const workspaceId = requireWorkspaceId(req);
    await customerService.deleteCustomer(workspaceId, req.params['id']!);
    sendSuccess(res, { data: null, message: 'Customer deleted' });
  },
};
