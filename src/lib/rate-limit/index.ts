import { Redis } from '@upstash/redis';

// Fixed-window rate limiter for public API routes. Backed by Upstash Redis
// when UPSTASH_REDIS_REST_URL/TOKEN are configured — shared across every
// serverless instance/region, a real guarantee. Falls back to an
// in-process Map otherwise, which only protects a single warm instance
// (fine for local dev, a soft speed bump in a multi-instance deployment).
const hits = new Map<string, { count: number; resetAt: number }>();

let redisClient: Redis | null | undefined;

const getRedisClient = (): Redis | null => {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redisClient = url && token ? new Redis({ url, token }) : null;
  return redisClient;
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const rateLimitInMemory = (
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): RateLimitResult => {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    hits.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
};

const rateLimitRedis = async (
  redis: Redis,
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): Promise<RateLimitResult> => {
  const windowKey = `ratelimit:${key}`;
  const count = await redis.incr(windowKey);
  if (count === 1) {
    await redis.pexpire(windowKey, windowMs);
  }
  const ttl = await redis.pttl(windowKey);
  const resetAt = Date.now() + (ttl > 0 ? ttl : windowMs);

  if (count > limit) {
    return { allowed: false, remaining: 0, resetAt };
  }
  return { allowed: true, remaining: Math.max(0, limit - count), resetAt };
};

export const rateLimit = async (
  key: string,
  options: { limit: number; windowMs: number }
): Promise<RateLimitResult> => {
  const redis = getRedisClient();
  if (!redis) return rateLimitInMemory(key, options);

  try {
    return await rateLimitRedis(redis, key, options);
  } catch (err) {
    console.error('Redis rate limit check failed, falling back to in-memory', err);
    return rateLimitInMemory(key, options);
  }
};

export const getClientIp = (request: Request): string => {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
};
