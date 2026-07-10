import * as Sentry from '@sentry/nextjs';

// Client-side Sentry init — the App Router convention for this Next.js
// version (see node_modules/next/dist/docs/.../instrumentation-client.md),
// replacing the older sentry.client.config.ts approach. No-ops when
// NEXT_PUBLIC_SENTRY_DSN is unset.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    environment: process.env.NODE_ENV,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
