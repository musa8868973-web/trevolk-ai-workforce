import { AppError } from './app-error';

/**
 * 400 — Malformed or invalid request payload/params/query.
 * Typically thrown by the Zod-based validation middleware.
 */
export class ValidationError extends AppError {
  constructor(message = 'Request validation failed', details?: unknown) {
    super({
      message,
      statusCode: 400,
      errorCode: 'VALIDATION_ERROR',
      details,
    });
  }
}

/**
 * 401 — Caller could not be authenticated (missing/invalid/expired token).
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super({
      message,
      statusCode: 401,
      errorCode: 'UNAUTHORIZED',
    });
  }
}

/**
 * 403 — Caller is authenticated but not permitted to perform this action
 * (e.g., a Team Member hitting a Billing endpoint).
 */
export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super({
      message,
      statusCode: 403,
      errorCode: 'FORBIDDEN',
    });
  }
}

/**
 * 404 — Requested resource does not exist (or is outside the caller's
 * workspace, which — per the Backend Specification — should also surface
 * as a 404 rather than a 403 to avoid leaking cross-tenant existence).
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super({
      message,
      statusCode: 404,
      errorCode: 'NOT_FOUND',
    });
  }
}

/**
 * 409 — Request conflicts with current state (e.g., double-booking an
 * appointment slot, duplicate workspace member invite).
 */
export class ConflictError extends AppError {
  constructor(message = 'Request conflicts with the current state') {
    super({
      message,
      statusCode: 409,
      errorCode: 'CONFLICT',
    });
  }
}

/**
 * 429 — Caller has exceeded a configured rate limit.
 */
export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests — please try again later') {
    super({
      message,
      statusCode: 429,
      errorCode: 'TOO_MANY_REQUESTS',
    });
  }
}

/**
 * 500 — Unexpected internal failure. Marked non-operational by default
 * since it typically indicates a programmer error or unhandled edge case
 * rather than a predictable, user-facing condition.
 */
export class InternalServerError extends AppError {
  constructor(message = 'An unexpected error occurred', details?: unknown) {
    super({
      message,
      statusCode: 500,
      errorCode: 'INTERNAL_SERVER_ERROR',
      isOperational: false,
      details,
    });
  }
}

/**
 * 503 — A required upstream dependency (LLM provider, WhatsApp, Calendar,
 * database) is unavailable. Distinguished from InternalServerError so
 * callers/monitoring can tell "we broke" apart from "a dependency broke".
 */
export class ServiceUnavailableError extends AppError {
  constructor(message = 'A required service is temporarily unavailable') {
    super({
      message,
      statusCode: 503,
      errorCode: 'SERVICE_UNAVAILABLE',
    });
  }
}
