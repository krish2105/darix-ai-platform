# Changelog

All notable changes to this project are documented here, grouped by the
internal phase numbering used throughout `docs/` and commit history. Format
loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased] — Phase 15+

Master roadmap for what's next: see `docs/PHASE_15_MASTER_PLAN.md`.

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
