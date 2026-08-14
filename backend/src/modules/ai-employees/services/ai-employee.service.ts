import { ConflictError, NotFoundError } from '@common/errors';
import { prisma } from '@database/index';
import { logger } from '@shared/logger';

import { AI_EMPLOYEE_STATUSES, type AIEmployeeStatus } from '../constants/employee-status.constants';
import { toSafeAIEmployee, type SafeAIEmployee } from '../mappers/ai-employee.mapper';
import type {
  CreateAIEmployeeInput,
  ListAIEmployeesQuery,
  UpdateAIEmployeeInput,
} from '../validators/ai-employee.schema';

/**
 * Business logic for the AI Employee module (Backend Specification §5.3;
 * Phase 5A §6). Every function requires a `workspaceId` that has already
 * been verified by `resolveWorkspace` — this layer additionally scopes
 * every Prisma query by it (never trusting the caller further), per the
 * Database Design's defense-in-depth rule (§6.2) that isolation must not
 * depend on a single code path.
 *
 * A record outside the caller's workspace surfaces as `NotFoundError`
 * (404), not `ForbiddenError`, matching the rest of the codebase's
 * "don't leak cross-tenant existence" convention (`common/errors`).
 */

/** Fetches an employee scoped to the workspace, or throws NotFoundError. Centralizes the "workspace + id" lookup every other function needs. */
async function findWorkspaceEmployeeOrThrow(workspaceId: string, employeeId: string) {
  const employee = await prisma.aIEmployee.findFirst({
    where: { id: employeeId, workspaceId, deletedAt: null },
  });

  if (!employee) {
    throw new NotFoundError('AI Employee not found');
  }

  return employee;
}

async function createEmployee(
  workspaceId: string,
  input: CreateAIEmployeeInput,
): Promise<SafeAIEmployee> {
  const existing = await prisma.aIEmployee.findFirst({
    where: { workspaceId, employeeType: input.employeeType, deletedAt: null },
  });

  if (existing) {
    throw new ConflictError(
      `A ${input.employeeType} AI Employee already exists for this workspace`,
    );
  }

  const employee = await prisma.aIEmployee.create({
    data: {
      workspaceId,
      employeeType: input.employeeType,
      name: input.name,
      description: input.description ?? null,
      configuration: JSON.stringify(input.configuration ?? {}),
      status: AI_EMPLOYEE_STATUSES.NEEDS_SETUP,
    },
  });

  logger.info(
    { workspaceId, aiEmployeeId: employee.id, employeeType: employee.employeeType },
    'AI Employee created',
  );

  return toSafeAIEmployee(employee);
}

async function listEmployees(
  workspaceId: string,
  query: ListAIEmployeesQuery,
): Promise<SafeAIEmployee[]> {
  const employees = await prisma.aIEmployee.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      ...(query.employeeType ? { employeeType: query.employeeType } : {}),
      ...(query.status ? { status: query.status } : {}),
    },
    orderBy: { createdAt: 'asc' },
  });

  return employees.map(toSafeAIEmployee);
}

async function getEmployee(workspaceId: string, employeeId: string): Promise<SafeAIEmployee> {
  const employee = await findWorkspaceEmployeeOrThrow(workspaceId, employeeId);
  return toSafeAIEmployee(employee);
}

async function updateEmployee(
  workspaceId: string,
  employeeId: string,
  input: UpdateAIEmployeeInput,
): Promise<SafeAIEmployee> {
  const existing = await findWorkspaceEmployeeOrThrow(workspaceId, employeeId);

  const employee = await prisma.aIEmployee.update({
    where: { id: existing.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.configuration !== undefined
        ? { configuration: JSON.stringify(input.configuration) }
        : {}),
      ...(input.status === AI_EMPLOYEE_STATUSES.ACTIVE ? { lastActiveAt: new Date() } : {}),
    },
  });

  logger.info({ workspaceId, aiEmployeeId: employee.id }, 'AI Employee updated');

  return toSafeAIEmployee(employee);
}

/** Convenience wrapper over `updateEmployee` for a pure status transition — reusable by future modules (e.g., a status-change UI action) per Phase 5A §6. */
async function setStatus(
  workspaceId: string,
  employeeId: string,
  status: AIEmployeeStatus,
): Promise<SafeAIEmployee> {
  return updateEmployee(workspaceId, employeeId, { status } as UpdateAIEmployeeInput);
}

async function activateEmployee(workspaceId: string, employeeId: string): Promise<SafeAIEmployee> {
  return setStatus(workspaceId, employeeId, AI_EMPLOYEE_STATUSES.ACTIVE);
}

async function deactivateEmployee(
  workspaceId: string,
  employeeId: string,
): Promise<SafeAIEmployee> {
  return setStatus(workspaceId, employeeId, AI_EMPLOYEE_STATUSES.PAUSED);
}

export const aiEmployeeService = {
  createEmployee,
  listEmployees,
  getEmployee,
  updateEmployee,
  setStatus,
  activateEmployee,
  deactivateEmployee,
};
