import { HTTP_STATUS } from '@common/constants';
import { UnauthorizedError } from '@common/errors';
import { sendSuccess } from '@common/response';
import type { Request, Response } from 'express';

import { authService } from '../services/auth.service';
import type {
  LoginInput,
  LogoutInput,
  RefreshTokenInput,
  RegisterInput,
} from '../validators/auth.schema';

async function register(req: Request, res: Response): Promise<Response> {
  const input = req.body as RegisterInput;
  const result = await authService.register(input);

  return sendSuccess(res, {
    data: result,
    message: 'Account created successfully',
    statusCode: HTTP_STATUS.CREATED,
  });
}

async function login(req: Request, res: Response): Promise<Response> {
  const input = req.body as LoginInput;
  const result = await authService.login(input);

  return sendSuccess(res, {
    data: result,
    message: 'Logged in successfully',
  });
}

async function refresh(req: Request, res: Response): Promise<Response> {
  const { refreshToken } = req.body as RefreshTokenInput;
  const tokens = await authService.refresh(refreshToken);

  return sendSuccess(res, {
    data: tokens,
    message: 'Token refreshed successfully',
  });
}

async function logout(req: Request, res: Response): Promise<Response> {
  if (!req.auth) {
    throw new UnauthorizedError('Authentication required');
  }

  const { refreshToken } = req.body as LogoutInput;
  await authService.logout(req.auth.userId, refreshToken);

  return sendSuccess(res, {
    data: null,
    message: 'Logged out successfully',
  });
}

async function me(req: Request, res: Response): Promise<Response> {
  if (!req.auth) {
    throw new UnauthorizedError('Authentication required');
  }

  const result = await authService.getCurrentUser(req.auth.userId);

  return sendSuccess(res, {
    data: result,
    message: 'Current user retrieved successfully',
  });
}

export const authController = { register, login, refresh, logout, me };
