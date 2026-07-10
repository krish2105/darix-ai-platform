# Records of Processing Activities (ROPA)

Internal document, not user-facing. Maintained to support UAE PDPL (Federal
Decree-Law No. 45 of 2021) compliance — Article requirements around
maintaining processing records are a standard expectation once a business is
subject to the law's full enforcement (2026 Executive Regulations).

**This is a working draft, not a substitute for legal review.** A
UAE-qualified lawyer should confirm the legal basis, retention periods, and
sector-applicability determinations below before this is relied on. See the
"draft — requires legal review" notice on the public Privacy Policy and
Terms pages, which applies here too.

Last updated: 10 July 2026.

## 0. Regime applicability by customer registration (read before onboarding a free-zone customer)

UAE data protection is **not one law**. Three separate, non-overlapping
regimes exist depending on where the *customer/data subject's entity* is
registered, not where Darix is registered:

- **Federal PDPL** (Federal Decree-Law No. 45 of 2021) — applies to UAE
  mainland entities. This is the regime the rest of this document assumes
  by default.
- **DIFC Data Protection Law No. 5 of 2020** — applies to entities
  registered in the Dubai International Financial Centre. GDPR/UK-aligned,
  materially amended in July 2025 (Amendment Law No. 1 of 2025), which
  added a **private right of action** — a DIFC-registered data subject can
  sue directly in DIFC Courts, a materially higher-stakes enforcement path
  than Federal PDPL's regulator-led model.
- **ADGM Data Protection Regulations 2021** — applies to entities
  registered in Abu Dhabi Global Market. GDPR-aligned, updated September
  2025 with new substantial-public-interest rules for special-category
  data.

These regimes do not defer to one another (Federal PDPL and DIFC do not
recognise each other as "adequate" for cross-border transfer purposes).
**Action required before onboarding any DIFC- or ADGM-registered customer:**
get counsel to confirm which regime governs that specific relationship and
whether this document and the Privacy Policy/Terms actually cover it — do
not assume Federal PDPL coverage extends automatically. Until that's
confirmed, treat DIFC/ADGM-registered customers as **out of scope** (a
"mainland-only for now" policy), and consider adding a business-registration-
jurisdiction question to the contact/intake flow so this is surfaced before
a deal closes, not after.

## 1. Controller

Darix AI (Dubai AI Readiness Index). Contact: hello@darix.ai.
_Registered entity: not yet established — see Phase 6 (Business Readiness)
of the deployment readiness report. Update this section once a UAE trade
license is issued._

## 2. Processing activities

| # | Activity | Data categories | Data subjects | Legal basis | Retention | System |
|---|----------|------------------|----------------|--------------|-----------|--------|
| 1 | Free AI readiness assessment | Answers (1–5 scale per question), computed score/result, optional company name, contact name, contact email, optional `user_id` | Prospective/existing customers | Consent (submitting the form) | Until deletion requested; no automatic expiry currently enforced | `public.assessments` (Supabase) |
| 2 | Paid tier unlock (Professional / Business) | Payment metadata (card data never touches our servers — handled by Stripe/Telr), tier, assessment ID | Paying customers | Contract performance | Same as assessment record | `public.assessments.tier`, Stripe/Telr |
| 3 | Contact form / consultation request | Full name, work email, company name, company size, challenge description | Prospective customers (leads) | Consent | Until deletion requested; CRM-lite status tracked, no automatic expiry | `public.leads` (Supabase) |
| 4 | Account creation | Email, hashed password (via Supabase Auth), auth session tokens | Registered users | Contract performance | Until account deletion (self-service via `/dashboard` or `/api/account/delete`) | Supabase Auth, `public.assessments.user_id` |
| 5 | PDPL access/erasure request (anonymous) | Full name, email, request type, free-text details | Data subjects without an account | Legal obligation (responding to a rights request) | Until resolved + a reasonable record-keeping period | `public.data_requests` (Supabase) |
| 6 | Partner program application | Organization name, contact name, contact email, partner type, message | Prospective partners | Consent | Until deletion requested | `public.partner_inquiries` (Supabase) |
| 7 | Rate limiting / bot protection | IP address (hashed key), request counts | Any visitor | Legitimate interest (abuse prevention) | 60-second sliding window (Upstash) or in-memory equivalent | Upstash Redis / in-process |
| 8 | Error monitoring | Stack traces, request context, IP (via Sentry SDK defaults) | Any visitor experiencing an error | Legitimate interest (reliability) | Per Sentry's retention settings (configure a retention policy in the Sentry project) | Sentry |
| 9 | Product analytics | Pseudonymous event data (page views, funnel events) | Any visitor | Legitimate interest / consent depending on config | Per PostHog project retention settings | PostHog |
| 10 | WhatsApp click-to-chat / Business API follow-up (Phase 11) | Phone number, message content, assessment context passed into the prefilled message | Visitors who initiate WhatsApp contact | Consent (user-initiated contact) | Per WhatsApp/Meta's own retention; Darix does not separately store message content unless explicitly logged | Meta Cloud API (see `src/lib/whatsapp/`) |

## 3. Cross-border transfers

See `/sub-processors` (public page) for the full list of providers and
their approximate hosting location. None of the current sub-processors are
UAE-based, and this is a firmer statement than it might sound: Supabase (the
primary data store) has **no native Middle East/UAE region** as of this
writing — the nearest official Supabase regions are outside the UAE, and
any "Supabase hosted in the UAE" option on the market today is a
third-party-managed reseller wrapping Supabase's open-source stack on
UAE-based servers, not Supabase's own infrastructure. That's a materially
different vendor-risk and due-diligence profile than a native regional
offering, and it's a more specific fact than a general "no localization
required" statement. PDPL doesn't require UAE-only hosting outside the
specifically regulated sectors (financial services, healthcare, telecoms,
government) — Darix is not currently active in any of those sectors, but
that determination, together with the specific data-flow fact above,
should be put to counsel by name, not just assumed.

Appropriate safeguards in place today: TLS in transit for all provider
connections, encryption at rest (Supabase/Stripe/Telr default), and
least-privilege service-role credentials scoped per integration. Signed
Data Processing Addendums / Standard Contractual Clauses with each
processor are **not yet on file** — request and countersign them as part
of Phase 9 finalization.

## 4. Data subject rights fulfillment

- **Access / portability**: `/api/account/export` (self-service, signed-in
  users) or `/privacy-center` request form (anonymous), reviewed via
  `/admin`.
- **Erasure**: `/api/account/delete` (self-service) or `/privacy-center`
  request form, reviewed via `/admin`. Erasure deletes assessment rows
  outright (not just detaching `user_id`) — see the comment in
  `src/app/api/account/delete/route.ts`.
- **Response window**: PDPL gives 30 days to respond to a rights request
  submitted through the anonymous form; the admin panel surfaces
  `data_requests.status` and `created_at` to track this.

## 5. Open items for legal review

1. Confirm the legal basis stated for each processing activity above.
2. Confirm retention periods — several rows above say "until deletion
   requested," which may not be an adequate policy on its own under PDPL.
3. Countersign DPAs/SCCs with each sub-processor.
4. Confirm Darix's sector classification and that no localization
   requirement applies.
5. Confirm whether any UAE Data Office registration or notification is
   required at this stage of enforcement.
6. Confirm the exact data-subject-rights response window under the 2026
   Executive Regulations — this document currently states 30 days as a
   general PDPL norm (§4); verify against the Executive Regulations text
   itself rather than treating it as settled.
7. Determine whether Darix's processing volume/sensitivity crosses the
   threshold requiring a formal Data Protection Officer appointment under
   the 2026 Executive Regulations' DPO-appointment criteria. If yes, an
   external/fractional DPO service is a reasonable starting option before
   a full-time hire is justified.
8. See §0 above — confirm regime applicability (Federal PDPL vs. DIFC vs.
   ADGM) before any free-zone-registered customer is onboarded.
