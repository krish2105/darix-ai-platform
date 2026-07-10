import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { getClientIp } from './index';

describe('rateLimit (in-memory, no Redis configured)', () => {
  it('allows requests up to the limit and blocks the next one', async () => {
    const { rateLimit } = await import('./index');
    const key = `test-key-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      const result = await rateLimit(key, { limit: 3, windowMs: 60_000 });
      expect(result.allowed).toBe(true);
    }
    const blocked = await rateLimit(key, { limit: 3, windowMs: 60_000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('tracks separate keys independently', async () => {
    const { rateLimit } = await import('./index');
    const keyA = `a-${Math.random()}`;
    const keyB = `b-${Math.random()}`;
    await rateLimit(keyA, { limit: 1, windowMs: 60_000 });
    const blockedA = await rateLimit(keyA, { limit: 1, windowMs: 60_000 });
    const allowedB = await rateLimit(keyB, { limit: 1, windowMs: 60_000 });
    expect(blockedA.allowed).toBe(false);
    expect(allowedB.allowed).toBe(true);
  });
});

describe('rateLimit (Redis-backed)', () => {
  const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  beforeEach(() => {
    vi.resetModules();
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  });

  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('@upstash/redis');
    process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
  });

  it('uses Redis INCR/PTTL when configured and blocks over the limit', async () => {
    const store = new Map<string, number>();
    vi.doMock('@upstash/redis', () => ({
      Redis: class {
        incr = vi.fn(async (key: string) => {
          const next = (store.get(key) ?? 0) + 1;
          store.set(key, next);
          return next;
        });
        pexpire = vi.fn(async () => 1);
        pttl = vi.fn(async () => 60_000);
      },
    }));

    const { rateLimit } = await import('./index');
    const key = `redis-key-${Math.random()}`;
    const first = await rateLimit(key, { limit: 2, windowMs: 60_000 });
    const second = await rateLimit(key, { limit: 2, windowMs: 60_000 });
    const third = await rateLimit(key, { limit: 2, windowMs: 60_000 });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });

  it('falls back to in-memory limiting when the Redis call throws', async () => {
    vi.doMock('@upstash/redis', () => ({
      Redis: class {
        incr = vi.fn().mockRejectedValue(new Error('connection refused'));
        pexpire = vi.fn();
        pttl = vi.fn();
      },
    }));

    const { rateLimit } = await import('./index');
    const result = await rateLimit(`redis-fallback-${Math.random()}`, { limit: 3, windowMs: 60_000 });
    expect(result.allowed).toBe(true);
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
