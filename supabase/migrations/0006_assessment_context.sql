-- Optional intake context captured at assessment time, used to personalize
-- the generated report (industry-specific recommended pilot + context
-- sentence — see src/utils/scoring.ts) and, longer-term, to power
-- anonymized industry benchmarking (src/app/api/benchmarks/route.ts).
-- Both columns are nullable: the free assessment has always been usable
-- without providing either, and existing rows predate these columns.

alter table public.assessments
  add column if not exists industry text,
  add column if not exists company_size text;

-- Which regime governs a contact-form lead's own data (UAE Federal PDPL,
-- DIFC, or ADGM) depends on where their business is registered — see
-- docs/ROPA.md §0. Surfacing this at intake lets the team apply the
-- "mainland-only for now" policy documented there before a deal
-- progresses. Nullable/optional, same rationale as above.
alter table public.leads
  add column if not exists business_jurisdiction text;
