-- Darix AI Platform: core schema for assessments and leads.
-- Run this in the Supabase SQL editor, or via `supabase db push`.

create extension if not exists "pgcrypto";

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  company_name text,
  contact_name text,
  contact_email text,
  answers jsonb not null,
  result jsonb not null,
  tier text not null default 'free' check (tier in ('free', 'pro', 'business')),
  created_at timestamptz not null default now()
);

create index if not exists assessments_user_id_idx on public.assessments (user_id);
create index if not exists assessments_created_at_idx on public.assessments (created_at desc);

alter table public.assessments enable row level security;

-- Anyone can create an assessment (anonymous quiz takers included).
create policy "assessments_insert_anyone"
  on public.assessments for insert
  to anon, authenticated
  with check (true);

-- Only the owning, authenticated user can list/select their own rows this
-- way (used by the dashboard). Deliberately no anon/authenticated "select
-- any row" policy: that would let anyone dump the whole table (other
-- users' company names, emails, and answers), not just fetch-by-id.
--
-- The shareable /report/[id] link, the PDF route, and the "email me this
-- report" flow instead read a single row server-side using the Supabase
-- service-role client (SUPABASE_SERVICE_ROLE_KEY, never sent to the
-- browser), which bypasses RLS entirely. Possession of the assessment's
-- v4 UUID is the access control for that path, the same trust model as a
-- typical "anyone with the link" share URL.
create policy "assessments_select_own"
  on public.assessments for select
  to authenticated
  using (auth.uid() = user_id);

-- Only the owning user may update their own row (e.g. to claim an
-- anonymous assessment after signing in, or upgrade its tier).
create policy "assessments_update_own"
  on public.assessments for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  work_email text not null,
  company_name text not null,
  company_size text not null,
  challenge text not null,
  source text not null default 'contact_form',
  created_at timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);

alter table public.leads enable row level security;

-- Public contact form: inserts only, never readable by anon/authenticated
-- clients. Reads happen via the service-role key from the internal admin
-- view / server-side code only.
create policy "leads_insert_anyone"
  on public.leads for insert
  to anon, authenticated
  with check (true);
