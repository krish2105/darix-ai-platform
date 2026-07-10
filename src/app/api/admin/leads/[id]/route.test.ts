import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeQueryBuilder } from '@/test/supabase-mock';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(),
}));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PATCH } from './route';

const LEAD_ID = '22222222-2222-4222-8222-222222222222';
const originalAdminEmails = process.env.ADMIN_EMAILS;

const sessionWithEmail = (email: string | null) => ({
  auth: { getUser: vi.fn().mockResolvedValue({ data: { user: email ? { email } : null } }) },
});

const makeRequest = (body: unknown) =>
  new NextRequest(`http://localhost/api/admin/leads/${LEAD_ID}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const callPatch = (body: unknown) => PATCH(makeRequest(body), { params: Promise.resolve({ id: LEAD_ID }) });

describe('PATCH /api/admin/leads/[id]', () => {
  beforeEach(() => {
    process.env.ADMIN_EMAILS = 'admin@darix.ai';
  });

  afterEach(() => {
    process.env.ADMIN_EMAILS = originalAdminEmails;
  });

  it('returns 403 when not signed in', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sessionWithEmail(null) as any
    );
    const res = await callPatch({ status: 'contacted' });
    expect(res.status).toBe(403);
  });

  it('returns 403 for a signed-in non-admin email', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sessionWithEmail('someone@else.com') as any
    );
    const res = await callPatch({ status: 'contacted' });
    expect(res.status).toBe(403);
  });

  describe('as an admin', () => {
    beforeEach(() => {
      vi.mocked(createServerSupabaseClient).mockResolvedValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sessionWithEmail('admin@darix.ai') as any
      );
    });

    it('rejects an invalid status value', async () => {
      const res = await callPatch({ status: 'bogus' });
      expect(res.status).toBe(400);
    });

    it('rejects an empty update', async () => {
      const res = await callPatch({});
      expect(res.status).toBe(400);
    });

    it('updates status and notes', async () => {
      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        makeQueryBuilder({
          data: { id: LEAD_ID, status: 'qualified', notes: 'Interested in Pro tier', updated_at: '2026-07-10T00:00:00.000Z' },
          error: null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any
      );
      const res = await callPatch({ status: 'qualified', notes: 'Interested in Pro tier' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.lead.status).toBe('qualified');
    });

    it('returns 500 when the update fails', async () => {
      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        makeQueryBuilder({ data: null, error: { message: 'db down' } }) as any
      );
      const res = await callPatch({ status: 'won' });
      expect(res.status).toBe(500);
    });
  });
});
