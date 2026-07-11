import { describe, expect, it } from 'vitest';
import { buildLeadFunnel, buildAssessmentTrend } from './analytics';
import type { ReadinessResult } from '@/utils/scoring';

const result = (score: number): ReadinessResult =>
  ({ score, level: 'Emerging' }) as ReadinessResult;

describe('buildLeadFunnel', () => {
  it('returns one point per known status, in pipeline order, even for zero-count statuses', () => {
    const funnel = buildLeadFunnel([{ status: 'won' }, { status: 'new' }, { status: 'new' }]);
    expect(funnel).toEqual([
      { status: 'new', count: 2 },
      { status: 'contacted', count: 0 },
      { status: 'qualified', count: 0 },
      { status: 'won', count: 1 },
      { status: 'lost', count: 0 },
    ]);
  });

  it('handles an empty input', () => {
    const funnel = buildLeadFunnel([]);
    expect(funnel.every((p) => p.count === 0)).toBe(true);
  });
});

describe('buildAssessmentTrend', () => {
  it('buckets by calendar day and averages the score within each bucket', () => {
    const trend = buildAssessmentTrend([
      { created_at: '2026-07-10T08:00:00.000Z', result: result(60) },
      { created_at: '2026-07-10T18:00:00.000Z', result: result(80) },
      { created_at: '2026-07-11T09:00:00.000Z', result: result(50) },
    ]);
    expect(trend).toEqual([
      { date: '2026-07-10', count: 2, averageScore: 70 },
      { date: '2026-07-11', count: 1, averageScore: 50 },
    ]);
  });

  it('returns points in chronological order regardless of input order', () => {
    const trend = buildAssessmentTrend([
      { created_at: '2026-07-11T09:00:00.000Z', result: result(50) },
      { created_at: '2026-07-09T09:00:00.000Z', result: result(40) },
    ]);
    expect(trend.map((p) => p.date)).toEqual(['2026-07-09', '2026-07-11']);
  });

  it('handles an empty input', () => {
    expect(buildAssessmentTrend([])).toEqual([]);
  });
});
