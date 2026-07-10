import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeQueryBuilder } from '@/test/supabase-mock';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(),
}));
vi.mock('@/lib/email/resend', () => ({
  getResendClient: vi.fn(() => null),
  isEmailConfigured: vi.fn(() => false),
  EMAIL_FROM: 'Darix AI <test@darix.ai>',
  TEAM_ALERT_EMAIL: '',
}));

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { POST } from './route';

const validPayload = {
  fullName: 'Jane Doe',
  workEmail: 'jane@example.com',
  companyName: 'Acme Corp',
  companySize: '1-50',
  challenge: 'We need help identifying high-ROI AI use cases for our team.',
};

const makeRequest = (body: unknown, ip = `10.0.0.${Math.floor(Math.random() * 1000)}`) =>
  new NextRequest('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });

describe('POST /api/contact', () => {
  beforeEach(() => {
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeQueryBuilder({ data: null, error: null }) as any
    );
  });

  it('rejects invalid payloads with field-level errors', async () => {
    const res = await POST(makeRequest({ fullName: '', workEmail: 'not-an-email', companyName: '', companySize: 'bogus', challenge: 'short' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.details.fieldErrors.fullName).toBeDefined();
    expect(json.details.fieldErrors.workEmail).toBeDefined();
    expect(json.details.fieldErrors.companySize).toBeDefined();
    expect(json.details.fieldErrors.challenge).toBeDefined();
  });

  it('rejects malformed JSON', async () => {
    const req = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.1.1.1' },
      body: '{not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('saves a valid lead and returns success', async () => {
    const res = await POST(makeRequest(validPayload));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(createAdminSupabaseClient).toHaveBeenCalled();
  });

  it('returns 500 when the database insert fails', async () => {
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeQueryBuilder({ data: null, error: { message: 'db down' } }) as any
    );
    const res = await POST(makeRequest(validPayload));
    expect(res.status).toBe(500);
  });

  it('rate limits after repeated requests from the same IP', async () => {
    const ip = '203.0.113.42';
    let lastStatus = 0;
    for (let i = 0; i < 6; i++) {
      const res = await POST(makeRequest(validPayload, ip));
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
