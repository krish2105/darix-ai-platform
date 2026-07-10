# Changelog

All notable changes to this project are documented here, grouped by the
internal phase numbering used throughout `docs/` and commit history. Format
loosely follows [Keep a Changelog](https://keepachangelog.com/).

## Phase 15 — 2026-07-10

Full plan: `docs/PHASE_15_MASTER_PLAN.md`. All code-feasible items shipped;
business/legal items (trade licence, live merchant activation, lawyer
sign-off, grants, partner outreach) remain in `docs/GO_LIVE_CHECKLIST.md`.

### Added
- Reasoned dimension weighting in the scoring model (Strategy/Data/
  Governance weighted higher), replacing the previous equal-1/8th default.
- Industry- and PDPL-governance-aware report content: personalized
  recommended pilots, description context, and strength/gap copy — both
  English and Arabic.
- Optional industry + company-size fields on the assessment intake.
- Anonymized industry benchmarking (`/api/benchmarks`) and a dashboard
  score-over-time trend chart.
- PostHog feature flags, with a first real experiment on pricing CTA copy.
- A daily Vercel Cron re-assessment reminder email (90-day interval, Resend).
- A business-registration-jurisdiction question on the contact form,
  surfaced in the internal lead-alert email (DIFC/ADGM vs. mainland PDPL).
- Arabic translation of the two UAE-specific resource articles.
- Component tests for 9 previously-untested interactive components; API
  route tests for the 3 previously-untested assessment routes.
- WCAG 2.1 AA-scoped accessibility test target.

### Fixed
- `ContactSection`'s optional business-jurisdiction `<select>` blocked
  form submission when left at its placeholder value (native `""` isn't
  the same as `undefined` for an optional Zod enum) — caught by a new
  component test, fixed with the same `.optional().or(z.literal(''))`
  pattern already used elsewhere in the schema.
- RTL's default 1000ms `waitFor` timeout was too tight once the component
  test suite grew large enough to run into real parallel-CPU contention —
  raised suite-wide in `src/test/setup.ts`.

## Phase 9–14 — 2026-07-10

### Added
- Compliance: `/sub-processors` page, `docs/ROPA.md`, Privacy Policy updates.
- Full Arabic (RTL) translation of all marketing sections, score-generated
  report content, and the downloadable PDF report (Tajawal font).
- WhatsApp Business Cloud API: on-request report delivery, team alerts for
  new leads and Business-tier purchases.
- Tabby buy-now-pay-later checkout for the Business Consultation tier,
  alongside Stripe and Telr.
- `docs/GO_LIVE_CHECKLIST.md` — non-code business/legal readiness checklist.
- React Testing Library component tests, expanded Playwright e2e coverage
  (checkout across all three providers, WhatsApp/Privacy Center/Partners
  forms).

### Fixed
- E2E PDF-download route interception missed the `?locale=` query param
  added when Arabic report content was localized.

## Phase 5–8 — earlier

### Added
- Arabic/RTL localization infrastructure and core-journey translation.
- UAE PDPL data-rights self-service (export/delete) and Privacy Center.
- Telr payment provider as a Stripe alternative.
- WhatsApp click-to-chat, CRM-lite admin, case studies, resources hub,
  partners programme, Redis-backed rate limiting, Stripe webhook
  idempotency, Sentry error monitoring.

## Phase 1–4 — initial build-out

### Added
- Core product: 8-dimension AI readiness assessment, scoring engine, PDF
  report generation, Supabase-backed persistence and auth.
- Stripe checkout, PostHog analytics, Cloudflare Turnstile bot protection,
  SEO groundwork, admin view, CI pipeline (lint/typecheck/tests/build/e2e).
