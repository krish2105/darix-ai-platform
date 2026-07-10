import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeQueryBuilder } from '@/test/supabase-mock';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(),
}));

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { POST } from './route';

const validPayload = {
  organizationName: 'Acme Consulting',
  contactName: 'Jane Doe',
  contactEmail: 'jane@acme-consulting.com',
  partnerType: 'consultancy',
  message: 'We advise mid-market UAE retailers and would like to refer clients.',
};

const makeRequest = (body: unknown, ip = `10.4.0.${Math.floor(Math.random() * 1000)}`) =>
  new NextRequest('http://localhost/api/partners/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });

describe('POST /api/partners/apply', () => {
  beforeEach(() => {
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeQueryBuilder({ data: null, error: null }) as any
    );
  });

  it('rejects invalid payloads with field-level errors', async () => {
    const res = await POST(makeRequest({ organizationName: '', contactName: '', contactEmail: 'nope', partnerType: 'bogus' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.details.fieldErrors.organizationName).toBeDefined();
    expect(json.details.fieldErrors.contactName).toBeDefined();
    expect(json.details.fieldErrors.contactEmail).toBeDefined();
    expect(json.details.fieldErrors.partnerType).toBeDefined();
  });

  it('rejects malformed JSON', async () => {
    const req = new NextRequest('http://localhost/api/partners/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.4.1.1' },
      body: '{not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('saves a valid application and returns success', async () => {
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
    const ip = '203.0.113.201';
    let lastStatus = 0;
    for (let i = 0; i < 6; i++) {
      const res = await POST(makeRequest(validPayload, ip));
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
