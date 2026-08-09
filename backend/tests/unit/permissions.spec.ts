import { PERMISSIONS, roleHasPermission, WORKSPACE_ROLES } from '../../src/common/constants';

describe('roleHasPermission', () => {
  it('grants Owner every permission', () => {
    Object.values(PERMISSIONS).forEach((permission) => {
      expect(roleHasPermission(WORKSPACE_ROLES.OWNER, permission)).toBe(true);
    });
  });

  it('grants Admin every permission', () => {
    Object.values(PERMISSIONS).forEach((permission) => {
      expect(roleHasPermission(WORKSPACE_ROLES.ADMIN, permission)).toBe(true);
    });
  });

  it('scopes Team Member to day-to-day operational permissions only', () => {
    expect(roleHasPermission(WORKSPACE_ROLES.TEAM_MEMBER, PERMISSIONS.LEAD_MANAGE)).toBe(true);
    expect(roleHasPermission(WORKSPACE_ROLES.TEAM_MEMBER, PERMISSIONS.CONVERSATION_MANAGE)).toBe(
      true,
    );
    expect(roleHasPermission(WORKSPACE_ROLES.TEAM_MEMBER, PERMISSIONS.CUSTOMER_MANAGE)).toBe(true);
    expect(roleHasPermission(WORKSPACE_ROLES.TEAM_MEMBER, PERMISSIONS.APPOINTMENT_MANAGE)).toBe(
      true,
    );
  });

  it('denies Team Member access to billing/settings-adjacent permissions', () => {
    expect(roleHasPermission(WORKSPACE_ROLES.TEAM_MEMBER, PERMISSIONS.WORKSPACE_MANAGE)).toBe(
      false,
    );
    expect(roleHasPermission(WORKSPACE_ROLES.TEAM_MEMBER, PERMISSIONS.TEAM_MANAGE)).toBe(false);
    expect(roleHasPermission(WORKSPACE_ROLES.TEAM_MEMBER, PERMISSIONS.INTEGRATION_MANAGE)).toBe(
      false,
    );
  });
});
