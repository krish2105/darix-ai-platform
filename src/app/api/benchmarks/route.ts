import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { industries } from '@/data/industries';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import type { ReadinessResult } from '@/utils/scoring';

// Anonymized industry benchmarking — "how does your score compare to
// other UAE businesses in your industry." Never fabricates a number: below
// MIN_SAMPLE_SIZE real assessments for an industry, it returns
// available: false rather than a statistically meaningless average. No
// individual assessment data is ever returned, only the aggregate.
const MIN_SAMPLE_SIZE = 5;

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limitResult = await rateLimit(`benchmarks:get:${ip}`, { limit: 30, windowMs: 60_000 });
  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429 }
    );
  }

  const industryId = request.nextUrl.searchParams.get('industry');
  if (!industryId || !industries.some((i) => i.id === industryId)) {
    return NextResponse.json({ error: 'Unknown or missing industry.' }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('assessments')
    .select('result')
    .eq('industry', industryId);

  if (error) {
    console.error('Failed to load benchmark data', error);
    return NextResponse.json({ error: 'Could not load benchmark data.' }, { status: 500 });
  }

  const scores = (data ?? [])
    .map((row) => (row.result as ReadinessResult)?.score)
    .filter((score): score is number => typeof score === 'number');

  if (scores.length < MIN_SAMPLE_SIZE) {
    return NextResponse.json({ available: false, sampleSize: scores.length });
  }

  const averageScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
  return NextResponse.json({ available: true, averageScore, sampleSize: scores.length });
}
