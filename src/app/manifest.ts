import type { MetadataRoute } from 'next';

// Makes the site installable (mainly the signed-in dashboard/report views)
// on mobile home screens. start_url is locale-neutral ("/") — proxy.ts
// already redirects "/" to the visitor's preferred locale, so this avoids
// baking one language into every install.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Darix AI — Dubai AI Readiness Index',
    short_name: 'Darix AI',
    description: "Assess your organization's AI readiness and track your Dubai AI Readiness Index score over time.",
    start_url: '/',
    display: 'standalone',
    background_color: '#030712',
    theme_color: '#030712',
    icons: [
      { src: '/icon', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
