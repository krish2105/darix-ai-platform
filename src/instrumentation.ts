import * as Sentry from '@sentry/nextjs';

// Server + edge Sentry init. No-ops gracefully when NEXT_PUBLIC_SENTRY_DSN
// is unset — Sentry.init() with an empty dsn simply never sends events,
// matching the graceful-degradation pattern used for Stripe/Telr/Turnstile.
export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV,
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
