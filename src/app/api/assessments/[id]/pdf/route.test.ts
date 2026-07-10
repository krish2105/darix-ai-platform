import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeQueryBuilder } from '@/test/supabase-mock';
import { calculateReadiness } from '@/utils/scoring';
import { dimensions } from '@/data/questions';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(),
}));

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { GET } from './route';

const VALID_ID = '11111111-1111-4111-8111-111111111111';
const allQuestionIds = dimensions.flatMap((d) => d.questions.map((q) => q.id));
const result = calculateReadiness(Object.fromEntries(allQuestionIds.map((id, i) => [id, i % 6])));

const call = (id: string, query = '') =>
  GET(new NextRequest(`http://localhost/api/assessments/${id}/pdf${query}`), {
    params: Promise.resolve({ id }),
  });

// Real @react-pdf/renderer render (not mocked), same rationale as
// src/lib/pdf/ReadinessReportDocument.test.tsx — this is the route that
// carries the Arabic-font/locale logic that already caused one real
// regression (the e2e download-route mock missing the ?locale= param).
describe('GET /api/assessments/[id]/pdf', () => {
  beforeEach(() => {
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      makeQueryBuilder({
        data: { company_name: 'Acme Corp', result, created_at: '2026-07-10T00:00:00.000Z' },
        error: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any
    );
  });

  it('returns 404 for a non-UUID id', async () => {
    const res = await call('not-a-uuid');
    expect(res.status).toBe(404);
  });

  it('returns 404 when the assessment does not exist', async () => {
    vi.mocked(createAdminSupabaseClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeQueryBuilder({ data: null, error: { message: 'not found' } }) as any
    );
    const res = await call(VALID_ID);
    expect(res.status).toBe(404);
  });

  it('renders a real English PDF by default', async () => {
    const res = await call(VALID_ID);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain(`darix-ai-readiness-report-${VALID_ID.slice(0, 8)}.pdf`);
    const buffer = await res.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });

  it('renders a real Arabic PDF when ?locale=ar is set', async () => {
    const res = await call(VALID_ID, '?locale=ar');
    expect(res.status).toBe(200);
    const buffer = await res.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });

  it('falls back to English for any locale value other than "ar"', async () => {
    const res = await call(VALID_ID, '?locale=fr');
    expect(res.status).toBe(200);
  });
});
