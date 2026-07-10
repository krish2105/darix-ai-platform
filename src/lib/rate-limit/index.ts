// Minimal in-memory fixed-window rate limiter for public API routes.
//
// Known limitation: this is per serverless-function-instance state, not
// shared across instances/regions, so on Vercel it's a soft speed bump
// rather than a hard guarantee. It stops a single naive script from
// hammering an endpoint from one warm instance. For a real bot-abuse
// guarantee, swap this for Upstash Redis (or Vercel's own rate limiting)
// plus a CAPTCHA (hCaptcha/Turnstile) on the public forms.
const hits = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export const rateLimit = (
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

export const getClientIp = (request: Request): string => {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
};
