# Deployment Guide

## 1. Supabase (database + auth)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run every file in `supabase/migrations/` **in order**:
   - `0001_init.sql` — `public.assessments` (every completed quiz) and `public.leads` (contact-form submissions), with Row Level Security policies.
   - `0002_data_requests.sql` — `public.data_requests`, for anonymous UAE PDPL access/erasure requests submitted via `/privacy-center`.
   - `0003_leads_crm.sql` — adds `status`/`notes`/`updated_at` to `public.leads` for the CRM-lite pipeline view in `/admin`.
   - `0004_partner_inquiries.sql` — `public.partner_inquiries`, for applications submitted via `/partners`.
   - `0005_processed_webhook_events.sql` — `public.processed_webhook_events`, used to make the Stripe webhook idempotent against redelivery.
3. In **Authentication > Providers**, email/password is enabled by default — that's all this app uses. If you want confirmation emails to go out from your own domain rather than Supabase's shared sender, configure SMTP under **Authentication > Email Templates**.
4. In **Authentication > URL Configuration**, add your deployed site URL and `http://localhost:3000` to the allowed redirect URLs (needed for `/auth/callback`).
5. Copy the values from **Project Settings > API** into your environment:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Project Settings > API > service_role — keep this secret, server-only)

## 2. Resend (email)

1. Create an account at [resend.com](https://resend.com) and verify a sending domain (or use their shared test domain during development).
2. Create an API key and set `RESEND_API_KEY`.
3. Set `EMAIL_FROM` to a verified address, e.g. `Darix AI <hello@darix.ai>`.
4. Optionally set `TEAM_ALERT_EMAIL` to the inbox that should receive a copy of every contact-form lead.

Until these are set, the app still works — the contact form and assessment flow save to the database regardless, and email sending is skipped gracefully (see `isEmailConfigured()` in `src/lib/email/resend.ts`).

## 3. Stripe (payments)

No live UAE merchant account has been set up yet, so this runs in **test mode**:

1. Create a [Stripe account](https://dashboard.stripe.com/register) (test mode works with no business verification).
2. Copy the test secret key (**Developers > API keys**, `sk_test_...`) into `STRIPE_SECRET_KEY`.
3. Add a webhook endpoint at **Developers > Webhooks** pointing to `https://<your-domain>/api/webhooks/stripe`, subscribed to the `checkout.session.completed` event. Copy its signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`.
   - For local development, use the [Stripe CLI](https://stripe.com/docs/stripe-cli) instead: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` prints a local webhook secret to use.
4. Test a purchase with Stripe's [test card numbers](https://stripe.com/docs/testing) (e.g. `4242 4242 4242 4242`, any future expiry, any CVC).
5. **Going live**: once you have a real UAE merchant account, swap `STRIPE_SECRET_KEY` for the `sk_live_...` key and re-create the webhook endpoint (and its secret) in live mode. No code changes are needed — the "Professional Report" / "Business Consultation" checkout flow, tier unlock, and receipt email all work identically in live mode.

Until `STRIPE_SECRET_KEY` is set, checkout returns a 503 and the pricing tier buttons fall back to routing through the contact form.

### 3b. Telr (UAE-local payment gateway alternative)

Stripe works in the UAE but has weaker local card/wallet coverage than UAE-native gateways. `/api/checkout` can route through [Telr](https://telr.com) instead, with no client-side changes:

1. Get `store_id` and `auth_key` from your Telr merchant portal.
2. Set `TELR_STORE_ID`, `TELR_AUTH_KEY`, and `PAYMENT_PROVIDER=telr`.
3. Leave `TELR_TEST_MODE=1` until you're ready to take real payments.
4. **Verify against a live Telr sandbox before going to production** — the integration in `src/lib/telr/client.ts` follows Telr's published order.json guide, but field names should be confirmed against your own sandbox account the same way Stripe was verified in test mode.

Only one provider is active at a time, controlled by `PAYMENT_PROVIDER` (defaults to `stripe`).

## 4. PostHog (analytics)

1. Create a project at [posthog.com](https://posthog.com) (or self-host).
2. Copy the Project API Key into `NEXT_PUBLIC_POSTHOG_KEY`.
3. Set `NEXT_PUBLIC_POSTHOG_HOST` if your project isn't on the default US Cloud region.
4. Funnel events already instrumented: `assessment_started`, `assessment_completed`, `report_pdf_downloaded`, `contact_submitted`, `checkout_started`, `payment_completed` (the last one fires server-side from the Stripe webhook, so it's captured even if the user closes the tab after paying). Build the funnel in PostHog's Insights using these event names in order.

## 5. Cloudflare Turnstile (bot protection)

1. In the [Cloudflare dashboard](https://dash.cloudflare.com), go to **Turnstile** and add a site for your domain (widget mode: Managed).
2. Copy the site key into `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and the secret key into `TURNSTILE_SECRET_KEY`.
3. Protects the assessment submission and contact form. Until these are set, both forms work unprotected (bot protection is additive on top of the existing per-IP rate limiting, not a hard dependency).

## 6. Admin access

Set `ADMIN_EMAILS` to a comma-separated list of email addresses (must be accounts that can sign up/sign in via the app's own `/login`) that should be able to view `/admin` — leads (with an editable CRM-lite status/notes pipeline), assessments, PDPL data requests, and partner inquiries, all for follow-up.

## 6b. WhatsApp Business (click-to-chat)

Set `NEXT_PUBLIC_WHATSAPP_NUMBER` to your business number in international format with no `+` or spaces (e.g. `971501234567`) to show a floating WhatsApp chat button site-wide. No API integration or approval needed — it's a `wa.me` deep link. Leave unset to hide the button entirely.

## 6c. Upstash Redis (distributed rate limiting)

The per-IP rate limiting on public API routes (assessments, contact, checkout, PDPL/partner forms) runs in-memory by default, which only protects a single warm serverless instance. For a real shared limit across every instance/region:

1. Create a free Redis database at [console.upstash.com](https://console.upstash.com).
2. Copy the REST URL and token into `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

No code changes needed — `src/lib/rate-limit/index.ts` detects these automatically and falls back to in-memory limiting if a Redis call ever fails.

## 6d. Sentry (error monitoring)

1. Create a Next.js project at [sentry.io](https://sentry.io) and copy its DSN into `NEXT_PUBLIC_SENTRY_DSN`.
2. Optionally set `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` (Settings > Auth Tokens) to enable source-map upload for readable stack traces in production.
3. Captures: root layout errors (`global-error.tsx`), per-route errors (`error.tsx` in dashboard/admin/report), React error boundaries (`ErrorBoundary.tsx`), and server/edge request errors via `src/instrumentation.ts`.

Leave `NEXT_PUBLIC_SENTRY_DSN` unset to fully disable Sentry — `next.config.ts` skips the Sentry build wrapper entirely in that case.

## 7. Environment variables

Copy `.env.example` to `.env.local` and fill in every value described there. `NEXT_PUBLIC_SITE_URL` should be your production URL once deployed (used to build links inside emails and Stripe/Telr checkout redirects).

## 8. Local development

```bash
npm install
npm run dev
```

Run the full check suite before pushing:

```bash
npm run lint
npx tsc --noEmit
npm test              # unit + integration tests (vitest)
npm run build
npm run test:e2e       # Playwright — installs its own browser if needed: npx playwright install --with-deps chromium
```

`npm run test:e2e` builds and starts a production server on `localhost:3000` and runs against it (see `playwright.config.ts`); it intercepts all `/api/*` calls with canned responses, so it doesn't need real Supabase/Stripe/Resend credentials.

## 9. Deploying to Vercel

1. Import the GitHub repository into Vercel.
2. Framework preset: Next.js (auto-detected).
3. Add every variable from `.env.example` under **Project Settings > Environment Variables** (for Production, Preview, and Development as appropriate).
4. Deploy. The PDF report route (`/api/assessments/[id]/pdf`) uses `@react-pdf/renderer`, which needs the Node.js runtime — this is already set via `export const runtime = 'nodejs'` in that route, so no extra Vercel configuration is required.
5. After the first deploy, update `NEXT_PUBLIC_SITE_URL` to the real domain and redeploy so email links and Stripe checkout redirects point to the right place.
6. Re-create the Stripe webhook endpoint (step 3 above) pointing at the real deployed URL — the one used during local testing won't fire in production.

## 10. CI

`.github/workflows/ci.yml` runs on every pull request: lint, typecheck, unit/integration tests, a production build, and the Playwright E2E suite (in its own job, installing Chromium fresh via `playwright install --with-deps`). All must pass before merging.

## What's intentionally not wired up yet

- **Live payments**: Stripe and Telr are both fully wired end-to-end but default to test/sandbox mode — see sections 3 and 3b above for going live.
- **Arabic/RTL coverage**: the core conversion path (nav, hero, assessment, results, contact, footer) is fully translated; the remaining marketing sections (Problem/Solution/Framework/Industries/Pricing/CaseStudies/Research/Founder/FAQ) and score-generated report content (level/description/strengths/gaps/roadmap, which is stored in English at save time) are English-only for now.
- **SEO extras beyond the basics**: sitemap.xml, robots.txt, a generated OG image, and Organization/WebApplication JSON-LD are in place; per-page Open Graph images for individual routes (beyond the site-wide default) are not.
- Anything not listed above that's mentioned in the original master build-out prompt as a later phase.
