-- Two related Tier 3 features: (1) letting an assessment owner revoke or
-- time-limit a previously-permanent share link, and (2) lightweight team
-- accounts so a signed-in user's assessments can be visible to their
-- whole organization, not just themselves.

-- --- Revocable/expiring report sharing -------------------------------
-- /report/[id] has always been readable by anyone possessing the UUID
-- (see 0001_init.sql's assessments_select_own comment — that's a
-- deliberate "anyone with the link" trust model for the shareable-report
-- feature, enforced by the service-role client, not RLS). These columns
-- let the owner actually revoke or time-limit that access after the fact,
-- which the original design had no way to do. share_enabled/expiry are
-- only ever enforced for non-owner viewers — the owner can always see
-- their own report regardless (checked in application code, not RLS,
-- since the read itself still goes through the service-role client).
alter table public.assessments
  add column if not exists share_enabled boolean not null default true,
  add column if not exists share_expires_at timestamptz;

-- --- Lightweight team accounts ----------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index if not exists organization_members_user_id_idx on public.organization_members (user_id);

-- Pending invites to an email address with no Darix account yet — kept
-- separate from organization_members (which always references a real
-- auth.users row) so the invite survives until the invitee actually signs
-- up. src/app/auth/callback/route.ts checks this table by the newly
-- confirmed email and auto-joins them, then deletes the row.
create table if not exists public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);

-- Which team (if any) an assessment is shared with. Null (the default)
-- means "personal, visible only to its owner" — unchanged from today.
-- on delete set null (not cascade): if an organization is ever deleted,
-- the assessment itself and its owner's access to it are unaffected —
-- only the team-visibility grant goes away.
alter table public.assessments
  add column if not exists organization_id uuid references public.organizations (id) on delete set null;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invites enable row level security;

-- Members can see their own organization's row. Organizations are only
-- ever created via the service-role client (src/lib/organizations/ensure.ts,
-- called from the invite route after checking the caller's own identity)
-- — no insert/update/delete policy needed for anon/authenticated.
create policy "organizations_select_member"
  on public.organizations for select
  to authenticated
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = organizations.id
        and m.user_id = auth.uid()
    )
  );

-- A member can see the full roster of every organization they belong to
-- (self-referential: the policy checks membership in the same org via a
-- second lookup, not "is this my own row"). Inserts (adding a teammate)
-- only ever happen via the service-role client after the invite route
-- verifies the caller is themselves a member — not expressible as a
-- simple auth.uid()-based with-check, since the row being inserted
-- belongs to a *different* user than the one making the request.
create policy "organization_members_select_same_org"
  on public.organization_members for select
  to authenticated
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = organization_members.organization_id
        and m.user_id = auth.uid()
    )
  );

-- Invites are never read directly by anon/authenticated clients — the
-- invite route and the auth callback both use the service-role client
-- (the invite route to look up/create them, the callback to consume
-- them by email, which isn't an identity Postgres RLS can check against
-- auth.uid() for a not-yet-existing session anyway).

-- Lets an org member see assessments their team shares, in addition to
-- their own (assessments_select_own from 0001_init.sql) — Postgres
-- combines multiple permissive policies on the same table with OR, so
-- this adds to that policy rather than replacing it.
create policy "assessments_select_org_member"
  on public.assessments for select
  to authenticated
  using (
    organization_id is not null
    and exists (
      select 1 from public.organization_members m
      where m.organization_id = assessments.organization_id
        and m.user_id = auth.uid()
    )
  );

-- Used by the invite route to resolve "does a Darix account already exist
-- for this email" without needing a separate admin API round-trip.
-- security definer: auth.users isn't otherwise queryable by the
-- authenticated role at all.
create or replace function public.get_user_id_by_email(lookup_email text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from auth.users where email = lookup_email limit 1;
$$;
