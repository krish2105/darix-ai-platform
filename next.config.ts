import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Deliberately the "without nonces" CSP shape Next.js's own docs recommend
// (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md)
// rather than the nonce/'strict-dynamic' variant: nonces require forcing
// every page into dynamic rendering, which would kill static generation for
// the marketing pages, /resources, /case-studies, etc. — not a trade worth
// making for a marketing-heavy site. 'unsafe-inline' on script/style is the
// accepted cost of that choice; it still blocks the thing a CSP is mainly
// for here — arbitrary third-party script/exfil domains.
const isDev = process.env.NODE_ENV === 'development';
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://challenges.cloudflare.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://us.i.posthog.com https://*.i.posthog.com https://challenges.cloudflare.com https://*.sentry.io;
  frame-src https://challenges.cloudflare.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, ' ')
  .trim();

const nextConfig: NextConfig = {
  // The Arabic PDF font (src/lib/pdf/fonts.ts) is read from node_modules at
  // runtime via a dynamically-built path rather than a static import/
  // require, which keeps Turbopack from trying to bundle the .woff file as
  // a JS module — but that same dynamic path is invisible to Next's build
  // file tracer, so without this the font would be missing from a Vercel
  // serverless deploy even though it works locally.
  outputFileTracingIncludes: {
    '/api/assessments/[id]/pdf': ['./node_modules/@fontsource/tajawal/files/*.woff'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

// Only wraps the config (source-map upload, tunnel route) when Sentry is
// actually configured — an unset DSN means this is a no-op passthrough.
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      widenClientFileUpload: true,
      sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
    })
  : nextConfig;
