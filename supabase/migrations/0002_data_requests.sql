-- PDPL (Federal Decree-Law No. 45 of 2021) self-service support: logs
-- access/erasure requests from people who don't have a Darix account to
-- self-serve through (anonymous quiz-takers, contact-form leads). Signed-in
-- users export/delete their own data directly via /api/account/export and
-- /api/account/delete instead of filing a request here.

create table if not exists public.data_requests (
  id uuid primary key default gen_random_uuid(),
  request_type text not null check (request_type in ('access', 'erasure')),
  full_name text not null,
  email text not null,
  details text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'rejected')),
  notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists data_requests_created_at_idx on public.data_requests (created_at desc);
create index if not exists data_requests_status_idx on public.data_requests (status);

alter table public.data_requests enable row level security;

-- Public request form: inserts only, same trust model as public.leads —
-- never readable by anon/authenticated clients, only via the service-role
-- client from /admin.
create policy "data_requests_insert_anyone"
  on public.data_requests for insert
  to anon, authenticated
  with check (true);
