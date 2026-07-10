import { describe, expect, it, vi, beforeEach } from 'vitest';
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
import { POST } from './route';

const makeRequest = (body: unknown, ip = `10.0.1.${Math.floor(Math.random() * 1000)}`) =>
  new NextRequest('http://localhost/api/assessments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });

const anonymousSession = {
  auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
};

describe('POST /api/assessments', () => {
  beforeEach(() => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      anonymousSession as any
    );
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeQueryBuilder({ data: { id: 'fake-assessment-id' }, error: null }) as any
    );
  });

  it('rejects a payload with out-of-range answer values', async () => {
    const res = await POST(makeRequest({ answers: { q1: 99 } }));
    expect(res.status).toBe(400);
  });

  it('rejects malformed JSON', async () => {
    const req = new NextRequest('http://localhost/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.2.2.2' },
      body: '{bad',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('recomputes the score server-side rather than trusting a client-supplied result', async () => {
    // 24 questions answered at the maximum (5) should score 100 regardless
    // of what a tampered client claims.
    const answers = Object.fromEntries(
      Array.from({ length: 24 }, (_, i) => [`q${i + 1}`, 5])
    );
    const res = await POST(makeRequest({ answers, result: { score: 1, level: 'tampered' } }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.result.score).toBe(100);
    expect(json.result.level).toBe('AI Leader');
    expect(json.id).toBe('fake-assessment-id');
  });

  it('saves anonymous assessments (no signed-in user) without a user_id error', async () => {
    const res = await POST(makeRequest({ answers: { q1: 3 } }));
    expect(res.status).toBe(201);
  });

  it('returns 500 when the database insert fails', async () => {
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeQueryBuilder({ data: null, error: { message: 'db down' } }) as any
    );
    const res = await POST(makeRequest({ answers: { q1: 3 } }));
    expect(res.status).toBe(500);
  });

  it('rate limits after repeated requests from the same IP', async () => {
    const ip = '203.0.113.99';
    let lastStatus = 0;
    for (let i = 0; i < 11; i++) {
      const res = await POST(makeRequest({ answers: { q1: 3 } }, ip));
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
