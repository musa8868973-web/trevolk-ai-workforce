// backend/src/modules/notifications/gateway/notification.gateway.ts
/**
 * Real-Time Socket.io Notification Gateway.
 *
 * Requirements:
 *  - Authenticates WebSocket connections during handshake via JWT.
 *  - Automatically joins clients to isolated rooms: `workspace_${workspaceId}`.
 *  - Emits workspace activity events securely with zero cross-tenant leakage.
 */

import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

import { appConfig } from '@config/index';
import { prisma } from '@database/index';
import { logger } from '@shared/logger';
import { verifyJwt, type JwtPayload } from '@shared/security';

import { type EventPayloadMap } from './notification.events';

interface AuthenticatedSocket extends Socket {
  authData?: {
    userId: string;
    workspaceId: string;
  };
}

interface HandshakeAuth {
  token?: string;
  workspaceId?: string;
}

let io: SocketIOServer | null = null;

/**
 * Initializes the Socket.io Notification Gateway attached to the HTTP server.
 */
export function initializeNotificationGateway(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: appConfig.cors.origin,
      credentials: true,
    },
    path: '/socket.io/',
  });

  // Handshake authentication & workspace authorization middleware
  io.use(async (socket: Socket, next) => {
    try {
      const auth = socket.handshake.auth as HandshakeAuth;
      const headerToken = socket.handshake.headers.authorization?.startsWith('Bearer ')
        ? socket.handshake.headers.authorization.slice(7)
        : undefined;

      const token = auth.token || headerToken;
      const workspaceId = auth.workspaceId || (socket.handshake.query.workspaceId as string);

      if (!token) {
        return next(new Error('Authentication token required for WebSocket connection'));
      }

      if (!workspaceId) {
        return next(new Error('Workspace ID required for WebSocket connection'));
      }

      // Verify access token
      const payload = verifyJwt<JwtPayload & { sub: string }>(token, appConfig.auth.jwt.secret);
      const userId = payload.sub;

      if (!userId) {
        return next(new Error('Invalid token payload'));
      }

      // Confirm user is an active member of the requested workspace
      const membership = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId } },
        include: { workspace: true },
      });

      if (!membership || membership.workspace.deletedAt || !membership.acceptedAt) {
        return next(new Error('Unauthorized access to workspace room'));
      }

      (socket as AuthenticatedSocket).authData = { userId, workspaceId };
      return next();
    } catch (err: any) {
      logger.error({ err: err.message }, 'WebSocket handshake authentication failed');
      return next(new Error('WebSocket authentication failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const authData = authSocket.authData;

    if (!authData) {
      socket.disconnect(true);
      return;
    }

    const roomName = `workspace_${authData.workspaceId}`;
    socket.join(roomName);

    logger.info(
      { socketId: socket.id, userId: authData.userId, workspaceId: authData.workspaceId },
      `Client connected to WebSocket room: ${roomName}`,
    );

    socket.on('disconnect', (reason) => {
      logger.info(
        { socketId: socket.id, userId: authData.userId, workspaceId: authData.workspaceId, reason },
        `Client disconnected from WebSocket room: ${roomName}`,
      );
    });
  });

  logger.info('🚀 Socket.io Notification Gateway initialized');
  return io;
}

/**
 * Gets the active Socket.io server instance.
 */
export function getNotificationGateway(): SocketIOServer | null {
  return io;
}

/**
 * Emits a strongly-typed real-time event to an isolated workspace room.
 * Ensures zero cross-tenant leakage by broadcasting strictly to `workspace_${workspaceId}`.
 */
export function emitToWorkspace<K extends keyof EventPayloadMap>(
  workspaceId: string,
  event: K,
  payload: EventPayloadMap[K],
): void {
  if (!io) {
    logger.warn({ workspaceId, event }, 'Socket.io gateway not initialized; skipping event emit');
    return;
  }

  const roomName = `workspace_${workspaceId}`;
  io.to(roomName).emit(event, payload);

  logger.debug(
    { workspaceId, roomName, event, payload },
    `Real-time event emitted to room ${roomName}`,
  );
}

/**
 * Closes the Socket.io gateway gracefully during server shutdown.
 */
export async function closeNotificationGateway(): Promise<void> {
  if (io) {
    await new Promise<void>((resolve) => {
      io!.close(() => {
        logger.info('Socket.io Notification Gateway closed');
        resolve();
      });
    });
    io = null;
  }
}
