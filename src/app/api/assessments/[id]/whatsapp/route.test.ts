import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeQueryBuilder } from '@/test/supabase-mock';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(),
}));
vi.mock('@/lib/whatsapp/client', () => ({
  isWhatsAppConfigured: vi.fn(() => true),
  sendWhatsAppMessage: vi.fn(),
}));

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { isWhatsAppConfigured, sendWhatsAppMessage } from '@/lib/whatsapp/client';
import { POST } from './route';

const VALID_ID = '11111111-1111-4111-8111-111111111111';

const makeRequest = (id: string, body: unknown, ip = `10.0.3.${Math.floor(Math.random() * 1000)}`) =>
  new NextRequest(`http://localhost/api/assessments/${id}/whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });

const call = (id: string, body: unknown, ip?: string) =>
  POST(makeRequest(id, body, ip), { params: Promise.resolve({ id }) });

describe('POST /api/assessments/[id]/whatsapp', () => {
  beforeEach(() => {
    vi.mocked(isWhatsAppConfigured).mockReturnValue(true);
    vi.mocked(sendWhatsAppMessage).mockResolvedValue(true);
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeQueryBuilder({ data: { company_name: 'Acme', result: { score: 72, level: 'Builder' } }, error: null }) as any
    );
  });

  it('returns 404 for a non-UUID id', async () => {
    const res = await call('not-a-uuid', { phone: '971501234567' });
    expect(res.status).toBe(404);
  });

  it('rejects an invalid phone number', async () => {
    const res = await call(VALID_ID, { phone: 'abc' });
    expect(res.status).toBe(400);
  });

  it('returns 503 when WhatsApp is not configured', async () => {
    vi.mocked(isWhatsAppConfigured).mockReturnValue(false);
    const res = await call(VALID_ID, { phone: '971501234567' });
    expect(res.status).toBe(503);
  });

  it('returns 404 when the assessment does not exist', async () => {
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeQueryBuilder({ data: null, error: { message: 'not found' } }) as any
    );
    const res = await call(VALID_ID, { phone: '971501234567' });
    expect(res.status).toBe(404);
  });

  it('sends the report and returns success for a valid phone number', async () => {
    const res = await call(VALID_ID, { phone: '+971 50 123 4567' });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(sendWhatsAppMessage).toHaveBeenCalledWith(
      expect.objectContaining({ to: '971501234567' })
    );
  });

  it('returns 502 when the WhatsApp send fails', async () => {
    vi.mocked(sendWhatsAppMessage).mockResolvedValue(false);
    const res = await call(VALID_ID, { phone: '971501234567' });
    expect(res.status).toBe(502);
  });

  it('rate limits after repeated requests from the same IP', async () => {
    const ip = '203.0.113.99';
    let lastStatus = 0;
    for (let i = 0; i < 6; i++) {
      const res = await call(VALID_ID, { phone: '971501234567' }, ip);
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
