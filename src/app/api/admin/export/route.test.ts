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
import { GET } from './route';

const originalAdminEmails = process.env.ADMIN_EMAILS;

const sessionWithEmail = (email: string | null) =>
  ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: email ? { email } : null } }) },
  }) as unknown as Awaited<ReturnType<typeof createServerSupabaseClient>>;

const call = (query: string) => GET(new NextRequest(`http://localhost/api/admin/export${query}`));

describe('GET /api/admin/export', () => {
  beforeEach(() => {
    process.env.ADMIN_EMAILS = 'admin@darix.ai';
  });

  afterEach(() => {
    process.env.ADMIN_EMAILS = originalAdminEmails;
    vi.clearAllMocks();
  });

  it('returns 403 when not signed in', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(sessionWithEmail(null));
    const res = await call('?type=leads');
    expect(res.status).toBe(403);
  });

  it('returns 403 for a signed-in non-admin email', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(sessionWithEmail('someone@else.com'));
    const res = await call('?type=leads');
    expect(res.status).toBe(403);
  });

  describe('as an admin', () => {
    beforeEach(() => {
      vi.mocked(createServerSupabaseClient).mockResolvedValue(sessionWithEmail('admin@darix.ai'));
    });

    it('rejects a missing or invalid type', async () => {
      const res = await call('');
      expect(res.status).toBe(400);
      const res2 = await call('?type=bogus');
      expect(res2.status).toBe(400);
    });

    it('streams a leads CSV', async () => {
      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        makeQueryBuilder({
          data: [
            {
              id: 'lead-1',
              full_name: 'Jane Doe',
              work_email: 'jane@co.com',
              company_name: 'Co',
              company_size: '1-50',
              challenge: 'Need AI',
              status: 'new',
              notes: null,
              created_at: '2026-07-10T00:00:00.000Z',
            },
          ],
          error: null,
        }) as unknown as ReturnType<typeof createAdminSupabaseClient>
      );

      const res = await call('?type=leads');
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('text/csv');
      expect(res.headers.get('Content-Disposition')).toContain('darix-leads.csv');
      const text = await res.text();
      expect(text).toContain('Jane Doe');
      expect(text.startsWith('id,full_name,')).toBe(true);
    });

    it('streams an assessments CSV, flattening the result JSON into score/level columns', async () => {
      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        makeQueryBuilder({
          data: [
            {
              id: 'assessment-1',
              company_name: 'Co',
              contact_name: 'Jane',
              contact_email: 'jane@co.com',
              industry: 'retail',
              company_size: '1-50',
              tier: 'free',
              result: { score: 72, level: 'Advancing' },
              created_at: '2026-07-10T00:00:00.000Z',
            },
          ],
          error: null,
        }) as unknown as ReturnType<typeof createAdminSupabaseClient>
      );

      const res = await call('?type=assessments');
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Disposition')).toContain('darix-assessments.csv');
      const text = await res.text();
      expect(text).toContain('72');
      expect(text).toContain('Advancing');
    });

    it('returns 500 when the query fails', async () => {
      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        makeQueryBuilder({ data: null, error: { message: 'db down' } }) as unknown as ReturnType<
          typeof createAdminSupabaseClient
        >
      );
      const res = await call('?type=leads');
      expect(res.status).toBe(500);
    });
  });
});
