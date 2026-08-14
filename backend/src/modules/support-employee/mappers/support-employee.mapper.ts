// backend/src/modules/support-employee/mappers/support-employee.mapper.ts
import { toSafeAIEmployee } from '@modules/ai-employees/mappers/ai-employee.mapper';

// Currently no support‑specific mapping logic – reuse generic mapper.
export const supportEmployeeMapper = {
  toSafe: toSafeAIEmployee,
};
