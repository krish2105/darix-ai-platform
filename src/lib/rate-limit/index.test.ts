import { describe, expect, it } from 'vitest';
import { rateLimit, getClientIp } from './index';

describe('rateLimit', () => {
  it('allows requests up to the limit and blocks the next one', () => {
    const key = `test-key-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      const result = rateLimit(key, { limit: 3, windowMs: 60_000 });
      expect(result.allowed).toBe(true);
    }
    const blocked = rateLimit(key, { limit: 3, windowMs: 60_000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('tracks separate keys independently', () => {
    const keyA = `a-${Math.random()}`;
    const keyB = `b-${Math.random()}`;
    rateLimit(keyA, { limit: 1, windowMs: 60_000 });
    const blockedA = rateLimit(keyA, { limit: 1, windowMs: 60_000 });
    const allowedB = rateLimit(keyB, { limit: 1, windowMs: 60_000 });
    expect(blockedA.allowed).toBe(false);
    expect(allowedB.allowed).toBe(true);
  });
});

describe('getClientIp', () => {
  it('reads the first entry of x-forwarded-for', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.1' },
    });
    expect(getClientIp(req)).toBe('203.0.113.5');
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '198.51.100.9' },
    });
    expect(getClientIp(req)).toBe('198.51.100.9');
  });

  it('returns "unknown" when neither header is present', () => {
    const req = new Request('http://localhost');
    expect(getClientIp(req)).toBe('unknown');
  });
});
