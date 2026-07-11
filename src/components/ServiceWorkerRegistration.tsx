'use client';

import { useEffect } from 'react';

// Registers the offline-fallback service worker (public/sw.js). This is a
// genuine imperative browser-API side effect, not a React state update —
// unlike the setState-in-effect pattern this codebase's lint rule blocks
// elsewhere, an effect is exactly the right place for it.
export const ServiceWorkerRegistration = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Non-critical — the site works fully online without it.
      });
    }
  }, []);

  return null;
};
