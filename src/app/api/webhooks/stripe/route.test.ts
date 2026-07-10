import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/stripe/client', () => ({
  getStripeClient: vi.fn(),
}));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(),
}));
vi.mock('@/lib/email/resend', () => ({
  getResendClient: vi.fn(() => null),
  isEmailConfigured: vi.fn(() => false),
  EMAIL_FROM: 'Darix AI <test@darix.ai>',
}));
vi.mock('@/lib/analytics/posthog-server', () => ({
  captureServerEvent: vi.fn(),
}));

import { getStripeClient } from '@/lib/stripe/client';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { POST } from './route';

const ASSESSMENT_ID = '33333333-3333-4333-8333-333333333333';

const makeStripeEvent = (eventId: string) => ({
  id: eventId,
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_123',
      metadata: { assessmentId: ASSESSMENT_ID, tier: 'pro' },
      customer_details: { email: 'jane@example.com' },
    },
  },
});

const makeAdminClient = (opts: {
  insertError?: { code?: string; message: string } | null;
  assessmentData?: unknown;
  assessmentError?: unknown;
}) => ({
  from: vi.fn((table: string) => {
    if (table === 'processed_webhook_events') {
      return { insert: vi.fn(() => Promise.resolve({ error: opts.insertError ?? null })) };
    }
    if (table === 'assessments') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const builder: any = {};
      builder.update = vi.fn(() => builder);
      builder.eq = vi.fn(() => builder);
      builder.select = vi.fn(() => builder);
      builder.single = vi.fn(() =>
        Promise.resolve({ data: opts.assessmentData ?? null, error: opts.assessmentError ?? null })
      );
      return builder;
    }
    throw new Error(`Unexpected table: ${table}`);
  }),
});

const makeRequest = (body: string, signature: string | null = 'sig_test') =>
  new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers: signature ? { 'stripe-signature': signature } : {},
    body,
  });

describe('POST /api/webhooks/stripe', () => {
  const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  });

  it('returns 503 when Stripe is not configured', async () => {
    vi.mocked(getStripeClient).mockReturnValue(null);
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(503);
    process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
  });

  it('returns 400 when the stripe-signature header is missing', async () => {
    vi.mocked(getStripeClient).mockReturnValue({
      webhooks: { constructEvent: vi.fn() },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    const res = await POST(makeRequest('{}', null));
    expect(res.status).toBe(400);
  });

  it('returns 400 when signature verification fails', async () => {
    vi.mocked(getStripeClient).mockReturnValue({
      webhooks: {
        constructEvent: vi.fn(() => {
          throw new Error('bad signature');
        }),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(400);
  });

  describe('with a valid signature', () => {
    it('unlocks the tier on first delivery of an event', async () => {
      const event = makeStripeEvent('evt_first_1');
      vi.mocked(getStripeClient).mockReturnValue({
        webhooks: { constructEvent: vi.fn(() => event) },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      const admin = makeAdminClient({
        insertError: null,
        assessmentData: { id: ASSESSMENT_ID, company_name: 'Acme', contact_email: null },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(createAdminSupabaseClient).mockReturnValue(admin as any);

      const res = await POST(makeRequest(JSON.stringify(event)));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.received).toBe(true);
      expect(json.duplicate).toBeUndefined();
      expect(admin.from).toHaveBeenCalledWith('assessments');
    });

    it('skips reprocessing a redelivered event (duplicate event id)', async () => {
      const event = makeStripeEvent('evt_duplicate_1');
      vi.mocked(getStripeClient).mockReturnValue({
        webhooks: { constructEvent: vi.fn(() => event) },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      const admin = makeAdminClient({ insertError: { code: '23505', message: 'duplicate key' } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(createAdminSupabaseClient).mockReturnValue(admin as any);

      const res = await POST(makeRequest(JSON.stringify(event)));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.duplicate).toBe(true);
      expect(admin.from).not.toHaveBeenCalledWith('assessments');
    });

    it('still processes the event if recording the event id fails for a non-duplicate reason', async () => {
      const event = makeStripeEvent('evt_db_hiccup_1');
      vi.mocked(getStripeClient).mockReturnValue({
        webhooks: { constructEvent: vi.fn(() => event) },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      const admin = makeAdminClient({
        insertError: { message: 'connection reset' },
        assessmentData: { id: ASSESSMENT_ID, company_name: 'Acme', contact_email: null },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(createAdminSupabaseClient).mockReturnValue(admin as any);

      const res = await POST(makeRequest(JSON.stringify(event)));
      expect(res.status).toBe(200);
      expect(admin.from).toHaveBeenCalledWith('assessments');
    });
  });
});
