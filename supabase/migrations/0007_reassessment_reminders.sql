-- Tracks the last time a signed-in user was sent a "time for a
-- re-assessment" reminder email, so the cron in
-- src/app/api/cron/reassessment-reminder/route.ts doesn't email the same
-- user every time it runs. One row per user; upserted on each send.

create table if not exists public.reassessment_reminders (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_sent_at timestamptz not null default now()
);

alter table public.reassessment_reminders enable row level security;

-- No anon/authenticated policies at all: this table is only ever read or
-- written by the cron route's admin (service-role) client, the same trust
-- model as public.processed_webhook_events.
