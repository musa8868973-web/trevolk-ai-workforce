import 'express';

/**
 * Global augmentation of Express's Request type.
 *
 * `id` is populated by the `requestId` middleware.
 * `auth` is populated by `requireAuth` once the caller's access token has
 * been verified. `workspace` is populated by `resolveWorkspace` once the
 * caller's membership in the requested workspace has been confirmed.
 */
declare global {
  namespace Express {
    interface Request {
      id: string;

      /** Populated by `requireAuth` after verifying the bearer access token. */
      auth?: {
        userId: string;
        email?: string;
      };

      /** Populated by `resolveWorkspace` after confirming workspace membership. */
      workspace?: {
        workspaceId: string;
        role: 'OWNER' | 'ADMIN' | 'TEAM_MEMBER';
      };
    }
  }
}

export {};
