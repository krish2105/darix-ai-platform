import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(),
}));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));
vi.mock('@/lib/organizations/ensure', () => ({
  ensureOrganizationForUser: vi.fn(),
}));

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ensureOrganizationForUser } from '@/lib/organizations/ensure';
import { POST } from './route';

const signedInSession = (email = 'owner@darix.ai') => ({
  auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'owner-1', email } } }) },
});

const call = (body: unknown, ip = `10.2.2.${Math.floor(Math.random() * 1000)}`) =>
  POST(
    new NextRequest('http://localhost/api/organizations/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    })
  );

// Builds a from()-keyed table double. Each table name maps to a queue of
// results consumed in call order (the route hits organization_members
// twice per request — once for the caller's own role, once to check
// whether the invitee is already on a team — and those two calls need
// different canned answers), holding on the last queued result once
// exhausted. Also tracks insert/upsert calls.
const makeAdmin = (tables: Record<string, { data: unknown; error: unknown }[]>) => {
  const inserts: Record<string, unknown[]> = {};
  const callIndex: Record<string, number> = {};
  const from = vi.fn((table: string) => {
    const queue = tables[table] ?? [{ data: null, error: null }];
    const index = callIndex[table] ?? 0;
    callIndex[table] = index + 1;
    const result = queue[Math.min(index, queue.length - 1)];
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      insert: vi.fn((row: unknown) => {
        inserts[table] = [...(inserts[table] ?? []), row];
        return builder;
      }),
      upsert: vi.fn((row: unknown) => {
        inserts[table] = [...(inserts[table] ?? []), row];
        return Promise.resolve({ data: null, error: null });
      }),
      single: vi.fn(() => Promise.resolve(result)),
      maybeSingle: vi.fn(() => Promise.resolve(result)),
      then: (onFulfilled?: (v: unknown) => unknown) => Promise.resolve(result).then(onFulfilled),
    };
    return builder;
  });
  return {
    from,
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: { admin: { inviteUserByEmail: vi.fn().mockResolvedValue({ data: null, error: null }) } },
    __inserts: inserts,
  };
};

describe('POST /api/organizations/invite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not signed in', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    const res = await call({ email: 'teammate@darix.ai' });
    expect(res.status).toBe(401);
  });

  it('rejects an invalid email', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createServerSupabaseClient).mockResolvedValue(signedInSession() as any);
    const res = await call({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  it('rejects inviting yourself', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createServerSupabaseClient).mockResolvedValue(signedInSession('owner@darix.ai') as any);
    const res = await call({ email: 'owner@darix.ai' });
    expect(res.status).toBe(400);
  });

  it('blocks a non-owner from inviting', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createServerSupabaseClient).mockResolvedValue(signedInSession() as any);
    vi.mocked(ensureOrganizationForUser).mockResolvedValue('org-1');
    const admin = makeAdmin({
      organization_members: [{ data: { role: 'member' }, error: null }],
    });
    vi.mocked(createAdminSupabaseClient).mockReturnValue(admin as unknown as ReturnType<typeof createAdminSupabaseClient>);

    const res = await call({ email: 'teammate@darix.ai' });
    expect(res.status).toBe(403);
  });

  it('adds an existing Darix user directly as a member', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createServerSupabaseClient).mockResolvedValue(signedInSession() as any);
    vi.mocked(ensureOrganizationForUser).mockResolvedValue('org-1');
    const admin = makeAdmin({
      organization_members: [
        { data: { role: 'owner' }, error: null },
        { data: null, error: null },
      ],
    });
    admin.rpc.mockResolvedValue({ data: 'existing-user-2', error: null });
    vi.mocked(createAdminSupabaseClient).mockReturnValue(admin as unknown as ReturnType<typeof createAdminSupabaseClient>);

    const res = await call({ email: 'teammate@darix.ai' });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.status).toBe('joined');
  });

  it('records a pending invite and best-effort emails when no account exists', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createServerSupabaseClient).mockResolvedValue(signedInSession() as any);
    vi.mocked(ensureOrganizationForUser).mockResolvedValue('org-1');
    const admin = makeAdmin({
      organization_members: [{ data: { role: 'owner' }, error: null }],
    });
    admin.rpc.mockResolvedValue({ data: null, error: null });
    vi.mocked(createAdminSupabaseClient).mockReturnValue(admin as unknown as ReturnType<typeof createAdminSupabaseClient>);

    const res = await call({ email: 'newperson@darix.ai' });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.status).toBe('invited');
    expect(admin.auth.admin.inviteUserByEmail).toHaveBeenCalledWith('newperson@darix.ai');
  });
});
