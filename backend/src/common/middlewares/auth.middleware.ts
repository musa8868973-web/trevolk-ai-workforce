import { roleHasPermission, type Permission, type WorkspaceRole } from '@common/constants';
import { ForbiddenError, UnauthorizedError, ValidationError } from '@common/errors';
import { appConfig } from '@config/index';
import { prisma } from '@database/index';
import { JwtError, verifyJwt, type JwtPayload } from '@shared/security';
import type { NextFunction, Request, Response } from 'express';

interface AccessTokenPayload extends JwtPayload {
  sub: string;
  email?: string;
  type?: string;
}

/**
 * Authentication middleware.
 *
 * Verifies the `Authorization: Bearer <token>` access token (a stateless,
 * short-lived JWT signed with `JWT_SECRET` — see `modules/auth`), and
 * attaches the resolved identity to `req.auth`. Rejects the request with a
 * generic `UnauthorizedError` for any missing/malformed/expired/tampered
 * token, without distinguishing the reason to the client.
 *
 * Deliberately does NOT hit the database: access tokens are stateless by
 * design so authenticated requests stay fast. Revocation (logout) only
 * needs to invalidate refresh tokens — see `modules/auth/services`.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('Authorization');

  if (!header || !header.startsWith('Bearer ')) {
    next(new UnauthorizedError('Authentication required'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();

  if (!token) {
    next(new UnauthorizedError('Authentication required'));
    return;
  }

  try {
    const payload = verifyJwt<AccessTokenPayload>(token, appConfig.auth.jwt.secret);

    if (payload.type && payload.type !== 'access') {
      next(new UnauthorizedError('Invalid access token'));
      return;
    }

    if (!payload.sub) {
      next(new UnauthorizedError('Invalid access token'));
      return;
    }

    req.auth = { userId: payload.sub, email: payload.email };
    next();
  } catch (error) {
    if (error instanceof JwtError) {
      next(new UnauthorizedError('Invalid or expired access token'));
      return;
    }
    next(error);
  }
}

/**
 * Workspace resolution middleware.
 *
 * Resolves the active workspace for the request from the `X-Workspace-Id`
 * header (or a `:workspaceId` route param, when present) and confirms the
 * authenticated user is a member of it, per the Backend Specification's
 * Workspace Module ("this module is what makes multi-tenancy
 * enforceable") and the multi-tenant security rule that a workspace ID is
 * never trusted from the client without validating membership.
 *
 * Must run after `requireAuth`. Populates `req.workspace` with the
 * confirmed `workspaceId` and the caller's role within it.
 */
export async function resolveWorkspace(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.auth) {
    next(new UnauthorizedError('Authentication required'));
    return;
  }

  const workspaceId =
    req.header('X-Workspace-Id') ?? (req.params.workspaceId as string | undefined) ?? undefined;

  if (!workspaceId) {
    next(new ValidationError('A workspace context (X-Workspace-Id header) is required'));
    return;
  }

  try {
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: req.auth.userId, workspaceId } },
      include: { workspace: true },
    });

    if (!membership || membership.workspace.deletedAt) {
      next(new ForbiddenError('You do not have access to this workspace'));
      return;
    }

    if (!membership.acceptedAt) {
      next(
        new ForbiddenError(
          'You have a pending invitation to this workspace — accept it before continuing',
        ),
      );
      return;
    }

    req.workspace = { workspaceId, role: membership.role as WorkspaceRole };
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role-based access control middleware factory.
 *
 * Restricts a route to one or more workspace roles. Must run after
 * `resolveWorkspace`. Used for coarse, "this whole route is Owner/Admin
 * only" checks; prefer `requirePermission` for domain-specific gating.
 */
export function requireRole(...roles: WorkspaceRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.workspace) {
      next(new ForbiddenError('Workspace context is required for this action'));
      return;
    }

    if (!roles.includes(req.workspace.role)) {
      next(new ForbiddenError('You do not have permission to perform this action'));
      return;
    }

    next();
  };
}

/**
 * Permission-based access control middleware factory.
 *
 * Restricts a route to workspace roles that have been granted every listed
 * permission (see `common/constants/permissions.ts`). Must run after
 * `resolveWorkspace`.
 */
export function requirePermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.workspace) {
      next(new ForbiddenError('Workspace context is required for this action'));
      return;
    }

    const role = req.workspace.role;
    const hasAllPermissions = permissions.every((permission) =>
      roleHasPermission(role, permission),
    );

    if (!hasAllPermissions) {
      next(new ForbiddenError('You do not have permission to perform this action'));
      return;
    }

    next();
  };
}
