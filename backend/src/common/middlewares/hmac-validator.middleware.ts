// backend/src/common/middlewares/hmac-validator.middleware.ts
/**
 * Generic HMAC-SHA256 signature verification middleware.
 *
 * Third-party platforms (WhatsApp/Meta, Stripe, custom webhooks) sign their
 * outgoing webhook payloads with an HMAC so receivers can verify authenticity.
 * This middleware validates the signature before the request reaches any
 * business logic.
 *
 * Usage:
 *   router.post('/webhook', hmacValidator({ secret: 'xxx', header: 'x-hub-signature-256' }), handler);
 */
import { timingSafeEqual, createHmac } from 'node:crypto';
import type { RequestHandler } from 'express';
import { ForbiddenError } from '@common/errors';

export interface HmacValidatorOptions {
  /** The shared secret used to verify the signature. */
  secret: string;
  /**
   * The HTTP header that carries the signature.
   * e.g. 'x-hub-signature-256' (Meta/WhatsApp) or 'stripe-signature'
   */
  header: string;
  /**
   * Optional prefix to strip before comparing the hex digest.
   * WhatsApp sends 'sha256=<hex>', Stripe sends 'v1=<hex>,t=<timestamp>'.
   * Defaults to 'sha256=' for Meta/WhatsApp.
   */
  prefix?: string;
  /** HMAC digest algorithm. Defaults to 'sha256'. */
  algorithm?: string;
}

/**
 * Creates an Express middleware that validates the HMAC signature on incoming
 * webhook payloads. Requires `express.raw()` or `express.json({ verify })` to
 * have populated `req.rawBody` (or the raw buffer on `req`).
 *
 * IMPORTANT: Mount `express.raw({ type: '*\/*' })` BEFORE this middleware on
 * webhook routes so the raw body bytes are available.
 */
export function hmacValidator(options: HmacValidatorOptions): RequestHandler {
  const {
    secret,
    header,
    prefix = 'sha256=',
    algorithm = 'sha256',
  } = options;

  return (req, _res, next): void => {
    try {
      const sigHeader = req.headers[header.toLowerCase()] as string | undefined;

      if (!sigHeader) {
        throw new ForbiddenError(`Missing webhook signature header: ${header}`);
      }

      // Strip known prefix (e.g. 'sha256=')
      let receivedSig = sigHeader;
      if (prefix && receivedSig.startsWith(prefix)) {
        receivedSig = receivedSig.slice(prefix.length);
      }

      // For Stripe-style 'v1=<hex>,t=<timestamp>' strip 'v1='
      if (receivedSig.includes(',')) {
        const parts = receivedSig.split(',');
        const v1Part = parts.find((p) => p.startsWith('v1='));
        if (v1Part) receivedSig = v1Part.slice(3);
      }

      // Raw body must be available as Buffer on req (set by express.raw middleware)
      const rawBody: Buffer = (req as unknown as Record<string, unknown>)['rawBody'] as Buffer;
      if (!rawBody) {
        throw new ForbiddenError('Raw request body unavailable for HMAC verification');
      }

      const expectedSig = createHmac(algorithm, secret)
        .update(rawBody)
        .digest('hex');

      const receivedBuf = Buffer.from(receivedSig, 'hex');
      const expectedBuf = Buffer.from(expectedSig, 'hex');

      if (
        receivedBuf.length !== expectedBuf.length ||
        !timingSafeEqual(receivedBuf, expectedBuf)
      ) {
        throw new ForbiddenError('Webhook signature mismatch');
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
