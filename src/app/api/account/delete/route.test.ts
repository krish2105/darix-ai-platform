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
import { POST } from './route';

const anonymousSession = {
  auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
};

const signedInSession = {
  auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'jane@example.com' } } }) },
};

const makeAdminClient = (
  deleteAssessmentsResult: { data: null; error: unknown },
  deleteUserResult: { error: unknown }
) => {
  const queryBuilder = makeQueryBuilder(deleteAssessmentsResult);
  return {
    ...queryBuilder,
    auth: { admin: { deleteUser: vi.fn().mockResolvedValue(deleteUserResult) } },
  };
};

describe('POST /api/account/delete', () => {
  it('returns 401 when not signed in', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      anonymousSession as any
    );
    const res = await POST();
    expect(res.status).toBe(401);
  });

  describe('when signed in', () => {
    beforeEach(() => {
      vi.mocked(createServerSupabaseClient).mockResolvedValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signedInSession as any
      );
    });

    it('deletes the user\'s assessments and auth account', async () => {
      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        makeAdminClient({ data: null, error: null }, { error: null }) as any
      );
      const res = await POST();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it('returns 500 without deleting the account when assessment deletion fails', async () => {
      const admin = makeAdminClient({ data: null, error: { message: 'db down' } }, { error: null });
      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        admin as any
      );
      const res = await POST();
      expect(res.status).toBe(500);
      expect(admin.auth.admin.deleteUser).not.toHaveBeenCalled();
    });

    it('returns 500 with a partial-completion message when auth account deletion fails', async () => {
      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        makeAdminClient({ data: null, error: null }, { error: { message: 'auth down' } }) as any
      );
      const res = await POST();
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toMatch(/assessments were deleted/i);
    });
  });
});
