import { leadStatusOptions } from '@/lib/validation/schemas';
import type { ReadinessResult } from '@/utils/scoring';

export interface LeadFunnelPoint {
  status: (typeof leadStatusOptions)[number];
  count: number;
}

// Always returns one point per known status (even zero-count ones) in
// pipeline order, so the funnel chart's x-axis is stable across renders
// rather than only showing whichever statuses happen to have leads today.
export function buildLeadFunnel(leads: { status: string }[]): LeadFunnelPoint[] {
  const counts = new Map<string, number>();
  for (const lead of leads) {
    counts.set(lead.status, (counts.get(lead.status) ?? 0) + 1);
  }
  return leadStatusOptions.map((status) => ({ status, count: counts.get(status) ?? 0 }));
}

export interface AssessmentTrendPoint {
  date: string;
  count: number;
  averageScore: number;
}

// Buckets by calendar day (UTC, from the created_at timestamp's date
// portion) and returns points in chronological order — the admin page's
// own query already sorts newest-first for its list view, so this
// re-sorts rather than assuming input order.
export function buildAssessmentTrend(
  assessments: { created_at: string; result: ReadinessResult }[]
): AssessmentTrendPoint[] {
  const byDate = new Map<string, { count: number; scoreSum: number }>();
  for (const a of assessments) {
    const date = a.created_at.slice(0, 10);
    const bucket = byDate.get(date) ?? { count: 0, scoreSum: 0 };
    bucket.count += 1;
    bucket.scoreSum += a.result.score;
    byDate.set(date, bucket);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { count, scoreSum }]) => ({
      date,
      count,
      averageScore: Math.round(scoreSum / count),
    }));
}
