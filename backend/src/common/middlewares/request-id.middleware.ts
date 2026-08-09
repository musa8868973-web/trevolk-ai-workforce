import { randomUUID } from 'crypto';

import { APP_CONSTANTS } from '@common/constants';
import type { NextFunction, Request, Response } from 'express';

/**
 * Attaches a unique request ID to every incoming request, reusing an
 * inbound `X-Request-Id` header when present (useful when the frontend or
 * an upstream proxy already generates one) so a single request can be
 * traced end-to-end across logs and error responses.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const headerValue = req.header(APP_CONSTANTS.REQUEST_ID_HEADER);
  const id = headerValue && headerValue.length > 0 ? headerValue : randomUUID();

  req.id = id;
  res.setHeader(APP_CONSTANTS.REQUEST_ID_HEADER, id);

  next();
}
