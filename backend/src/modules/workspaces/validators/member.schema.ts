import { ALL_WORKSPACE_ROLES } from '@common/constants';
import { z } from 'zod';

export const memberIdParamSchema = z.object({
  workspaceId: z.string().uuid('A valid workspace ID is required'),
  memberId: z.string().uuid('A valid member ID is required'),
});
export type MemberIdParam = z.infer<typeof memberIdParamSchema>;

const roleSchema = z.enum(ALL_WORKSPACE_ROLES as [string, ...string[]]);

export const inviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email('A valid email address is required'),
  role: roleSchema,
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateMemberRoleSchema = z.object({
  role: roleSchema,
});
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
