import { describe, expect, it } from 'vitest';
import { calculateReadiness } from './scoring';
import { dimensions } from '@/data/questions';

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
    const answers = { ...answersWithTotal(60), unknownQuestion: 5, '': 3 };
    const result = calculateReadiness(answers);
    expect(result.score).toBe(50);
  });

  it('clamps out-of-range answer values instead of letting them skew the score', () => {
    const answers = answersWithTotal(0);
    answers['q1'] = 999; // should clamp to 5
    answers['q2'] = -10; // should clamp to 0
    const result = calculateReadiness(answers);
    expect(result.score).toBe(Math.round((5 / 120) * 100));
  });

  describe('level boundaries', () => {
    // totalMax is 120 (24 questions * 5 points). Boundaries are defined as
    // percentageScore <= 25 / 50 / 75 / 90.
    it.each([
      [0, 'AI Explorer'],
      [30, 'AI Explorer'], // 25.0% rounds to 25 -> still Explorer
      [31, 'AI Starter'], // 25.83% rounds to 26 -> crosses into Starter
      [60, 'AI Starter'], // 50.0%
      [61, 'AI Builder'], // 50.83% rounds to 51
      [90, 'AI Builder'], // 75.0%
      [91, 'AI Scaler'], // 75.83% rounds to 76
      [108, 'AI Scaler'], // 90.0%
      [109, 'AI Leader'], // 90.83% rounds to 91
      [120, 'AI Leader'], // 100%
    ])('total score %i maps to level %s', (total, expectedLevel) => {
      const result = calculateReadiness(answersWithTotal(total));
      expect(result.level).toBe(expectedLevel);
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
