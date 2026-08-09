/**
 * Base class for every operational error thrown intentionally within the
 * application. Distinguishes expected, handleable errors (bad input,
 * missing resource, unauthorized access) from unexpected programmer errors,
 * so the global error handler can respond appropriately to each.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(params: {
    message: string;
    statusCode: number;
    errorCode: string;
    isOperational?: boolean;
    details?: unknown;
  }) {
    super(params.message);

    this.name = this.constructor.name;
    this.statusCode = params.statusCode;
    this.errorCode = params.errorCode;
    this.isOperational = params.isOperational ?? true;
    this.details = params.details;

    Error.captureStackTrace(this, this.constructor);
  }
}
