// backend/src/modules/customers/services/customer.service.ts
import { NotFoundError } from '@common/errors';
import { prisma } from '@database/index';
import { logger } from '@shared/logger';

import { toSafeCustomer } from '../mappers/customer.mapper';

async function findWorkspaceCustomerOrThrow(workspaceId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, workspaceId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer not found');
  return customer;
}

export const customerService = {
  async createCustomer(
    workspaceId: string,
    input: { name?: string; email?: string; phone?: string; sourceChannel?: string; tags?: string },
  ) {
    const customer = await prisma.customer.create({
      data: {
        workspaceId,
        name: input.name ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        sourceChannel: input.sourceChannel ?? null,
        firstContactAt: new Date(),
        tags: input.tags ?? null,
      },
    });
    logger.info({ workspaceId, customerId: customer.id }, 'Customer created');
    return toSafeCustomer(customer);
  },

  async listCustomers(workspaceId: string) {
    const customers = await prisma.customer.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return customers.map(toSafeCustomer);
  },

  async getCustomer(workspaceId: string, customerId: string) {
    const customer = await findWorkspaceCustomerOrThrow(workspaceId, customerId);
    return toSafeCustomer(customer);
  },

  async updateCustomer(
    workspaceId: string,
    customerId: string,
    input: { name?: string; email?: string; phone?: string; sourceChannel?: string; tags?: string },
  ) {
    const existing = await findWorkspaceCustomerOrThrow(workspaceId, customerId);
    const updated = await prisma.customer.update({
      where: { id: existing.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.sourceChannel !== undefined ? { sourceChannel: input.sourceChannel } : {}),
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
      },
    });
    logger.info({ workspaceId, customerId: updated.id }, 'Customer updated');
    return toSafeCustomer(updated);
  },

  async deleteCustomer(workspaceId: string, customerId: string) {
    const existing = await findWorkspaceCustomerOrThrow(workspaceId, customerId);
    await prisma.customer.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() },
    });
    logger.info({ workspaceId, customerId: existing.id }, 'Customer soft-deleted');
  },
};
