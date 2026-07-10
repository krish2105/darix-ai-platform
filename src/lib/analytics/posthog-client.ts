'use client';

import posthog from 'posthog-js';

let initialized = false;

export const initPostHog = () => {
  if (initialized || typeof window === 'undefined') return;
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return;

  posthog.init(apiKey, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    autocapture: false,
  });
  initialized = true;
};

// No-op when PostHog isn't configured (or hasn't initialized yet, e.g. in
// tests/SSR) — every call site treats analytics as fire-and-forget.
export const trackEvent = (event: string, properties?: Record<string, unknown>) => {
  if (!initialized || typeof window === 'undefined') return;
  posthog.capture(event, properties);
};

// Thin wrapper around PostHog's feature-flag/experiment API (already
// bundled in posthog-js, previously unused — this is the first real
// consumer). Same graceful-degradation contract as trackEvent: returns
// undefined when PostHog isn't configured, so every call site should
// treat that as "use the default/control experience," never throw.
export const getFeatureFlag = (key: string): string | boolean | undefined => {
  if (!initialized || typeof window === 'undefined') return undefined;
  return posthog.getFeatureFlag(key);
};

// Flags are fetched asynchronously after init(), so reading getFeatureFlag
// immediately on mount can return undefined even when PostHog is
// configured and a flag exists. Callers that need to react to a flag
// value should wait for this callback rather than reading synchronously.
// When PostHog isn't configured at all, the callback still fires (as a
// microtask) so UI waiting on it doesn't hang indefinitely — it just gets
// "no flag data," same as the configured-but-flag-unset case.
export const onFeatureFlagsLoaded = (callback: () => void): void => {
  if (!initialized || typeof window === 'undefined') {
    Promise.resolve().then(callback);
    return;
  }
  posthog.onFeatureFlags(callback);
};
