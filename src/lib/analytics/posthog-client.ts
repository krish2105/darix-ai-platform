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
