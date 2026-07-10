import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeQueryBuilder } from '@/test/supabase-mock';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(),
}));
vi.mock('@/lib/stripe/client', () => ({
  isStripeConfigured: vi.fn(() => true),
  getStripeClient: vi.fn(),
}));
vi.mock('@/lib/telr/client', () => ({
  isTelrConfigured: vi.fn(() => false),
  createTelrOrder: vi.fn(),
}));

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getStripeClient, isStripeConfigured } from '@/lib/stripe/client';
import { createTelrOrder, isTelrConfigured } from '@/lib/telr/client';
import { POST } from './route';

const VALID_ID = '11111111-1111-4111-8111-111111111111';

const makeRequest = (body: unknown, ip = `10.0.2.${Math.floor(Math.random() * 1000)}`) =>
  new NextRequest('http://localhost/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });

describe('POST /api/checkout', () => {
  beforeEach(() => {
    vi.mocked(isStripeConfigured).mockReturnValue(true);
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeQueryBuilder({ data: { id: VALID_ID, tier: 'free' }, error: null }) as any
    );
    vi.mocked(getStripeClient).mockReturnValue({
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test-session' }),
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  it('rejects an invalid tier', async () => {
    const res = await POST(makeRequest({ assessmentId: VALID_ID, tier: 'enterprise' }));
    expect(res.status).toBe(400);
  });

  it('rejects a non-UUID assessmentId', async () => {
    const res = await POST(makeRequest({ assessmentId: 'not-a-uuid', tier: 'pro' }));
    expect(res.status).toBe(400);
  });

  it('returns 503 when Stripe is not configured', async () => {
    vi.mocked(isStripeConfigured).mockReturnValue(false);
    const res = await POST(makeRequest({ assessmentId: VALID_ID, tier: 'pro' }));
    expect(res.status).toBe(503);
  });

  it('returns 404 when the assessment does not exist', async () => {
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeQueryBuilder({ data: null, error: { message: 'not found' } }) as any
    );
    const res = await POST(makeRequest({ assessmentId: VALID_ID, tier: 'pro' }));
    expect(res.status).toBe(404);
  });

  it('creates a checkout session and returns its url for a valid pro request', async () => {
    const res = await POST(makeRequest({ assessmentId: VALID_ID, tier: 'pro' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.url).toBe('https://checkout.stripe.com/test-session');
  });

  it('creates a checkout session for the business tier', async () => {
    const res = await POST(makeRequest({ assessmentId: VALID_ID, tier: 'business' }));
    expect(res.status).toBe(200);
  });
});

describe('POST /api/checkout with PAYMENT_PROVIDER=telr', () => {
  const originalProvider = process.env.PAYMENT_PROVIDER;

  beforeEach(() => {
    process.env.PAYMENT_PROVIDER = 'telr';
    vi.mocked(isTelrConfigured).mockReturnValue(true);
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeQueryBuilder({ data: { id: VALID_ID, tier: 'free' }, error: null }) as any
    );
    vi.mocked(createTelrOrder).mockResolvedValue({
      ref: 'telr-ref-123',
      url: 'https://secure.telr.com/gateway/process.html?o=telr-ref-123',
    });
  });

  afterEach(() => {
    process.env.PAYMENT_PROVIDER = originalProvider;
  });

  it('returns 503 when Telr is not configured', async () => {
    vi.mocked(isTelrConfigured).mockReturnValue(false);
    const res = await POST(makeRequest({ assessmentId: VALID_ID, tier: 'pro' }));
    expect(res.status).toBe(503);
  });

  it('creates a Telr order and returns its hosted payment page url', async () => {
    const res = await POST(makeRequest({ assessmentId: VALID_ID, tier: 'pro' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.url).toBe('https://secure.telr.com/gateway/process.html?o=telr-ref-123');
    expect(createTelrOrder).toHaveBeenCalledWith(
      expect.objectContaining({ amountAed: 499, description: 'Professional Report' })
    );
  });

  it('returns 502 when Telr order creation fails', async () => {
    vi.mocked(createTelrOrder).mockRejectedValue(new Error('Telr down'));
    const res = await POST(makeRequest({ assessmentId: VALID_ID, tier: 'pro' }));
    expect(res.status).toBe(502);
  });
});
