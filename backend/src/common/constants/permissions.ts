import { WORKSPACE_ROLES, type WorkspaceRole } from './roles';

/**
 * Practical, MVP-scoped permission categories (Backend Specification §2.5,
 * §5). Deliberately coarse-grained ("manage" a domain, not a permission per
 * CRUD verb) — enough to gate sensitive actions without an unbounded
 * permission list.
 */
export const PERMISSIONS = {
  WORKSPACE_MANAGE: 'workspace:manage',
  TEAM_MANAGE: 'team:manage',
  AI_EMPLOYEE_MANAGE: 'ai_employee:manage',
  CUSTOMER_MANAGE: 'customer:manage',
  LEAD_MANAGE: 'lead:manage',
  CONVERSATION_MANAGE: 'conversation:manage',
  APPOINTMENT_MANAGE: 'appointment:manage',
  KNOWLEDGE_BASE_MANAGE: 'knowledge_base:manage',
  INTEGRATION_MANAGE: 'integration:manage',
  ANALYTICS_VIEW: 'analytics:view',
  SALES_EMPLOYEE_MANAGE: 'sales_employee:manage',
  SALES_EMPLOYEE_QUALIFY: 'sales_employee:qualify',
  SALES_EMPLOYEE_BOOK: 'sales_employee:book',
  SUPPORT_EMPLOYEE_MANAGE: 'support_employee:manage',
  SUPPORT_EMPLOYEE_FAQ: 'support_employee:faq',
  SUPPORT_EMPLOYEE_ORDER_LOOKUP: 'support_employee:order_lookup',
  RECEPTIONIST_EMPLOYEE_MANAGE: 'receptionist_employee:manage',
  RECEPTIONIST_EMPLOYEE_BOOK: 'receptionist_employee:book',
  FOLLOWUP_EMPLOYEE_MANAGE: 'followup_employee:manage',
  FOLLOWUP_EMPLOYEE_TRIGGER: 'followup_employee:trigger',

} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

/**
 * Role → permission grants.
 *
 * - Owner/Admin: full access, including workspace/team/integration
 *   management (Backend Specification §2.5: "Sensitive actions (billing,
 *   integrations, deleting an AI Employee, team management) are restricted
 *   to Owner/Admin").
 * - Team Member: scoped to day-to-day operational work — conversations,
 *   leads, customers, appointments — matching the Frontend Specification's
 *   Team Member persona ("Conversations and Leads, not Settings or
 *   Billing").
 */
export const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  [WORKSPACE_ROLES.OWNER]: ALL_PERMISSIONS,
  [WORKSPACE_ROLES.ADMIN]: ALL_PERMISSIONS,
  [WORKSPACE_ROLES.TEAM_MEMBER]: [
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.CONVERSATION_MANAGE,
    PERMISSIONS.LEAD_MANAGE,
    PERMISSIONS.CUSTOMER_MANAGE,
    PERMISSIONS.APPOINTMENT_MANAGE,
    PERMISSIONS.SALES_EMPLOYEE_QUALIFY,
    PERMISSIONS.SALES_EMPLOYEE_BOOK,
    PERMISSIONS.SUPPORT_EMPLOYEE_FAQ,
    PERMISSIONS.SUPPORT_EMPLOYEE_ORDER_LOOKUP,
    PERMISSIONS.RECEPTIONIST_EMPLOYEE_BOOK,
    PERMISSIONS.FOLLOWUP_EMPLOYEE_TRIGGER,
  ],
};

/** Returns true if the given workspace role has been granted `permission`. */
export function roleHasPermission(role: WorkspaceRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
