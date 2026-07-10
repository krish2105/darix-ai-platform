-- Webhook idempotency: Stripe (and any future provider) may redeliver the
-- same event on retry. Recording each event id before processing lets the
-- webhook handler recognize a duplicate delivery and skip re-running the
-- tier-unlock + receipt-email side effects a second time.

create table if not exists public.processed_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

alter table public.processed_webhook_events enable row level security;

-- Server-role client only — webhooks are never called from the browser,
-- so no anon/authenticated policy is needed here at all.
