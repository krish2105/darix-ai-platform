import { describe, expect, it } from 'vitest';
import { buildFaqSystemPrompt, buildAdvisorSystemPrompt } from './prompt';
import { calculateReadiness } from '@/utils/scoring';

describe('buildFaqSystemPrompt', () => {
  it('includes every retrieved chunk in the context', () => {
    const prompt = buildFaqSystemPrompt(
      [
        { title: 'Pricing', content: 'Darix AI has a free tier.' },
        { title: 'FAQ', content: 'Q: What is this? A: An assessment tool.' },
      ],
      'en'
    );
    expect(prompt).toContain('Darix AI has a free tier.');
    expect(prompt).toContain('An assessment tool.');
  });

  it('states no matching information was found when given no chunks', () => {
    const prompt = buildFaqSystemPrompt([], 'en');
    expect(prompt).toMatch(/no matching information/i);
  });

  it('instructs the model never to present case studies as real customers', () => {
    const prompt = buildFaqSystemPrompt([], 'en');
    expect(prompt).toMatch(/illustrative composite/i);
  });

  it('instructs a Modern Standard Arabic response for the ar locale', () => {
    const prompt = buildFaqSystemPrompt([], 'ar');
    expect(prompt).toMatch(/arabic/i);
  });
});

describe('buildAdvisorSystemPrompt', () => {
  const result = calculateReadiness({ q1: 3, q2: 2, q3: 4, q4: 1, q5: 3 });

  it('includes the actual score and level', () => {
    const prompt = buildAdvisorSystemPrompt(result, 'en');
    expect(prompt).toContain(`${result.score}/100`);
    expect(prompt).toContain(result.level);
  });

  it('includes every dimension score by name, not just id', () => {
    const prompt = buildAdvisorSystemPrompt(result, 'en');
    // Dimension titles (e.g. "AI Strategy") should appear, not raw ids like "strategy".
    expect(prompt).toContain('AI Strategy');
  });

  it('instructs the model not to fabricate metrics beyond the given data', () => {
    const prompt = buildAdvisorSystemPrompt(result, 'en');
    expect(prompt).toMatch(/never invent/i);
  });

  it('includes the full 90-day roadmap', () => {
    const prompt = buildAdvisorSystemPrompt(result, 'en');
    result.roadmap.forEach((phase) => {
      expect(prompt).toContain(phase.phase);
    });
  });
});
