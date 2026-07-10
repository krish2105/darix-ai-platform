-- Partner program applications (consultancies, systems integrators,
-- referral partners) — same public insert-only trust model as leads and
-- data_requests, reviewed by the team via /admin.

create table if not exists public.partner_inquiries (
  id uuid primary key default gen_random_uuid(),
  organization_name text not null,
  contact_name text not null,
  contact_email text not null,
  partner_type text not null check (partner_type in ('consultancy', 'systems_integrator', 'referral', 'other')),
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'won', 'lost')),
  created_at timestamptz not null default now()
);

create index if not exists partner_inquiries_created_at_idx on public.partner_inquiries (created_at desc);

alter table public.partner_inquiries enable row level security;

create policy "partner_inquiries_insert_anyone"
  on public.partner_inquiries for insert
  to anon, authenticated
  with check (true);
