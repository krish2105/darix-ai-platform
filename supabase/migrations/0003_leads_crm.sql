-- CRM-lite: track a lead's progress through the pipeline directly on the
-- existing leads table rather than standing up a separate CRM.

alter table public.leads
  add column if not exists status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'won', 'lost')),
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists leads_status_idx on public.leads (status);
