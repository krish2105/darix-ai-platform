import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeQueryBuilder } from '@/test/supabase-mock';

vi.mock('@/lib/telr/client', () => ({
  checkTelrOrder: vi.fn(),
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

import { checkTelrOrder } from '@/lib/telr/client';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { GET } from './route';

const VALID_ID = '11111111-1111-4111-8111-111111111111';

const makeRequest = (query: string) =>
  new NextRequest(`http://localhost/api/checkout/telr/confirm${query}`);

describe('GET /api/checkout/telr/confirm', () => {
  beforeEach(() => {
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      makeQueryBuilder({
        data: { id: VALID_ID, company_name: 'Acme', contact_email: null },
        error: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any
    );
  });

  it('redirects home when assessmentId is missing', async () => {
    const res = await GET(makeRequest('?tier=pro&OrderRef=ref1'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/');
  });

  it('redirects declined when the order reference is missing', async () => {
    const res = await GET(makeRequest(`?assessmentId=${VALID_ID}&tier=pro`));
    expect(res.headers.get('location')).toContain('upgrade_declined=1');
  });

  it('redirects declined when Telr reports the order as unpaid', async () => {
    vi.mocked(checkTelrOrder).mockResolvedValue({ paid: false, statusCode: -2, statusText: 'Cancelled' });
    const res = await GET(makeRequest(`?assessmentId=${VALID_ID}&tier=pro&OrderRef=ref1`));
    expect(res.headers.get('location')).toContain('upgrade_declined=1');
  });

  it('unlocks the tier and redirects to the success url when Telr confirms payment', async () => {
    vi.mocked(checkTelrOrder).mockResolvedValue({ paid: true, statusCode: 3, statusText: 'Paid' });
    const res = await GET(makeRequest(`?assessmentId=${VALID_ID}&tier=pro&OrderRef=ref1`));
    expect(res.headers.get('location')).toContain(`/report/${VALID_ID}`);
    expect(res.headers.get('location')).toContain('upgraded=1');
  });

  it('redirects declined when the Telr check call throws', async () => {
    vi.mocked(checkTelrOrder).mockRejectedValue(new Error('network error'));
    const res = await GET(makeRequest(`?assessmentId=${VALID_ID}&tier=pro&OrderRef=ref1`));
    expect(res.headers.get('location')).toContain('upgrade_declined=1');
  });
});
