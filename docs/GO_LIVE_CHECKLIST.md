# Go-Live Checklist — Business & Legal Readiness

Everything the codebase needs is covered by `DEPLOYMENT.md` (technical
setup) and `docs/ROPA.md` (data processing / PDPL). This document is the
opposite: a checklist of things **no amount of code can complete**, because
they're registrations, contracts, and human decisions rather than
software. Nothing here is legal, financial, or business advice — it's a
punch list to take to a UAE-qualified lawyer, accountant, and business
setup advisor.

Grouped by who typically owns the action.

## 1. Company formation & licensing

- [ ] Register a UAE trade license covering software/AI consulting
      services — mainland (DED) or a free zone (e.g. DIFC, ADGM, Dubai
      Internet City, Dubai Silicon Oasis) depending on target clients and
      ownership structure. A free zone is usually faster for a
      software-only business with no mainland office requirement; DIFC/ADGM
      carry more weight for enterprise/financial-sector clients but cost
      more and add regulatory scope.
- [ ] Open a UAE corporate bank account (needs the trade license first;
      can take 4-8 weeks with UAE banks' compliance review).
- [ ] Register for VAT once taxable turnover is expected to cross AED
      375,000/year (voluntary registration is available earlier at AED
      187,500).
- [ ] Register for UAE Corporate Tax (mandatory registration regardless of
      whether tax is actually due, per the Federal Tax Authority).
- [ ] Decide and document data residency / hosting posture with counsel —
      `docs/ROPA.md` documents "no data-localization requirement applies"
      as a working assumption based on Darix's sector; get this confirmed
      in writing, not assumed.

## 2. Legal sign-off (blocks removing the "draft" notices in the app)

- [ ] UAE-qualified lawyer reviews and approves `/privacy` and `/terms` —
      both pages carry an explicit draft notice in the code until this
      happens (see `DEPLOYMENT.md` section 6e).
- [ ] Request and countersign a Data Processing Addendum (DPA) from every
      sub-processor listed on `/sub-processors`: Supabase, Resend, Stripe,
      Telr, Tabby, PostHog, Sentry, Cloudflare, Upstash, Meta (WhatsApp
      Cloud API). Keep signed copies on file — this is what actually
      discharges the "sub-processor" obligation PDPL creates, not just
      listing them publicly.
- [ ] Confirm consumer-protection / e-commerce obligations for online
      checkout under UAE Federal Law No. 15 of 2020 (refund policy,
      pricing transparency, etc.) — `/terms` should reflect counsel's
      answer, not this document's guess.
- [ ] Professional indemnity and cyber liability insurance — worth
      pricing given PDPL's fine exposure (AED 50,000-5,000,000; higher for
      data-localization breaches) before the first paying customer.

## 3. Payments — going from test/sandbox to live

Every gateway in the codebase runs in test mode until you flip these:

- [ ] Stripe: complete UAE business verification, get a live secret key,
      re-create the webhook in live mode (`DEPLOYMENT.md` section 3).
- [ ] Telr: activate a live merchant account, verify field names against
      your real sandbox (section 3b) — the integration was written from
      Telr's published docs, not tested against a live account.
- [ ] Tabby: complete merchant onboarding, get live credentials, run a
      real pay-in-4 transaction end to end before relying on it (section
      3c) — same "verify against the real thing" caveat.
- [ ] Decide which gateway is primary (`PAYMENT_PROVIDER` env var) for
      launch — Stripe has the simplest global tooling, Telr/Tabby have
      better UAE-local card and BNPL coverage.

## 4. Grants & government programs (optional, worth 30 minutes of research)

Dubai/UAE has several programs an early-stage AI SaaS may qualify for —
eligibility and application are a human business-development task, not
something this repo can determine:

- [ ] Dubai Future Foundation / Dubai Future District Fund programs.
- [ ] Mohammed Bin Rashid Innovation Fund.
- [ ] Dubai SME (Mohammed Bin Rashid Establishment for SME Development)
      support programs, if incorporated as an SME under Dubai mainland.
- [ ] Free zone-specific incubator/accelerator programs (e.g. in5 at
      Dubai Internet City, Hub71 in Abu Dhabi) if operating from one of
      those zones.

## 5. Sales & partnerships

- [ ] `/partners` accepts inbound partner applications (consultancies,
      systems integrators, referral partners) and saves them to
      `partner_inquiries` for admin follow-up — but nobody is emailing
      or calling prospective partners. Proactive outreach is a sales
      activity, not a code gap.
- [ ] The three case studies on `/case-studies` (`src/data/caseStudies.ts`)
      are illustrative composites, not real named customers — replace
      them with real pilot-customer results (with the customer's written
      permission to publish) as they become available, or keep an
      "illustrative example" disclaimer visible if they stay generic.
- [ ] Define who actually staffs the Business Consultation 60-minute
      strategy call once a customer books one via `/contact` or the
      results-page CTA — the code captures the request and sends a
      confirmation email/WhatsApp alert, it doesn't run the call.
- [ ] Decide a support channel/SLA for paying customers beyond the
      WhatsApp click-to-chat button and contact form — no ticketing
      system exists in the codebase.

## 6. Marketing

- [ ] Real UAE business email addresses instead of placeholder senders in
      `.env.example` (`EMAIL_FROM`, `TEAM_ALERT_EMAIL`).
- [ ] Production domain purchase + DNS pointed at the Vercel deployment.
- [ ] A basic content/backlink/social plan — the SEO groundwork (sitemap,
      OG tags, structured data) is in the codebase, but nothing generates
      inbound traffic on its own.

## What this checklist is not

It doesn't replace legal or financial advice, and it isn't exhaustive for
every jurisdiction or business structure — treat it as a starting point to
bring to your lawyer/accountant/business setup advisor, not a substitute
for them.
