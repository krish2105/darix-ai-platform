import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeQueryBuilder } from '@/test/supabase-mock';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(),
}));
vi.mock('@/lib/tabby/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/tabby/client')>('@/lib/tabby/client');
  return {
    ...actual,
    isTabbyConfigured: vi.fn(() => true),
    createTabbyCheckoutSession: vi.fn(),
  };
});

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createTabbyCheckoutSession, isTabbyConfigured, TabbyNotEligibleError } from '@/lib/tabby/client';
import { POST } from './route';

const VALID_ID = '11111111-1111-4111-8111-111111111111';

const makeRequest = (body: unknown, ip = `10.0.4.${Math.floor(Math.random() * 1000)}`) =>
  new NextRequest('http://localhost/api/checkout/tabby', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });

describe('POST /api/checkout/tabby', () => {
  beforeEach(() => {
    vi.mocked(isTabbyConfigured).mockReturnValue(true);
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeQueryBuilder({ data: { id: VALID_ID, contact_email: 'jane@example.com' }, error: null }) as any
    );
    vi.mocked(createTabbyCheckoutSession).mockResolvedValue({
      paymentId: 'pay_123',
      webUrl: 'https://checkout.tabby.ai/session/pay_123',
    });
  });

  it('rejects a non-UUID assessmentId', async () => {
    const res = await POST(makeRequest({ assessmentId: 'not-a-uuid' }));
    expect(res.status).toBe(400);
  });

  it('returns 503 when Tabby is not configured', async () => {
    vi.mocked(isTabbyConfigured).mockReturnValue(false);
    const res = await POST(makeRequest({ assessmentId: VALID_ID }));
    expect(res.status).toBe(503);
  });

  it('returns 404 when the assessment does not exist', async () => {
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeQueryBuilder({ data: null, error: { message: 'not found' } }) as any
    );
    const res = await POST(makeRequest({ assessmentId: VALID_ID }));
    expect(res.status).toBe(404);
  });

  it('creates a Tabby checkout session and returns its web url', async () => {
    const res = await POST(makeRequest({ assessmentId: VALID_ID }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.url).toBe('https://checkout.tabby.ai/session/pay_123');
    expect(createTabbyCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ amountAed: 1999 })
    );
  });

  it('returns 422 when Tabby declines eligibility', async () => {
    vi.mocked(createTabbyCheckoutSession).mockRejectedValue(new TabbyNotEligibleError());
    const res = await POST(makeRequest({ assessmentId: VALID_ID }));
    expect(res.status).toBe(422);
  });

  it('returns 502 when Tabby session creation fails', async () => {
    vi.mocked(createTabbyCheckoutSession).mockRejectedValue(new Error('Tabby down'));
    const res = await POST(makeRequest({ assessmentId: VALID_ID }));
    expect(res.status).toBe(502);
  });
});
