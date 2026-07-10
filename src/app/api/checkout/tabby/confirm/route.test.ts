import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeQueryBuilder } from '@/test/supabase-mock';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(),
}));
vi.mock('@/lib/tabby/client', () => ({
  retrieveTabbyPayment: vi.fn(),
  captureTabbyPayment: vi.fn(),
}));
vi.mock('@/lib/email/resend', () => ({
  getResendClient: vi.fn(() => null),
  isEmailConfigured: vi.fn(() => false),
  EMAIL_FROM: 'Darix AI <test@darix.ai>',
}));
vi.mock('@/lib/whatsapp/client', () => ({
  alertTeamOnWhatsApp: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/analytics/posthog-server', () => ({
  captureServerEvent: vi.fn(),
}));

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { captureTabbyPayment, retrieveTabbyPayment } from '@/lib/tabby/client';
import { GET } from './route';

const VALID_ID = '11111111-1111-4111-8111-111111111111';

const makeRequest = (params: Record<string, string>) =>
  new NextRequest(`http://localhost/api/checkout/tabby/confirm?${new URLSearchParams(params)}`);

describe('GET /api/checkout/tabby/confirm', () => {
  beforeEach(() => {
    vi.mocked(retrieveTabbyPayment).mockResolvedValue({ status: 'AUTHORIZED', authorized: true, amountAed: 1999 });
    vi.mocked(captureTabbyPayment).mockResolvedValue(true);
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeQueryBuilder({ data: { id: VALID_ID, company_name: 'Acme', contact_email: 'jane@example.com' }, error: null }) as any
    );
  });

  it('redirects to the report with upgraded=1 on a successful authorized + captured payment', async () => {
    const res = await GET(makeRequest({ assessmentId: VALID_ID, payment_id: 'pay_123' }));
    expect(res.status).toBe(307);
    const location = res.headers.get('location')!;
    expect(location).toContain(`/report/${VALID_ID}`);
    expect(location).toContain('upgraded=1');
  });

  it('redirects declined when the payment is not authorized', async () => {
    vi.mocked(retrieveTabbyPayment).mockResolvedValue({ status: 'REJECTED', authorized: false, amountAed: 1999 });
    const res = await GET(makeRequest({ assessmentId: VALID_ID, payment_id: 'pay_123' }));
    const location = res.headers.get('location')!;
    expect(location).toContain('upgrade_declined=1');
  });

  it('redirects declined when capture fails', async () => {
    vi.mocked(captureTabbyPayment).mockResolvedValue(false);
    const res = await GET(makeRequest({ assessmentId: VALID_ID, payment_id: 'pay_123' }));
    const location = res.headers.get('location')!;
    expect(location).toContain('upgrade_declined=1');
  });

  it('redirects declined when payment_id is missing', async () => {
    const res = await GET(makeRequest({ assessmentId: VALID_ID }));
    const location = res.headers.get('location')!;
    expect(location).toContain('upgrade_declined=1');
  });

  it('redirects home when assessmentId is missing', async () => {
    const res = await GET(makeRequest({ payment_id: 'pay_123' }));
    const location = res.headers.get('location')!;
    expect(location.endsWith('/')).toBe(true);
  });
});
