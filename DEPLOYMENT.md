# Deployment Guide

## 1. Supabase (database + auth)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run `supabase/migrations/0001_init.sql`. This creates:
   - `public.assessments` — every completed quiz (answers, computed result, tier, optional company/contact info, optional `user_id`).
   - `public.leads` — contact-form submissions.
   - Row Level Security policies (see comments in the migration file for the trust model behind each one).
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

Set `ADMIN_EMAILS` to a comma-separated list of email addresses (must be accounts that can sign up/sign in via the app's own `/login`) that should be able to view `/admin` — a read-only list of recent leads and assessments for follow-up.

## 7. Environment variables

Copy `.env.example` to `.env.local` and fill in every value described there. `NEXT_PUBLIC_SITE_URL` should be your production URL once deployed (used to build links inside emails and Stripe checkout redirects).

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

- **Live payments**: Stripe is fully wired end-to-end but running in test mode — see section 3 above for going live.
- **SEO extras beyond the basics**: sitemap.xml, robots.txt, a generated OG image, and Organization/WebApplication JSON-LD are in place; per-page Open Graph images for individual routes (beyond the site-wide default) are not.
- Anything not listed above that's mentioned in the original master build-out prompt as a later phase.
