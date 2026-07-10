import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeQueryBuilder } from '@/test/supabase-mock';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(),
}));

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { POST } from './route';

const validPayload = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  requestType: 'access',
  details: 'Please send a copy of my assessment data.',
};

const makeRequest = (body: unknown, ip = `10.3.0.${Math.floor(Math.random() * 1000)}`) =>
  new NextRequest('http://localhost/api/privacy/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });

describe('POST /api/privacy/request', () => {
  beforeEach(() => {
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeQueryBuilder({ data: null, error: null }) as any
    );
  });

  it('rejects invalid payloads with field-level errors', async () => {
    const res = await POST(makeRequest({ fullName: '', email: 'not-an-email', requestType: 'bogus' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.details.fieldErrors.fullName).toBeDefined();
    expect(json.details.fieldErrors.email).toBeDefined();
    expect(json.details.fieldErrors.requestType).toBeDefined();
  });

  it('rejects malformed JSON', async () => {
    const req = new NextRequest('http://localhost/api/privacy/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.3.1.1' },
      body: '{not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('saves a valid erasure request and returns success', async () => {
    const res = await POST(makeRequest({ ...validPayload, requestType: 'erasure' }));
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
    const ip = '203.0.113.77';
    let lastStatus = 0;
    for (let i = 0; i < 6; i++) {
      const res = await POST(makeRequest(validPayload, ip));
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
