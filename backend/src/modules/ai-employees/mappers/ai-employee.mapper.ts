import type { AIEmployee } from '@prisma/client';

import type { AIEmployeeConfiguration } from '../types/ai-employee-configuration.types';

/**
 * Client-safe AI Employee shape. Explicitly whitelists fields (same
 * pattern as `organizations/mappers/organization.mapper.ts` and
 * `workspaces/mappers/workspace.mapper.ts`) so a future column added to
 * `AIEmployee` doesn't leak to API responses by default, and so
 * `configuration` — which must never contain secrets (Phase 5A §8, §12)
 * — is returned as parsed JSON rather than a raw string.
 */
export interface SafeAIEmployee {
  id: string;
  workspaceId: string;
  employeeType: string;
  name: string;
  description: string | null;
  status: string;
  configuration: AIEmployeeConfiguration;
  lastActiveAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Parses the jsonb-as-string `configuration` column back into an object; tolerant of malformed values (same pattern as `workspace.mapper.ts`). */
function parseConfiguration(value: string): AIEmployeeConfiguration {
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as AIEmployeeConfiguration)
      : {};
  } catch {
    return {};
  }
}

export function toSafeAIEmployee(employee: AIEmployee): SafeAIEmployee {
  return {
    id: employee.id,
    workspaceId: employee.workspaceId,
    employeeType: employee.employeeType,
    name: employee.name,
    description: employee.description,
    status: employee.status,
    configuration: parseConfiguration(employee.configuration),
    lastActiveAt: employee.lastActiveAt,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
}
