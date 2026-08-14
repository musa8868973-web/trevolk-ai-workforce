// backend/src/common/middlewares/sanitization.middleware.ts
/**
 * Global Input Sanitization & Injection Defense Middleware.
 *
 * Recursively strips dangerous script tags, executable HTML, and known XSS payloads
 * from `req.body`, `req.query`, and `req.params`.
 */

import type { NextFunction, Request, Response } from 'express';

const XSS_SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const DANGEROUS_ON_EVENTS = /on\w+\s*=/gi;
const JAVASCRIPT_URI_REGEX = /javascript\s*:/gi;

function sanitizeString(str: string): string {
  if (typeof str !== 'string') return str;
  return str
    .replace(XSS_SCRIPT_REGEX, '')
    .replace(DANGEROUS_ON_EVENTS, '')
    .replace(JAVASCRIPT_URI_REGEX, '');
}

function sanitizeObject(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const sanitized: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const cleanKey = sanitizeString(key);
    sanitized[cleanKey] = sanitizeObject(obj[key]);
  }
  return sanitized;
}

export function sanitizeInputsMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
}
