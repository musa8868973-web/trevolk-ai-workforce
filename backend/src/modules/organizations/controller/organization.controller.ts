import { UnauthorizedError } from '@common/errors';
import { sendSuccess } from '@common/response';
import type { Request, Response } from 'express';

import { organizationService } from '../services/organization.service';
import type { OrganizationIdParam, UpdateOrganizationInput } from '../validators/organization.schema';

function requireAuthUserId(req: Request): string {
  if (!req.auth) {
    throw new UnauthorizedError('Authentication required');
  }
  return req.auth.userId;
}

async function getOne(req: Request, res: Response): Promise<Response> {
  const userId = requireAuthUserId(req);
  const { id } = req.params as unknown as OrganizationIdParam;

  const organization = await organizationService.getOrganizationForUser(id, userId);

  return sendSuccess(res, {
    data: organization,
    message: 'Organization retrieved successfully',
  });
}

async function update(req: Request, res: Response): Promise<Response> {
  const userId = requireAuthUserId(req);
  const { id } = req.params as unknown as OrganizationIdParam;
  const input = req.body as UpdateOrganizationInput;

  const organization = await organizationService.updateOrganization(id, userId, input);

  return sendSuccess(res, {
    data: organization,
    message: 'Organization updated successfully',
  });
}

export const organizationController = { getOne, update };
