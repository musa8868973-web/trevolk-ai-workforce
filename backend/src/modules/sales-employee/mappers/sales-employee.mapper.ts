// backend/src/modules/sales-employee/mappers/sales-employee.mapper.ts
import { toSafeAIEmployee } from '@modules/ai-employees/mappers/ai-employee.mapper';

// Currently no sales‑specific mapping logic – we simply reuse the generic mapper.
export const salesEmployeeMapper = {
  toSafe: toSafeAIEmployee,
};
