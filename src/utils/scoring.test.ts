import { describe, expect, it } from 'vitest';
import { calculateReadiness } from './scoring';
import { dimensions } from '@/data/questions';
import { industries } from '@/data/industries';

const allQuestionIds = dimensions.flatMap((d) => d.questions.map((q) => q.id));

/** Builds an answers map across all 24 questions summing to `total` (0-5 per question, filled front to back). */
const answersWithTotal = (total: number): Record<string, number> => {
  let remaining = total;
  const answers: Record<string, number> = {};
  for (const id of allQuestionIds) {
    const value = Math.max(0, Math.min(5, remaining));
    answers[id] = value;
    remaining -= value;
  }
  return answers;
};

/**
 * Sets every dimension to the same number of points (0-15), producing a
 * uniform per-dimension percentage. Because DIMENSION_WEIGHTS sums to 1,
 * a uniform fill produces an overall score equal to that percentage
 * regardless of how dimensions are individually weighted — this is what
 * makes it a reliable way to test level boundaries without hand-deriving
 * a value for every specific weight combination.
 */
const answersUniform = (pointsPerDimension: number): Record<string, number> => {
  const answers: Record<string, number> = {};
  dimensions.forEach((dim) => {
    let remaining = pointsPerDimension;
    dim.questions.forEach((q) => {
      const value = Math.max(0, Math.min(5, remaining));
      answers[q.id] = value;
      remaining -= value;
    });
  });
  return answers;
};

/** Sets a single dimension to full marks (15/15) and every other dimension to 0. */
const answersSingleDimensionMax = (dimensionId: string): Record<string, number> => {
  const answers: Record<string, number> = {};
  dimensions.forEach((dim) => {
    dim.questions.forEach((q) => {
      answers[q.id] = dim.id === dimensionId ? 5 : 0;
    });
  });
  return answers;
};

describe('calculateReadiness', () => {
  it('scores 0 and lands in the lowest level when no answers are provided', () => {
    const result = calculateReadiness({});
    expect(result.score).toBe(0);
    expect(result.level).toBe('AI Explorer');
    expect(result.dimensionScores).toHaveLength(8);
    expect(result.dimensionScores.every((d) => d.score === 0 && d.percentage === 0)).toBe(true);
  });

  it('scores 0 when every answer is the minimum (all-zero)', () => {
    const answers = Object.fromEntries(allQuestionIds.map((id) => [id, 0]));
    const result = calculateReadiness(answers);
    expect(result.score).toBe(0);
    expect(result.level).toBe('AI Explorer');
  });

  it('scores 100 and lands in the top level when every answer is the maximum (all-max)', () => {
    const answers = Object.fromEntries(allQuestionIds.map((id) => [id, 5]));
    const result = calculateReadiness(answers);
    expect(result.score).toBe(100);
    expect(result.level).toBe('AI Leader');
    expect(result.dimensionScores.every((d) => d.percentage === 100)).toBe(true);
  });

  it('ignores answer keys that do not map to a known question', () => {
    // Filling strategy+data+tech+process completely (60 of 120 raw points)
    // lands on a clean dimension boundary, so the weighted score (their
    // combined weight is exactly 0.5) still comes out to 50 here.
    const answers = { ...answersWithTotal(60), unknownQuestion: 5, '': 3 };
    const result = calculateReadiness(answers);
    expect(result.score).toBe(50);
  });

  it('clamps out-of-range answer values instead of letting them skew the score', () => {
    const answers = answersWithTotal(0);
    answers['q1'] = 999; // should clamp to 5
    answers['q2'] = -10; // should clamp to 0
    const result = calculateReadiness(answers);
    // Only the "strategy" dimension (q1-q3) is affected: 5/15 = 33.33%,
    // weighted at 0.15 -> 5.0 exactly.
    expect(result.score).toBe(5);
  });

  describe('level boundaries (uniform dimension fill, weight-invariant)', () => {
    it.each([
      [0, 'AI Explorer'],
      [3, 'AI Explorer'], // 20%
      [6, 'AI Starter'], // 40%
      [9, 'AI Builder'], // 60%
      [12, 'AI Scaler'], // 80%
      [15, 'AI Leader'], // 100%
    ])('%i points per dimension maps to level %s', (pointsPerDimension, expectedLevel) => {
      const result = calculateReadiness(answersUniform(pointsPerDimension));
      expect(result.level).toBe(expectedLevel);
    });
  });

  describe('dimension weighting', () => {
    it('weights governance and strategy higher than tech/process/people', () => {
      const governanceOnly = calculateReadiness(answersSingleDimensionMax('governance'));
      const strategyOnly = calculateReadiness(answersSingleDimensionMax('strategy'));
      const techOnly = calculateReadiness(answersSingleDimensionMax('tech'));

      // A single dimension maxed out (100%) with everything else at 0%
      // scores exactly that dimension's weight (as a percentage).
      expect(governanceOnly.score).toBe(15);
      expect(strategyOnly.score).toBe(15);
      expect(techOnly.score).toBe(10);
      expect(governanceOnly.score).toBeGreaterThan(techOnly.score);
    });

    it('never lets an unweighted or misconfigured dimension silently break the score', () => {
      // Every real dimension id in src/data/questions.ts has an explicit
      // weight; this just guards that dimensionScores always has exactly
      // one entry per dimension regardless of which weight applies.
      const result = calculateReadiness(answersUniform(9));
      expect(result.dimensionScores).toHaveLength(dimensions.length);
    });
  });

  describe('industry-aware output', () => {
    it('swaps the first recommended pilot and appends industry context when a known industry is supplied', () => {
      const finance = industries.find((i) => i.id === 'finance')!;
      const result = calculateReadiness(answersUniform(9), { industryId: 'finance' });
      expect(result.industryId).toBe('finance');
      expect(result.recommendedPilots[0]).toBe(finance.firstPilot);
      expect(result.description).toContain(finance.aiSolution);
    });

    it('falls back to generic output for an unknown industryId instead of throwing', () => {
      const result = calculateReadiness(answersUniform(9), { industryId: 'not-a-real-industry' });
      expect(result.industryId).toBeUndefined();
      expect(result.recommendedPilots[0]).toBe('AI Customer Support Assistant');
    });

    it('produces generic output when no industryId is supplied at all', () => {
      const result = calculateReadiness(answersUniform(9));
      expect(result.industryId).toBeUndefined();
      expect(result.recommendedPilots[0]).toBe('AI Customer Support Assistant');
    });
  });

  describe('governance-specific PDPL copy', () => {
    it('uses PDPL-specific gap text when governance is the weakest dimension', () => {
      const answers = answersUniform(15);
      dimensions
        .find((d) => d.id === 'governance')!
        .questions.forEach((q) => (answers[q.id] = 0));
      const result = calculateReadiness(answers);
      expect(result.gapDimensionIds).toContain('governance');
      expect(result.gaps.some((g) => g.includes('UAE PDPL') && g.includes('AED 50,000'))).toBe(true);
    });

    it('uses PDPL-specific strength text when governance is the strongest dimension', () => {
      const answers = answersUniform(0);
      dimensions
        .find((d) => d.id === 'governance')!
        .questions.forEach((q) => (answers[q.id] = 5));
      const result = calculateReadiness(answers);
      expect(result.strengthDimensionIds).toContain('governance');
      expect(result.strengths.some((s) => s.includes('UAE PDPL'))).toBe(true);
    });
  });

  it('produces exactly 3 strengths and 3 gaps drawn from the 8 dimensions', () => {
    const result = calculateReadiness(answersWithTotal(60));
    expect(result.strengths).toHaveLength(3);
    expect(result.gaps).toHaveLength(3);
  });

  it('produces a 3-phase roadmap', () => {
    const result = calculateReadiness(answersWithTotal(60));
    expect(result.roadmap).toHaveLength(3);
  });
});
