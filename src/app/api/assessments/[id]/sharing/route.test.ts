import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeQueryBuilder } from '@/test/supabase-mock';

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
import { PATCH } from './route';

type SessionClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

const ASSESSMENT_ID = '22222222-2222-4222-8222-222222222222';

const noSession: SessionClient = {
  auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
} as unknown as SessionClient;

const signedInSession = (updateResult: { data: unknown; error: unknown }): SessionClient => {
  // makeQueryBuilder's object is itself thenable so query chains without
  // .single() can be awaited directly — but this whole object is the value
  // of `await createServerSupabaseClient()`, so its own .then would hijack
  // that await and unwrap straight to updateResult, dropping .auth. Delete
  // it before spreading (the route's chain always ends in .single()
  // anyway, which resolves independently of the builder's thenable-ness).
  const builder = makeQueryBuilder(updateResult) as Record<string, unknown>;
  delete builder.then;
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    ...builder,
  } as unknown as SessionClient;
};

const makeRequest = (body: unknown) =>
  new NextRequest(`http://localhost/api/assessments/${ASSESSMENT_ID}/sharing`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const callPatch = (body: unknown) => PATCH(makeRequest(body), { params: Promise.resolve({ id: ASSESSMENT_ID }) });

describe('PATCH /api/assessments/[id]/sharing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not signed in', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(noSession);
    const res = await callPatch({ shareEnabled: true, shareExpiry: 'never', organizationShared: false });
    expect(res.status).toBe(401);
  });

  it('rejects an invalid body', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      signedInSession({ data: null, error: null })
    );
    const res = await callPatch({ shareEnabled: 'yes' });
    expect(res.status).toBe(400);
  });

  it('updates share_enabled and clears share_expires_at for "never"', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      signedInSession({
        data: { id: ASSESSMENT_ID, share_enabled: true, share_expires_at: null, organization_id: null },
        error: null,
      })
    );

    const res = await callPatch({ shareEnabled: true, shareExpiry: 'never', organizationShared: false });
    expect(res.status).toBe(200);
    expect(ensureOrganizationForUser).not.toHaveBeenCalled();
    const json = await res.json();
    expect(json.assessment.share_expires_at).toBeNull();
  });

  it('lazily creates an organization when organizationShared is toggled on', async () => {
    vi.mocked(ensureOrganizationForUser).mockResolvedValue('org-1');
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      signedInSession({
        data: { id: ASSESSMENT_ID, share_enabled: true, share_expires_at: null, organization_id: 'org-1' },
        error: null,
      })
    );
    vi.mocked(createAdminSupabaseClient).mockReturnValue({} as unknown as ReturnType<typeof createAdminSupabaseClient>);

    const res = await callPatch({ shareEnabled: true, shareExpiry: 'never', organizationShared: true });
    expect(res.status).toBe(200);
    expect(ensureOrganizationForUser).toHaveBeenCalledWith(expect.anything(), 'user-1');
    const json = await res.json();
    expect(json.assessment.organization_id).toBe('org-1');
  });

  it('returns 404 when the update matches no row (not the owner)', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      signedInSession({ data: null, error: { message: 'no rows' } })
    );
    const res = await callPatch({ shareEnabled: false, shareExpiry: 'never', organizationShared: false });
    expect(res.status).toBe(404);
  });
});
