import type {
  ApiErrorResponse,
  ApiPaginatedResponse,
  ApiSuccessResponse,
  PaginationMeta,
} from '@app-types/index';
import type { Response } from 'express';

/**
 * `Response['req']['id']` is typed as `ReqId` (string | number) by
 * `pino-http`'s Express augmentation, even though our own request-id
 * middleware always assigns a string. Normalize to `string | undefined`
 * here so response envelopes have a single, predictable type.
 */
function resolveRequestId(res: Response): string | undefined {
  const id = res.req?.id;
  return id === undefined ? undefined : String(id);
}

/**
 * Sends a standardized success response.
 *
 * @example
 * sendSuccess(res, { message: 'Employee activated', data: employee });
 */
export function sendSuccess<TData>(
  res: Response,
  params: {
    data: TData;
    message?: string;
    statusCode?: number;
    meta?: Record<string, unknown>;
  },
): Response<ApiSuccessResponse<TData>> {
  const { data, message = 'Success', statusCode = 200, meta } = params;

  const payload: ApiSuccessResponse<TData> = {
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
    requestId: resolveRequestId(res),
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(payload);
}

/**
 * Sends a standardized error response. Prefer throwing an `AppError`
 * subclass and letting the global error handler call this instead of
 * calling it directly from a controller.
 */
export function sendError(
  res: Response,
  params: {
    message: string;
    errorCode: string;
    statusCode?: number;
    details?: unknown;
  },
): Response<ApiErrorResponse> {
  const { message, errorCode, statusCode = 500, details } = params;

  const payload: ApiErrorResponse = {
    success: false,
    message,
    errorCode,
    ...(details !== undefined ? { details } : {}),
    requestId: resolveRequestId(res),
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(payload);
}

/**
 * Builds pagination metadata from a page/limit/totalItems triple.
 */
export function buildPaginationMeta(params: {
  page: number;
  limit: number;
  totalItems: number;
}): PaginationMeta {
  const { page, limit, totalItems } = params;
  const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Sends a standardized paginated list response.
 */
export function sendPaginated<TItem>(
  res: Response,
  params: {
    data: TItem[];
    page: number;
    limit: number;
    totalItems: number;
    message?: string;
  },
): Response<ApiPaginatedResponse<TItem>> {
  const { data, page, limit, totalItems, message = 'Success' } = params;

  const payload: ApiPaginatedResponse<TItem> = {
    success: true,
    message,
    data,
    pagination: buildPaginationMeta({ page, limit, totalItems }),
    requestId: resolveRequestId(res),
    timestamp: new Date().toISOString(),
  };

  return res.status(200).json(payload);
}
