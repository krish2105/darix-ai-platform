import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { makeQueryBuilder } from '@/test/supabase-mock';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(),
}));

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { GET } from './route';

const call = (query: string, ip = `10.0.6.${Math.floor(Math.random() * 1000)}`) =>
  GET(new NextRequest(`http://localhost/api/benchmarks${query}`, { headers: { 'x-forwarded-for': ip } }));

describe('GET /api/benchmarks', () => {
  it('rejects a missing industry param', async () => {
    const res = await call('');
    expect(res.status).toBe(400);
  });

  it('rejects an unknown industry id', async () => {
    const res = await call('?industry=not-a-real-industry');
    expect(res.status).toBe(400);
  });

  it('returns available: false below the minimum sample size', async () => {
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      makeQueryBuilder({
        data: [{ result: { score: 50 } }, { result: { score: 60 } }],
        error: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any
    );
    const res = await call('?industry=finance');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ available: false, sampleSize: 2 });
  });

  it('returns a real average at or above the minimum sample size', async () => {
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      makeQueryBuilder({
        data: [
          { result: { score: 40 } },
          { result: { score: 50 } },
          { result: { score: 60 } },
          { result: { score: 70 } },
          { result: { score: 80 } },
        ],
        error: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any
    );
    const res = await call('?industry=finance');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ available: true, averageScore: 60, sampleSize: 5 });
  });

  it('returns 500 when the query fails', async () => {
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeQueryBuilder({ data: null, error: { message: 'db down' } }) as any
    );
    const res = await call('?industry=finance');
    expect(res.status).toBe(500);
  });

  it('rate limits after repeated requests from the same IP', async () => {
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeQueryBuilder({ data: [], error: null }) as any
    );
    const ip = '203.0.113.77';
    let lastStatus = 0;
    for (let i = 0; i < 31; i++) {
      const res = await call('?industry=finance', ip);
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
