import { ValidationError } from '@common/errors';
import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

export interface RequestValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Factory that builds an Express middleware validating `req.body`,
 * `req.query`, and/or `req.params` against Zod schemas, replacing each with
 * its parsed (and therefore typed + coerced) result.
 *
 * No concrete schemas are defined in Phase 1 — this is the reusable
 * mechanism future modules (`modules/<domain>/validators/*.schema.ts`) will
 * plug into.
 *
 * @example
 * router.post(
 *   '/leads',
 *   validate({ body: createLeadSchema }),
 *   asyncHandler(leadController.create),
 * );
 */
export function validate(schemas: RequestValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (error) {
      next(new ValidationError('Request validation failed', error));
    }
  };
}
