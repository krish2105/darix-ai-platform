import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeQueryBuilder } from '@/test/supabase-mock';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(),
}));
vi.mock('@/lib/email/resend', () => ({
  getResendClient: vi.fn(),
  isEmailConfigured: vi.fn(() => true),
  EMAIL_FROM: 'Darix AI <test@darix.ai>',
}));

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getResendClient, isEmailConfigured } from '@/lib/email/resend';
import { POST } from './route';

const VALID_ID = '11111111-1111-4111-8111-111111111111';

const makeRequest = (id: string, body: unknown, ip = `10.0.5.${Math.floor(Math.random() * 1000)}`) =>
  new NextRequest(`http://localhost/api/assessments/${id}/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });

const call = (id: string, body: unknown, ip?: string) =>
  POST(makeRequest(id, body, ip), { params: Promise.resolve({ id }) });

describe('POST /api/assessments/[id]/email', () => {
  beforeEach(() => {
    vi.mocked(isEmailConfigured).mockReturnValue(true);
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeQueryBuilder({ data: { company_name: 'Acme', result: { score: 72, level: 'Builder' } }, error: null }) as any
    );
    vi.mocked(getResendClient).mockReturnValue({
      emails: { send: vi.fn().mockResolvedValue({ error: null }) },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  it('returns 404 for a non-UUID id', async () => {
    const res = await call('not-a-uuid', { email: 'jane@example.com' });
    expect(res.status).toBe(404);
  });

  it('rejects an invalid email address', async () => {
    const res = await call(VALID_ID, { email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  it('returns 503 when email delivery is not configured', async () => {
    vi.mocked(isEmailConfigured).mockReturnValue(false);
    const res = await call(VALID_ID, { email: 'jane@example.com' });
    expect(res.status).toBe(503);
  });

  it('returns 404 when the assessment does not exist', async () => {
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeQueryBuilder({ data: null, error: { message: 'not found' } }) as any
    );
    const res = await call(VALID_ID, { email: 'jane@example.com' });
    expect(res.status).toBe(404);
  });

  it('sends the report and returns success for a valid email', async () => {
    const res = await call(VALID_ID, { email: 'jane@example.com' });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('returns 502 when the email send fails', async () => {
    vi.mocked(getResendClient).mockReturnValue({
      emails: { send: vi.fn().mockResolvedValue({ error: { message: 'send failed' } }) },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    const res = await call(VALID_ID, { email: 'jane@example.com' });
    expect(res.status).toBe(502);
  });

  it('rate limits after repeated requests from the same IP', async () => {
    const ip = '203.0.113.55';
    let lastStatus = 0;
    for (let i = 0; i < 6; i++) {
      const res = await call(VALID_ID, { email: 'jane@example.com' }, ip);
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
