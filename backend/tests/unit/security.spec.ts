import {
  JwtError,
  parseDurationToSeconds,
  signJwt,
  verifyJwt,
} from '../../src/shared/security/jwt.util';
import { hashPassword, verifyPassword } from '../../src/shared/security/password.util';

describe('password.util', () => {
  it('hashes a password to a salt:hash format distinct from the plaintext', () => {
    const hash = hashPassword('correctHorseBattery9');

    expect(hash).not.toBe('correctHorseBattery9');
    expect(hash.split(':')).toHaveLength(2);
  });

  it('produces a different hash each time (random salt)', () => {
    const hashA = hashPassword('correctHorseBattery9');
    const hashB = hashPassword('correctHorseBattery9');

    expect(hashA).not.toBe(hashB);
  });

  it('verifies a correct password', () => {
    const hash = hashPassword('correctHorseBattery9');
    expect(verifyPassword('correctHorseBattery9', hash)).toBe(true);
  });

  it('rejects an incorrect password', () => {
    const hash = hashPassword('correctHorseBattery9');
    expect(verifyPassword('wrongPassword1', hash)).toBe(false);
  });

  it('rejects a malformed stored hash instead of throwing', () => {
    expect(verifyPassword('anything', 'not-a-valid-hash')).toBe(false);
  });
});

describe('jwt.util', () => {
  const secret = 'a-sufficiently-long-test-secret-key';

  it('round-trips a signed payload', () => {
    const token = signJwt({ sub: 'user-1', email: 'a@b.com' }, secret, '1h');
    const payload = verifyJwt(token, secret);

    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('a@b.com');
    expect(typeof payload.iat).toBe('number');
    expect(typeof payload.exp).toBe('number');
  });

  it('rejects a token verified with the wrong secret', () => {
    const token = signJwt({ sub: 'user-1' }, secret, '1h');
    expect(() => verifyJwt(token, 'a-completely-different-secret-value')).toThrow(JwtError);
  });

  it('rejects a tampered payload', () => {
    const token = signJwt({ sub: 'user-1' }, secret, '1h');
    const [header, , signature] = token.split('.');
    const tamperedPayload = Buffer.from(JSON.stringify({ sub: 'attacker' })).toString('base64url');
    const tampered = `${header}.${tamperedPayload}.${signature}`;

    expect(() => verifyJwt(tampered, secret)).toThrow(JwtError);
  });

  it('rejects a malformed token', () => {
    expect(() => verifyJwt('not-a-jwt', secret)).toThrow(JwtError);
  });

  it('rejects an expired token', () => {
    const realNow = Date.now();
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(realNow - 10_000);
    const token = signJwt({ sub: 'user-1' }, secret, '1s');
    nowSpy.mockRestore();

    expect(() => verifyJwt(token, secret)).toThrow('Token has expired');
  });

  it('parses duration strings into seconds', () => {
    expect(parseDurationToSeconds('30s')).toBe(30);
    expect(parseDurationToSeconds('15m')).toBe(15 * 60);
    expect(parseDurationToSeconds('2h')).toBe(2 * 60 * 60);
    expect(parseDurationToSeconds('1d')).toBe(24 * 60 * 60);
    expect(parseDurationToSeconds('3600')).toBe(3600);
  });

  it('throws on an invalid duration string', () => {
    expect(() => parseDurationToSeconds('not-a-duration')).toThrow(JwtError);
  });
});
