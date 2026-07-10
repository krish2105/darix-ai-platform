import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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
