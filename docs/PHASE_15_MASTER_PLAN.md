# Phase 15+ — Master Further-Implementation Plan

_Last updated: 10 July 2026._

## Status

Every code-feasible item in this plan has been implemented and verified
(lint/typecheck/unit-integration tests/build/e2e all green):

- **Workstream 1 (Model & Content Integrity)**: dimension weighting,
  industry-aware output, PDPL-specific governance copy, Arabic translation
  of the two UAE-specific resource articles, and the case-study
  disclaimer are all shipped — see `src/utils/scoring.ts` and the
  in-code rationale comments for exactly what changed and what's still
  deliberately deferred (question-level weighting, level-threshold
  recalibration against real usage data).
- **Workstream 2 (Test Coverage)**: the three previously-untested API
  routes and nine priority components now have tests; the accessibility
  suite targets an explicit WCAG 2.1 AA tag set.
- **Workstream 3 (Compliance Precision)**: documentation-only updates to
  `docs/ROPA.md` and `docs/GO_LIVE_CHECKLIST.md` (DIFC/ADGM scoping, DPO
  item, ISO 27001 path) plus a jurisdiction question added to the contact
  intake flow.
- **Workstream 4 (Differentiation)**: dashboard score-trend chart and
  anonymized industry benchmarking are both live (the benchmark honestly
  reports "not enough data yet" until real usage accumulates — it never
  fabricates a number).
- **Workstream 5 (Growth Engine)**: PostHog feature flags are wired with
  a first real experiment (pricing CTA copy); a re-assessment reminder
  cron (Resend email, Vercel Cron, Hobby-plan-compatible) is built. The
  WhatsApp nurture-sequence *content* remains explicitly not built —
  that needs Meta template approval, an external business step no code
  change can complete.
- **Workstream 6 (Ops)**: Dependabot, CHANGELOG, CD-path documentation —
  done in the prior pass.
- **Workstreams 7-8 (Business Formation, Go-To-Market)**: unchanged —
  these are real-world legal/business actions (trade licence, live
  merchant activation, lawyer sign-off, grant applications, partner
  outreach) that remain correctly scoped in `docs/GO_LIVE_CHECKLIST.md`,
  not something a coding pass can complete.

## Context

Darix AI (the Dubai AI Readiness Index) is functionally complete through
14 build phases: a bilingual (EN/AR) 8-dimension AI readiness assessment,
a working monetization funnel (Free → AED 499 Professional Report → AED
1,999 Business Consultation), three payment rails (Stripe/Telr/Tabby),
WhatsApp Business API integration, UAE PDPL compliance tooling, an admin
CRM, and a clean CI pipeline (lint/typecheck/106 unit-integration
tests/13 e2e tests/build all green). Everything that was scoped is built
and verified.

This plan answers "what's genuinely left" from two inputs that didn't
exist when the last roadmap was written: **(1) a fresh, evidence-based
audit of the actual codebase** for disclosed gaps, untested surfaces, and
flagged placeholders, and **(2) current (July 2026) web research** on the
UAE AI market, the structure of UAE data-protection law, the competitive
landscape, and the real operating economics of the third-party services
already wired in. Three research findings materially change what "done"
means here and are treated as first-class plan items, not footnotes:

1. **UAE data protection is not one law.** Federal PDPL (mainland), the
   DIFC Data Protection Law (GDPR/UK-aligned, amended July 2025, adds a
   private right of action letting individuals sue in DIFC Courts), and
   the ADGM Data Protection Regulations (GDPR-aligned, updated September
   2025) are three separate, non-overlapping regimes. `docs/ROPA.md` and
   the Privacy Policy/Terms currently assume PDPL applies universally —
   that's wrong the moment a DIFC- or ADGM-registered customer signs up,
   both very plausible given those are major UAE business/financial free
   zones. (Already actioned: `docs/ROPA.md` §0 now documents this.)
2. **The competitive field has closed in.** HEMOdata runs a 50-question,
   10-dimension diagnostic explicitly "calibrated to GCC regulatory
   reality." The Orange Club offers a free 15-minute, 35-question UAE
   self-assessment. Salesforce and Avanade both have adjacent enterprise
   readiness tools. Bain & Company + the World Governments Summit launched
   a national AI Readiness Tool for UAE government entities in February
   2026 (government-only, but it validates the category). Darix's "free
   8-dimension assessment" is no longer a novel claim on its own —
   differentiation now has to come from depth, UAE-specificity, and the
   integrated paid-and-delivered funnel around it, not the free quiz
   itself.
3. **WhatsApp Business Platform pricing changed.** Per-template-message
   billing replaced conversation-based (24-hour window) billing, effective
   July 2025 and fully in effect in 2026. UAE marketing-template messages
   run ≈$0.05 each; utility/authentication templates are 80-90% cheaper;
   replies inside a user-initiated 24-hour service window remain free. Any
   future nurture-sequence build has a materially different cost model and
   template-category design constraint than "add a scheduler" implied.

The intended outcome is a single, sequenced roadmap covering model/content
integrity, test coverage, compliance precision, competitive
differentiation, growth infrastructure, release engineering, and the
already-known business-formation items — organized by actual dependency,
not by an arbitrary "code vs. not-code" split.

---

## If only one thing gets done next

**Resolve the scoring model's disclosed gaps in `src/utils/scoring.ts`**
(Workstream 1) — starting with dimension weighting and making the
strengths/gaps/roadmap text industry- and size-aware instead of generic.

This is the one item that is (a) already self-flagged by the codebase's
own `BUSINESS-LOGIC REVIEW FLAG` comment as not production-grade, (b) sits
at the center of the entire product — every paid tier, every PDF export,
every WhatsApp-delivered report, every piece of go-to-market messaging
depends on the assessment output being credible, and (c) is the item the
new competitive research most directly threatens: HEMOdata can credibly
claim its scoring is "calibrated to GCC regulatory reality" while Darix's
own code currently documents that its equivalent claim is not yet true.
It's also the one workstream with no external dependency (unlike a trade
license or a lawyer's calendar) and no new infrastructure requirement
(unlike the growth-engine items) — it's actionable today with a
domain-expert review pass plus an engineering pass to wire the result into
`scoring.ts` and the already-existing (but currently unused by the scoring
layer) `src/data/industries.ts`.

A close second, and arguably a prerequisite in spirit: the **trade
license + one live payment gateway**, since it's the only item that turns
the already-built, already-tested checkout flow into real revenue. Both
can and should start in the same week — one is a legal/business calendar
item, the other is pure engineering/consulting, and neither blocks the
other.

---

## Workstream 1 — Model & Content Integrity

The `BUSINESS-LOGIC REVIEW FLAG` in `src/utils/scoring.ts` (lines 26–51)
states outright that dimension weighting, the linear 0–5 answer scale,
the level thresholds, and the strengths/gaps/roadmap template text are
unvalidated placeholders. This is now a competitive liability, not just an
internal caveat.

- **Dimension weighting.** All 8 dimensions in `src/data/questions.ts`
  (`strategy`, `data`, `tech`, `process`, `people`, `governance`,
  `usecases`, `roi`) currently contribute an equal 1/8 of the score via
  linear summation in `calculateReadiness()`. Commission a domain-expert
  review: should `governance` weigh more heavily given PDPL fine exposure?
  Should question-level weighting exist within a dimension? Decide and
  document the rationale even if the answer is "equal weighting, and
  here's why" — an explicit, reasoned choice beats a silent default.
- **Level thresholds.** The 25/50/75/90 breakpoints are round numbers, not
  derived from benchmark data. Replace with literature-derived breakpoints
  now, and plan to recalibrate against real assessment-outcome data once
  enough volume exists (this creates a soft dependency on Workstream 4's
  benchmarking work — see Sequencing).
- **Industry- and size-aware output.** `src/data/industries.ts` and the
  `companySizeOptions` captured at intake (`src/lib/validation/schemas.ts`)
  already exist but `calculateReadiness()` doesn't use them — strengths/
  gaps/roadmap text is currently a generic template keyed off the top/
  bottom 3 dimension IDs regardless of industry or company size. Wiring
  these in is the single highest-leverage differentiator versus HEMOdata
  and The Orange Club, both of which appear to run generic templated
  output too, and it's the concrete engineering task behind the "if only
  one thing" recommendation above.
- **Localization plumbing must be preserved.** `levelId`,
  `strengthDimensionIds`, and `gapDimensionIds` on `ReadinessResult` exist
  specifically so Arabic rendering (`src/lib/i18n/localizeResult.ts`,
  `ScoreDashboard.tsx`, the PDF exporter in `src/lib/pdf/`) can look up
  translated templates instead of re-deriving English strings. Any model
  rework must keep emitting these IDs, not just richer English text, or it
  silently breaks Arabic parity that took real effort to build.
- **Question depth — a deliberate choice, not a default to "add more."**
  Darix runs 24 questions across 8 dimensions; HEMOdata runs 50 across 10.
  More questions read as more rigorous but raise free-tier abandonment
  risk. Recommendation: keep the free tier at 24 questions (speed is a
  real UX advantage worth protecting), and instead make the *paid* AED 499
  report visibly out-depth HEMOdata's free tier — deepen the per-dimension
  PDF analysis, or add an optional "deep-dive" question set gated behind
  the Professional/Business tiers, which also creates a clean upsell
  reason beyond "more pages of PDF."
- **Localize remaining English-only long-form content.**
  `src/data/resources.ts` article bodies are English-only "by scope
  decision" (confirmed in `DEPLOYMENT.md`). Translate at least the two
  UAE-specific articles (PDPL, AI ROI) to Arabic — revisit this scope
  decision specifically in light of the competitive research: if GCC
  competitors are producing bilingual thought-leadership content,
  English-only resources become a content-marketing gap, not just a UI
  gap.
- **Real case studies.** `src/data/caseStudies.ts` entries are illustrative
  composites (already flagged in `docs/GO_LIVE_CHECKLIST.md` §5). Either
  add a persistent "illustrative example" disclaimer to
  `CaseStudiesPageContent.tsx`/`CaseStudies.tsx` now, or replace with real
  pilot-customer results (with written permission to publish) once
  Workstream 7/8 produces paying customers.
- **Remove the legal "draft" banner once sign-off exists.**
  `src/components/LegalPageLayout.tsx` (lines 21–24) renders the shared
  draft notice used by `/privacy`, `/terms`, and `/sub-processors`. Once
  Workstream 3's legal engagement completes, remove the banner logic and
  update `docs/GO_LIVE_CHECKLIST.md` §2.

## Workstream 2 — Test Coverage Completion

The prior phase added `ScoreDashboard.test.tsx` and e2e coverage for
checkout/forms; a fresh audit found real gaps still open.

- **Untested API routes** — write `route.test.ts` for
  `src/app/api/assessments/[id]/route.ts`,
  `src/app/api/assessments/[id]/email/route.ts`, and
  `src/app/api/assessments/[id]/pdf/route.tsx`. The PDF route is the
  highest priority of the three — it's revenue-critical and touches the
  Arabic-font/locale logic that already caused one real regression this
  project. Mirror the existing pattern in
  `src/app/api/assessments/[id]/whatsapp/route.test.ts`.
- **Component test coverage** — of ~40 components in `src/components/`,
  only `ScoreDashboard.test.tsx` has a test. Prioritize by blast radius,
  not alphabetically:
  1. Conversion-path: `ReadinessAssessment.tsx`, `PricingSection.tsx`,
     `ContactSection.tsx`, `WhatsAppButton.tsx`, `Turnstile.tsx` (a silent
     regression in bot protection directly enables abuse).
  2. Trust/compliance: `PrivacyActions.tsx`, `PrivacyRequestForm.tsx`,
     `PartnerInquiryForm.tsx`, `LeadStatusEditor.tsx` (admin CRM —
     data-integrity risk if broken).
  3. Small, currently-zero-coverage integration points: `ThemeToggle.tsx`.
  4. Lower priority: purely presentational marketing sections
     (Problem/Solution/Framework/Industries/FAQ/etc.) — already covered
     indirectly by the homepage e2e test's rendering assertions.
- **Verify `supabase/migrations/` against a live schema**, not just file
  presence. The audit only confirmed the 5 migration files exist and are
  named consistently with what the code expects — nobody has run them
  against a fresh Supabase project end-to-end since
  `0005_processed_webhook_events.sql` was added. Do this once as part of
  standing up the real production Supabase project in Workstream 7.
- **Close the `/dashboard` and `/admin` e2e gap deliberately.** Both sit
  behind real Supabase Auth — sign-in itself happens client-side
  (interceptable by Playwright), but `proxy.ts` validates the session
  server-side against the real `NEXT_PUBLIC_SUPABASE_URL` on every
  request, which Playwright's browser-side route interception can't
  reach. Both flows are covered at the unit/integration level today
  (`account/export`, `account/delete`, `admin/leads/[id]` route tests).
  Two real options if e2e coverage is wanted: (a) run an ephemeral local
  Supabase instance in CI via the Supabase CLI (`supabase start`), or (b) a
  test-only auth bypass gated by an environment variable that's never set
  outside CI. Pick one deliberately — this is worth a short internal
  decision note before building, not a default choice.
- **Upgrade the accessibility bar from "no critical/serious violations" to
  an explicit WCAG 2.1 AA conformance target.** The UAE's TDRA National
  Digital Accessibility Policy sets WCAG 2.1 AA as the bar for federal
  government sites (with some newer platforms already moving to WCAG 2.2
  AA under the UAE Design System 2.0). Darix's `e2e/accessibility.spec.ts`
  currently only asserts a severity-filtered violation count. Naming WCAG
  2.1 AA explicitly as the target — even before Darix pursues any
  public-sector angle — is cheap now and expensive to retrofit later.

## Workstream 3 — Compliance Precision

Positioned ahead of the growth-engine workstream deliberately: the
DIFC/ADGM gap and PDPL enforcement specifics are live legal-exposure items
the moment Darix signs a real customer in a UAE free zone — not something
to defer until after a growth push.

- **DIFC / ADGM legal scoping — done at the documentation level, needs
  counsel to close it out.** `docs/ROPA.md` §0 (added as part of this
  plan) now documents that Federal PDPL, DIFC Data Protection Law, and
  ADGM Data Protection Regulations are three separate regimes and treats
  DIFC/ADGM customers as out of scope until counsel confirms coverage.
  Remaining actions: get that confirmation in writing, and add a
  business-registration-jurisdiction question to the `/contact` intake
  flow so this is surfaced before a deal closes, not after.
- **PDPL enforcement specifics — reconfirm against the actual Executive
  Regulations text.** 2026 fines run AED 50,000–5,000,000 (up to AED
  20,000,000 cited for severe violations), with criminal exposure up to 1
  year imprisonment for unauthorized disclosure, binding SLA windows for
  data-subject-rights responses, and defined breach-notification windows
  to the UAE Data Office. `docs/ROPA.md` §4 currently states a 30-day
  response window as a general PDPL norm — confirm this is still accurate
  under the 2026 Executive Regulations specifically, don't treat it as
  settled.
- **Data-residency assumption sharpened.** `docs/ROPA.md` §3 (updated as
  part of this plan) now states the specific fact that Supabase has no
  native Middle East/UAE region — any "UAE-hosted Supabase" offering on
  the market is a third-party-managed reseller, a different vendor-risk
  profile than native regional infrastructure. Put this specific fact to
  counsel by name, especially before onboarding any customer in a
  regulated sector (finance/health/telecoms/government).
- **DPO appointment threshold.** 2026 PDPL Executive Regulations clarified
  DPO-appointment criteria for qualifying controllers. Get a legal
  determination on whether Darix's projected data volume/sensitivity
  crosses that threshold (`docs/ROPA.md` §5.7, `docs/GO_LIVE_CHECKLIST.md`
  §2 — both updated as part of this plan). An external/fractional DPO
  service is a reasonable starting option if so.
- **ISO 27001, not SOC 2, is the correct long-term certification target**
  for UAE/GCC enterprise and government-adjacent buyers — SOC 2 is a
  US-centric ask rarely requested regionally, and non-accredited ISO
  certificates are frequently rejected in procurement. Don't start the
  (expensive, multi-quarter) certification process pre-revenue, but the
  gap-assessment groundwork is worth doing now: most technical controls
  (access control, encryption, centralized logging via Sentry,
  least-privilege service roles) are already engineering defaults in this
  codebase — the real gap is formal ISMS policy documentation, not code.
  (`docs/GO_LIVE_CHECKLIST.md` §2b, added as part of this plan.)
- **Sub-processor DPAs** — no new finding, confirming this stays correctly
  scoped: signed DPAs from all 10 sub-processors (Supabase, Resend,
  Stripe, Telr, Tabby, PostHog, Sentry, Cloudflare, Upstash, Meta) are
  what actually discharges the PDPL sub-processor obligation, not just
  listing them publicly on `/sub-processors`.

## Workstream 4 — Competitive Differentiation & Product Depth

Direct responses to the competitive-landscape research finding.

- **Out-depth HEMOdata where it counts.** HEMOdata's "calibrated to GCC
  regulatory reality" positioning is best rebutted with substance, not a
  counter-claim: make the `governance` dimension's questions, gap text,
  and roadmap explicitly reference PDPL fine exposure and (once
  Workstream 3 lands) DIFC/ADGM applicability, rather than generic
  "governance policies are unclear" language. This is cheap to build
  (better copy in `src/lib/i18n/translations.ts`'s `dim.governance.*` and
  `result.gap.template` keys) and directly targets the one competitor with
  a similar pitch.
- **Make the already-built differentiators explicit in messaging.**
  Bilingual PDF export, three integrated UAE-relevant payment rails, and
  WhatsApp delivery in one funnel are genuine differentiators relative to
  the researched competitors (none of HEMOdata/Orange Club/Salesforce/
  Avanade appear to combine all three) — this should become explicit
  marketing copy (Workstream 8), not stay an internal fact.
- **Quarterly re-assessment tracking.** Let a paying customer retake the
  assessment and see a score-over-time trend — turns a one-off purchase
  into a reason to return, and nothing in the researched competitive set
  appears to offer this. Needs a lightweight schema addition (assessment
  history linked by `user_id`), a trend chart on `/dashboard`, and a
  scheduled reminder (reuses Workstream 5's Vercel Cron infrastructure).
- **Anonymous industry benchmarking.** The free tier already teases an
  "industry benchmark preview" in `src/data/pricing.ts`'s feature list
  that isn't actually implemented against real aggregate data. Once real
  assessment volume exists (subject to Workstream 3's privacy review for
  anonymized aggregation), show "businesses like yours typically score X"
  by industry + company size — a genuine moat, since it requires a real,
  growing dataset a new entrant can't replicate on day one, and it
  produces exactly the calibration data Workstream 1's threshold
  recalibration needs.

## Workstream 5 — Growth Engine

- **WhatsApp/email nurture sequence — sized against 2026 benchmarks and
  the new per-message pricing model.** Currently only a single on-request
  "send my report" message and one-off team alerts exist
  (`src/lib/whatsapp/client.ts`). B2B SaaS 2026 benchmarks: median 34%
  open rate, 4.8% CTR, 2.9% reply rate; 6–14% MQL-to-conversion; short
  sales-cycle products should run 5–8 touches over 21–30 days, one every
  3–7 days, staying well under 12 touches (unsubscribe rate spikes 2–3x
  past that). Because WhatsApp now bills per template message
  (~$0.05/UAE marketing message, 80–90% cheaper for utility/auth
  templates, free within a 24-hour user-initiated service window), the
  build spec must classify each touch by template category up front —
  reserve marketing-category templates for the 1–2 genuinely promotional
  touches and use utility-category templates for transactional/report
  content. Needs Meta-approved message templates — start that submission
  in parallel with the scheduler code, since approval lead time is
  external and shouldn't gate the whole build.
- **Scheduler infrastructure — Vercel Pro is not required.** Vercel Cron
  Jobs are available on every plan; Hobby caps at once-per-day cadence,
  Pro ($20/mo) unlocks per-minute precision. A nurture sequence with
  3–7-day-spaced touches, and a quarterly re-assessment reminder, both fit
  comfortably within Hobby's daily cap. Don't pre-purchase Pro on an
  assumption it's needed — only a future feature needing sub-daily
  granularity would actually require it.
- **Turn on PostHog feature flags and experimentation — zero net-new
  infrastructure cost.** `src/lib/analytics/posthog-client.ts` and
  `posthog-server.ts` are wired for event capture only; zero flag or
  experiment usage exists anywhere in the codebase today despite PostHog
  natively supporting both, with a documented Next.js integration
  (including a Vercel-endorsed Flags SDK template). First concrete
  experiments: pricing-page copy/anchoring variants
  (`PricingSection.tsx`), the free-tier question-count trade-off raised in
  Workstream 1, and PDF report preview teaser variants
  (`ReportPreview.tsx`) to test paid-tier conversion. Implementation
  touches `src/lib/analytics/posthog-client.ts` (flag-fetch wrapper) and
  `src/components/PostHogProvider.tsx` (flag bootstrap on load).
- **Sequencing note.** Ship flags first (near-zero cost, immediately
  useful for the pricing/depth questions Workstreams 1 and 4 raise), then
  use flag-driven experiment data to inform nurture-sequence copy before
  investing in the heavier WhatsApp template-approval process.
- **SEO content pipeline.** Technical SEO groundwork (sitemap, OG,
  structured data) already exists per `DEPLOYMENT.md`; nothing feeds it.
  Stand up a lightweight content cadence (2–4 articles/month) targeting
  UAE PDPL + AI, UAE AI Strategy 2031 alignment, and GCC-specific AI ROI
  topics, reusing the `src/data/resources.ts` article infrastructure
  already built. Add per-page Open Graph images before any paid-traffic or
  backlink push (`DEPLOYMENT.md` currently confirms only a site-wide
  default OG image exists) — social-share appearance directly affects CTR
  on exactly the channels a content plan would use.

## Workstream 6 — Ops & Release Engineering

Already actioned as part of this plan (low-risk, zero-decision scaffolding
— see the repo for the actual files):

- **`.github/dependabot.yml`** — weekly npm and GitHub Actions dependency
  update PRs. Worth watching closely given this is a Next.js 16.2.10 fork
  with documented breaking-change behavior (`AGENTS.md`) — a
  routine-looking bump can carry real behavior changes.
- **`CHANGELOG.md`** — seeded with the Phase 1–14 history in
  Keep-a-Changelog format, ready for ongoing entries.
- **CD clarification in `DEPLOYMENT.md`** — documents that Vercel's git
  integration (push to `main` → automatic deploy) is the intended deploy
  path, rather than building a redundant custom GitHub Actions workflow
  that would need production secrets it doesn't have yet.

Still open:

- **Release tagging/versioning.** No git-tag-based releases exist yet.
  Consider adopting semantic version tags mapped to the internal phase
  numbering already used in `AGENTS.md`/commit history, so releases read
  cleanly against the phase-based mental model already established.

## Workstream 7 — Business Formation & Revenue Activation

This is `docs/GO_LIVE_CHECKLIST.md` §1–3, restated here with explicit
sequencing the checklist itself doesn't spell out:

1. **Register a UAE trade license** — mainland (DED) or a free zone.
   DIFC/ADGM carry more enterprise weight but pull in Workstream 3's
   DIFC/ADGM regime-scoping as a live consideration for Darix's *own*
   registration too, not just its customers'; a standard free zone (Dubai
   Internet City, Dubai Silicon Oasis) is faster and sufficient otherwise.
   **This blocks everything below.**
2. **Open a UAE corporate bank account** (needs #1; budget 4–8 weeks for
   compliance review).
3. **Activate live payment gateways, in dependency order**: trade license
   → bank account → (parallel) Stripe UAE business verification, Telr live
   merchant activation, Tabby onboarding. Stripe supports UAE-registered
   entities (sole establishments, branches, free-zone companies) as of
   2026, but restricts Stripe Connect (marketplace-style payouts) for UAE
   accounts — relevant if the Partners programme
   (`src/app/partners/`, `src/app/api/partners/apply/route.ts`) ever wants
   to pay referral commissions via Stripe Connect; flag this now so it
   isn't discovered late when designing partner payouts. Telr and Tabby
   both need the trade license number as part of their own onboarding
   forms regardless of which gateway goes live first; Tabby's eligible
   order range (AED 100–5,000) comfortably covers Darix's AED 1,999 tier,
   so there's no product-fit blocker there, only the sequencing one.
4. **VAT registration** (mandatory once turnover projects past AED
   375,000/year; voluntary from AED 187,500) and **Corporate Tax
   registration** (mandatory regardless of tax due).
5. **Legal sign-off on Privacy Policy/Terms**, in the same engagement as
   Workstream 3's DIFC/ADGM, data-residency, and DPO items — one lawyer
   conversation covering all of it, not four separate ones.
6. **Sign DPAs with all 10 sub-processors.**
7. **Price professional indemnity and cyber liability insurance** given
   PDPL's confirmed fine exposure.
8. **Support/SLA process and Business Consultation call staffing** —
   currently undefined; resolve before the first paying customer, not
   after, since the checkout flow that sells the 60-minute call already
   works today.

## Workstream 8 — Go-To-Market

- **Grant/funding programs** (expanded list — `docs/GO_LIVE_CHECKLIST.md`
  §4 updated as part of this plan): Dubai Future Foundation / Dubai Future
  District Fund, Mohammed Bin Rashid Innovation Fund, Dubai SME (cash
  grants reported up to ~AED 200k for qualifying high-growth startups),
  Dubai Research, Development and Innovation (RDI) Program, Khalifa Fund
  for Enterprise Development, and free-zone incubators (in5, Hub71).
  Darix's direct alignment with the UAE AI Strategy 2031's stated economic
  impact goals (an estimated AED 335bn value-add, lifting AI's GDP share)
  is a genuine narrative asset worth citing explicitly in applications.
- **Proactive partner outreach.** `/partners` only accepts inbound
  applications today. Actively approach 5–10 UAE AI/digital-transformation
  consultancies to pitch the white-label diagnostic angle.
- **Real case studies as they become available** (see Workstream 1) — tie
  directly to the first real customers Workstream 7 produces.

---

## Sequencing Dependency Map

```
Trade license (W7.1)
 ├── Bank account (W7.2)
 ├── Tabby / Telr live onboarding (needs trade license #)
 ├── VAT / Corp Tax registration (W7.4)
 └── Own-entity DIFC/ADGM regime decision feeds Workstream 3 directly

Legal engagement (W7.5 + W3 DIFC/ADGM + data-residency + DPO items)
 └── Unblocks removing the "draft" banner in LegalPageLayout.tsx
 └── Unblocks onboarding any DIFC/ADGM-registered customer

Stripe live activation (W7.3) ─── fastest path to first real AED
Telr / Tabby live activation (W7.3) ─── parallel, gated on trade-license docs

Model review (W1) ─── should land before heavy marketing spend (W8)
                       so the score being marketed is defensible

PostHog flags (W5) ─── ship before the nurture sequence (W5) —
                        near-zero cost, informs nurture copy first

Meta template approval (W5) ─── start submission in parallel with
                                 scheduler code, not after

Real customers (via W7 + W8) ─── unblocks real case studies (W1)
                              ─── unblocks benchmarking data (W4)

ISO 27001 pursuit (W3) ─── scope now, execute only once W7's entity
                            is stable (accreditation needs a registered
                            legal entity as the certification subject)

Component/API test coverage (W2) ─── no external dependency, runs fully
                                      in parallel with everything above
```

---

## Suggested Near-Term Sequence (first ~90 days)

1. **Weeks 1–2**: Start trade license registration (W7.1) and the combined
   legal engagement (W7.5 + W3) in parallel — both are calendar-bound and
   should start immediately regardless of what else happens.
2. **Weeks 1–4**: Untested revenue-critical routes (W2) and commissioning
   the scoring-model review (W1) — pure engineering/consulting work, no
   external dependency, runs fully in parallel with #1.
3. **Weeks 3–6**: Once the trade license is issued, activate Stripe live
   (W7.3) — first real transaction becomes possible.
4. **Weeks 4–8**: Turn on PostHog flags/experiments (W5 — zero new infra)
   and ops hygiene (W6) — low-effort, high-leverage, no dependencies.
5. **Weeks 6–10**: Telr + Tabby live activation once bank account + trade
   license documents are in hand (W7.3 continued).
6. **Weeks 8–12**: Nurture sequence build (W5) and grant applications
   (W8) — both benefit from a few weeks of real usage data/traction to
   reference.
7. **Ongoing from week 12**: re-assessment tracking and benchmarking (W4)
   as real customer data accumulates; partner outreach (W8) once the
   product has at least one real, referenceable case study.

---

## Verification / Definition of Done

- **Workstreams 1–2 (code)**: `npm run lint`, `npx tsc --noEmit`,
  `npm test`, `npm run build`, `npm run test:e2e` all pass — same bar as
  every prior phase.
- **Workstreams 4–5 (product)**: new features get the same RTL/Playwright
  coverage pattern already established (`ScoreDashboard.test.tsx` /
  `e2e/checkout-and-forms.spec.ts` as templates).
- **Workstreams 3, 7 (legal/business)**: verified by document, not code —
  signed lawyer sign-off, signed DPAs, an issued trade license number, a
  live (non-test-mode) transaction receipt from each activated gateway.
- **Workstream 6 (ops)**: Dependabot PRs appearing weekly; a Vercel
  deploy visibly firing on merge to `main`.
- **Workstream 8 (GTM)**: at least one signed partner, one real named case
  study, and one grant application submitted — concrete exit criteria
  rather than open-ended "do marketing."

---

## What changed in the codebase as part of writing this plan

Documentation-only, zero-risk updates made alongside this plan (no
application code, scoring logic, or business decisions were touched —
those remain scoped above, not executed, since they need real
domain-expert and legal input this plan can't fabricate):

- `docs/ROPA.md` — added §0 (DIFC/ADGM regime applicability), sharpened
  §3's data-residency language with the Supabase-region specifics, and
  added three new items to §5 (response-window reconfirmation, DPO
  threshold, regime-applicability gate).
- `docs/GO_LIVE_CHECKLIST.md` — added the DIFC/ADGM registration gate, a
  DPO-appointment item, a new §2b (ISO 27001 security certification
  path), a Stripe Connect note for future partner payouts, and two
  additional grant programs (Dubai SME, Khalifa Fund) plus the Dubai RDI
  Program.
- `.github/dependabot.yml` — new, weekly npm + GitHub Actions updates.
- `CHANGELOG.md` — new, seeded with Phase 1–14 history.
- `DEPLOYMENT.md` — clarified that Vercel's git integration is the
  intended CD path, and documented what Dependabot now does.
