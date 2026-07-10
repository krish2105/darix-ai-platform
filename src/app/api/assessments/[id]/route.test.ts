import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { makeQueryBuilder } from '@/test/supabase-mock';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(),
}));

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { GET } from './route';

const VALID_ID = '11111111-1111-4111-8111-111111111111';

const call = (id: string) =>
  GET(new NextRequest(`http://localhost/api/assessments/${id}`), { params: Promise.resolve({ id }) });

describe('GET /api/assessments/[id]', () => {
  it('returns 404 for a non-UUID id', async () => {
    const res = await call('not-a-uuid');
    expect(res.status).toBe(404);
  });

  it('returns 404 when the assessment does not exist', async () => {
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeQueryBuilder({ data: null, error: { message: 'not found' } }) as any
    );
    const res = await call(VALID_ID);
    expect(res.status).toBe(404);
  });

  it('returns the shareable report fields for a valid id', async () => {
    const row = {
      id: VALID_ID,
      company_name: 'Acme',
      contact_name: 'Jane Doe',
      result: { score: 72, level: 'Builder' },
      tier: 'pro',
      created_at: '2026-01-01T00:00:00.000Z',
    };
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeQueryBuilder({ data: row, error: null }) as any
    );
    const res = await call(VALID_ID);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      id: VALID_ID,
      companyName: 'Acme',
      contactName: 'Jane Doe',
      result: { score: 72, level: 'Builder' },
      tier: 'pro',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });
});
