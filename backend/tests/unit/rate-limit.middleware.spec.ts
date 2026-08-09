jest.mock('@config/index', () => ({
  appConfig: { isTest: false },
}));

import { rateLimit } from '../../src/common/middlewares/rate-limit.middleware';

function mockReqRes(ip: string) {
  const req: any = { ip };
  const res: any = {};
  const next = jest.fn();
  return { req, res, next };
}

describe('rateLimit', () => {
  it('allows requests under the limit', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 2 });
    const { req, res, next } = mockReqRes('1.2.3.4');

    limiter(req, res, next);
    limiter(req, res, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(next).toHaveBeenNthCalledWith(1);
    expect(next).toHaveBeenNthCalledWith(2);
  });

  it('rejects requests once the limit is exceeded', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 2, message: 'slow down' });
    const { req, res, next } = mockReqRes('1.2.3.4');

    limiter(req, res, next);
    limiter(req, res, next);
    limiter(req, res, next);

    expect(next).toHaveBeenCalledTimes(3);
    expect(next.mock.calls[2][0]).toMatchObject({ statusCode: 429 });
  });

  it('tracks limits independently per IP', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 1 });
    const a = mockReqRes('1.1.1.1');
    const b = mockReqRes('2.2.2.2');

    limiter(a.req, a.res, a.next);
    limiter(b.req, b.res, b.next);

    expect(a.next).toHaveBeenCalledWith();
    expect(b.next).toHaveBeenCalledWith();
  });
});
