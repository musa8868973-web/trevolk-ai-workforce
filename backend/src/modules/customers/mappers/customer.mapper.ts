// backend/src/modules/customers/mappers/customer.mapper.ts
import type { Customer } from '@prisma/client';

export interface SafeCustomer {
  id: string;
  workspaceId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  sourceChannel: string | null;
  firstContactAt: Date | null;
  tags: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toSafeCustomer(customer: Customer): SafeCustomer {
  return {
    id: customer.id,
    workspaceId: customer.workspaceId,
    name: customer.name ?? null,
    email: customer.email ?? null,
    phone: customer.phone ?? null,
    sourceChannel: customer.sourceChannel ?? null,
    firstContactAt: customer.firstContactAt ?? null,
    tags: customer.tags ?? null,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}
