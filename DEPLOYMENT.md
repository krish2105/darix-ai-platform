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

### 3c. Tabby (buy-now-pay-later, Business Consultation tier only)

Unlike Stripe/Telr, [Tabby](https://tabby.ai) is additive rather than a `PAYMENT_PROVIDER` option — a "Pay in 4 with Tabby" button appears next to the regular checkout button, offered only for the AED 1,999 Business Consultation tier (the only tier priced high enough for installments to be a meaningful purchase decision):

1. Register as a merchant at [partners.tabby.ai](https://partners.tabby.ai) and get your test secret key and merchant code.
2. Set `TABBY_SECRET_KEY` and `TABBY_MERCHANT_CODE`.
3. **Verify against Tabby's test environment before going live** — same caveat as Telr (section 3b): the integration in `src/lib/tabby/client.ts` follows Tabby's published Checkout API guide, but field names, the exact redirect query-param name Tabby appends (`payment_id`), and the authorize→capture flow should be confirmed against your own test merchant account.
4. Going live: swap in your live secret key/merchant code — no code changes needed.

Until `TABBY_SECRET_KEY`/`TABBY_MERCHANT_CODE` are set, the "Pay in 4 with Tabby" button returns a 503 and the regular Stripe/Telr checkout button keeps working regardless (see `isTabbyConfigured()`).

Note: not every buyer is approved for BNPL — Tabby runs its own eligibility check per checkout session. A decline (`TabbyNotEligibleError`) surfaces as "Pay-in-installments is not available for this purchase. Try another payment method." rather than a generic error, since it's an expected outcome, not a failure.

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

## 6b. WhatsApp Business (click-to-chat + Cloud API)

Set `NEXT_PUBLIC_WHATSAPP_NUMBER` to your business number in international format with no `+` or spaces (e.g. `971501234567`) to show a floating WhatsApp chat button site-wide. No API integration or approval needed — it's a `wa.me` deep link. Leave unset to hide the button entirely.

For programmatic sending (report delivery on request, internal lead/purchase alerts), set up the Meta WhatsApp Cloud API separately:

1. Create a [Meta developer app](https://developers.facebook.com/apps), add the WhatsApp product, and complete business verification.
2. Generate a permanent access token (a System User token under **Business Settings**, not the 24-hour temporary token shown by default) and set `WHATSAPP_ACCESS_TOKEN`.
3. Copy the **Phone number ID** (not the phone number) from **WhatsApp > API Setup** into `WHATSAPP_PHONE_NUMBER_ID`.
4. Optionally set `TEAM_WHATSAPP_NUMBER` (international format, no `+`) to receive best-effort internal alerts for new leads and Business Consultation purchases.

Until `WHATSAPP_ACCESS_TOKEN`/`WHATSAPP_PHONE_NUMBER_ID` are set, the "Send to WhatsApp" button on the results screen returns a 503 (see `isWhatsAppConfigured()` in `src/lib/whatsapp/client.ts`) and team alerts are silently skipped — the click-to-chat button above keeps working regardless, since it needs no API access at all.

Note: Meta requires recipients to have messaged your business number within the last 24 hours (or the message to use a pre-approved template) for a session message to deliver outside that window. The "Send to WhatsApp" report flow only works for numbers with an open session; a multi-day automated nurture sequence would need approved message templates and a scheduler, and isn't built here — see "What's intentionally not wired up yet" below.

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

## 6e. Compliance documentation (PDPL — read before launch)

UAE PDPL moved to full enforcement in 2026 (Executive Regulations issued,
real fines up to AED 5 million). Before relying on Darix in production:

1. Have a UAE-qualified lawyer review the Privacy Policy and Terms — both
   pages carry an explicit "draft" notice until that happens.
2. Review `docs/ROPA.md` (Records of Processing Activities) — an internal,
   non-public document listing every processing activity, its legal basis,
   and open items for counsel.
3. The public `/sub-processors` page lists every third-party service that
   touches personal data and where it's hosted; request each provider's
   Data Processing Addendum (Stripe, Resend, Supabase, Sentry, and PostHog
   all offer one) and keep signed copies on file.
4. Confirm with counsel that Darix's sector (not financial services,
   healthcare, telecoms, or government) means no data-localization
   requirement applies — `docs/ROPA.md` documents this as a working
   assumption, not a legal conclusion.
5. See `docs/GO_LIVE_CHECKLIST.md` for the full list of non-code business
   readiness items — trade license, live merchant accounts, DPAs with
   every sub-processor, and more — none of which this repo can complete
   on its own.

## 6f. Arabic reports (PDF + report content)

Score-generated report content (level, description, strengths, gaps,
roadmap, recommended pilots) and the downloadable PDF both render in Arabic
when the site's language toggle is set to Arabic — no configuration
needed. The PDF uses the Tajawal font (bundled via `@fontsource/tajawal`)
rather than Noto Sans Arabic, which crashes react-pdf's bidi text reorderer
on certain letter combinations (see the comment in `src/lib/pdf/fonts.ts`
for the specific repro). After your first deploy, download an Arabic PDF
report and confirm it shows real Arabic glyphs rather than empty boxes —
the font is loaded from `node_modules` at runtime via a path that Next's
build-time file tracer needs an explicit `outputFileTracingIncludes` hint
to find (already configured in `next.config.ts`), so this is worth
verifying once against your actual Vercel deployment rather than assuming
local dev behavior carries over.

## 6g. Re-assessment reminder (Vercel Cron)

`vercel.json` schedules a daily call to `/api/cron/reassessment-reminder`
(06:00 UTC), which emails signed-in users whose latest assessment is 90+
days old, at most once every 80 days, prompting them to retake it. Set
`CRON_SECRET` to any random string (`openssl rand -hex 32`) — Vercel sends
it automatically as a Bearer token when it triggers a scheduled route, and
the route rejects any request without a matching one. This runs on
Vercel's free Hobby plan (crons are capped at once/day on Hobby, which
this schedule already fits) — no Pro plan needed. Requires
`RESEND_API_KEY`/`EMAIL_FROM` to be configured (section 2); returns 503
otherwise, same graceful-degradation pattern as everything else. Note:
this covers the email channel only — a WhatsApp equivalent would need
Meta-approved message templates first (see section 6b).

## 6h. RAG chatbot (Google Gemini)

Two chat surfaces, both backed by Google Gemini's free tier: a public
FAQ widget (site-wide, grounded in Darix AI's own content via a vector
search) and a personalized advisor panel (signed-in users only, on their
own report page, reasoning over that assessment's actual score/gaps).

1. Get a free API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Set `GEMINI_API_KEY` and `NEXT_PUBLIC_CHATBOT_ENABLED=true`.
3. Enable the `vector` extension migration (`supabase/migrations/0008_chatbot.sql`)
   the same way as any other migration (`supabase db push` or the SQL editor).
4. Populate the knowledge base: `npm run ingest:kb`. This is a **manual
   step**, not run automatically on deploy or in CI — it calls the Gemini
   embeddings API once per content chunk, which costs free-tier quota, so
   it should only be re-run when `src/data/resources.ts`, the FAQ/industry
   translation keys, or `src/utils/scoring.ts`'s level descriptions
   actually change. It's idempotent (safe to re-run; unchanged chunks are
   skipped, changed ones are updated in place).
5. The free tier has daily/per-minute quota limits — both chat routes
   degrade to a "temporarily unavailable" message (never a 500/crash)
   when the key is unset or the quota is exhausted, same pattern as every
   other optional integration in this project.

## 6i. Report sharing & lightweight team accounts

Run `supabase/migrations/0009_sharing_and_teams.sql` the same way as any
other migration. No new environment variables — this adds:

- `share_enabled`/`share_expires_at` columns on `assessments`, letting a
  report's owner revoke or time-limit the previously-permanent
  "anyone with the link" access from the Sharing panel on `/report/[id]`.
- `organizations`/`organization_members`/`organization_invites` tables for
  lightweight teams. A team is created lazily — there's no signup step —
  the first time a user toggles "Share with my team" on a report or
  invites a teammate from `/dashboard`. Inviting an email with no existing
  Darix account sends Supabase's own invite email and auto-joins them on
  signup (`src/app/auth/callback/route.ts`).

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

## 10. CI / CD

`.github/workflows/ci.yml` runs on every pull request: lint, typecheck, unit/integration tests, a production build, and the Playwright E2E suite (in its own job, installing Chromium fresh via `playwright install --with-deps`). All must pass before merging.

`.github/dependabot.yml` opens weekly PRs for outdated npm and GitHub Actions dependencies — worth watching closely given this is a Next.js 16.2.10 fork with documented breaking-change behavior (see `AGENTS.md`), so a routine-looking dependency bump can carry real behavior changes.

There is intentionally no custom deploy/CD workflow in `.github/workflows/`. The deploy path is Vercel's own git integration (section 9 above): pushing to `main` triggers a Vercel deploy automatically once the GitHub repo is imported into a Vercel project, with no GitHub Actions secrets or custom workflow needed. If you outgrow that (e.g. you want deploy gated on a manual approval step, or a non-Vercel target), add a dedicated `cd.yml` at that point rather than building one speculatively now.

E2E coverage note: `e2e/checkout-and-forms.spec.ts` covers the checkout flow for all three payment methods (Stripe, Telr, Tabby) and the anonymous forms (WhatsApp report delivery, Privacy Center PDPL request, partner application) by intercepting `/api/*` client-side, the same technique `e2e/assessment-flow.spec.ts` uses. What isn't covered: the `/dashboard` self-service PDPL export/delete and the `/admin` CRM lead editor, because both sit behind real Supabase Auth — sign-in happens client-side (interceptable) but `proxy.ts` validates the session server-side against the real `NEXT_PUBLIC_SUPABASE_URL` on every request, which Playwright's browser-side route interception can't reach. Exercising those two flows end-to-end needs a real (or locally-run) Supabase project wired into the E2E environment; both are covered at the unit/integration level instead (`src/app/api/account/export/route.test.ts`, `src/app/api/account/delete/route.test.ts`, `src/app/api/admin/leads/[id]/route.test.ts`).

## What's intentionally not wired up yet

- **Live payments**: Stripe, Telr, and Tabby are all fully wired end-to-end but default to test/sandbox mode — see sections 3, 3b, and 3c above for going live.
- **WhatsApp nurture sequences**: only a single on-request "send my report" message and one-off team alerts are wired up (section 6b). A multi-day automated follow-up sequence would need Meta-approved message templates (session messages can't be sent outside a 24h customer-initiated window) and a scheduler (e.g. Vercel Cron) — a separate, larger piece of infrastructure not built here.
- **Arabic/RTL coverage**: the full site — nav, hero, all marketing sections, assessment, score-generated report content (level/description/strengths/gaps/roadmap), the PDF export, contact, and footer — is translated (section 6f). Long-form resource article body text (`src/data/resources.ts`) is English-only by scope decision.
- **SEO extras beyond the basics**: sitemap.xml, robots.txt, a generated OG image, and Organization/WebApplication JSON-LD are in place; per-page Open Graph images for individual routes (beyond the site-wide default) are not.
- Anything not listed above that's mentioned in the original master build-out prompt as a later phase.
