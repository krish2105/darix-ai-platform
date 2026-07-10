import { describe, expect, it, vi, beforeEach } from 'vitest';
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

const anonymousSession = {
  auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
};

const signedInSession = {
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1', email: 'jane@example.com', created_at: '2026-01-01T00:00:00.000Z' } },
    }),
  },
};

describe('GET /api/account/export', () => {
  it('returns 401 when not signed in', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      anonymousSession as any
    );
    const res = await GET();
    expect(res.status).toBe(401);
  });

  describe('when signed in', () => {
    beforeEach(() => {
      vi.mocked(createServerSupabaseClient).mockResolvedValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signedInSession as any
      );
    });

    it('returns a downloadable JSON export of the user\'s assessments', async () => {
      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        makeQueryBuilder({
          data: [{ id: 'a1', company_name: 'Acme', contact_name: null, contact_email: null, answers: {}, result: {}, tier: 'free', created_at: '2026-01-02T00:00:00.000Z' }],
          error: null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any
      );

      const res = await GET();
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Disposition')).toContain('darix-my-data.json');

      const json = await res.json();
      expect(json.account.email).toBe('jane@example.com');
      expect(json.assessments).toHaveLength(1);
    });

    it('returns 500 when the database query fails', async () => {
      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        makeQueryBuilder({ data: null, error: { message: 'db down' } }) as any
      );
      const res = await GET();
      expect(res.status).toBe(500);
    });
  });
});
