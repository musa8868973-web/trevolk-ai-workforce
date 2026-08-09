import { HTTP_STATUS } from '@common/constants';
import { AppError } from '@common/errors';
import { sendError } from '@common/response';
import { appConfig } from '@config/index';
import { logger } from '@shared/logger';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

/**
 * Centralized error-handling middleware. Must be the last middleware
 * registered in `app.ts` (four-arity signature is what makes Express treat
 * this as an error handler).
 *
 * Responsibilities:
 * - Normalizes known error types (`AppError` subclasses, Zod validation
 *   errors) into the standard API error envelope.
 * - Never leaks stack traces or internal messages to the client in
 *   production — matches the Backend Specification's requirement that raw
 *   technical errors never reach end users.
 * - Logs every error with request correlation (`req.id`) for observability.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors that slipped through without being wrapped.
  if (err instanceof ZodError) {
    logger.warn({ requestId: req.id, issues: err.issues }, 'Validation error');
    sendError(res, {
      message: 'Request validation failed',
      errorCode: 'VALIDATION_ERROR',
      statusCode: HTTP_STATUS.BAD_REQUEST,
      details: err.flatten(),
    });
    return;
  }

  // Known, operational application errors.
  if (err instanceof AppError) {
    const logPayload = { requestId: req.id, errorCode: err.errorCode, details: err.details };

    if (err.isOperational) {
      logger.warn(logPayload, err.message);
    } else {
      logger.error({ ...logPayload, stack: err.stack }, err.message);
    }

    sendError(res, {
      message: err.message,
      errorCode: err.errorCode,
      statusCode: err.statusCode,
      details: appConfig.isProduction ? undefined : err.details,
    });
    return;
  }

  // Anything else is an unexpected, non-operational failure.
  const unexpectedError = err instanceof Error ? err : new Error('Unknown error');

  logger.error(
    { requestId: req.id, stack: unexpectedError.stack },
    `Unhandled error: ${unexpectedError.message}`,
  );

  sendError(res, {
    message: appConfig.isProduction
      ? 'An unexpected error occurred. Please try again later.'
      : unexpectedError.message,
    errorCode: 'INTERNAL_SERVER_ERROR',
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details: appConfig.isProduction ? undefined : { stack: unexpectedError.stack },
  });
}
