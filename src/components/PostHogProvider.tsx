'use client';

import { useEffect } from 'react';
import { initPostHog } from '@/lib/analytics/posthog-client';

// Initializes PostHog once on the client. Rendered near the root of the
// tree; renders nothing itself.
export const PostHogProvider = () => {
  useEffect(() => {
    initPostHog();
  }, []);

  return null;
};
