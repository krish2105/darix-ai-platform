import { PostHog } from 'posthog-node';

// Server-side capture, used where the event happens outside a browser
// context (e.g. the Stripe webhook, which fires after the user has already
// left the tab). A no-op when unconfigured so analytics being unset never
// breaks a real user-facing flow.
//
// A fresh client is created per call rather than cached at module scope:
// serverless function instances are short-lived and each capture here is
// immediately flushed + shut down, so there's nothing worth reusing across
// invocations and caching would risk calling into an already-shutdown client.
export const captureServerEvent = async (
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) => {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return;

  const posthog = new PostHog(apiKey, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    flushAt: 1,
    flushInterval: 0,
  });

  try {
    posthog.capture({ distinctId, event, properties });
    await posthog.shutdown();
  } catch (err) {
    console.error('PostHog server capture failed', err);
  }
};
