import type { ReadinessResult } from '@/utils/scoring';
import { translate, type Locale } from './translations';

export interface LocalizedResultView {
  level: string;
  description: string;
  strengths: string[];
  gaps: string[];
  roadmap: { phase: string; timeline: string; actions: string[] }[];
  recommendedPilots: string[];
}

// English rendering always uses the assessment's own stored strings — they
// were already generated in English by calculateReadiness(), so there's
// nothing to translate. Non-English rendering swaps in the matching
// templates from the dictionary, keyed off levelId/strengthDimensionIds/
// gapDimensionIds; assessments saved before those fields existed fall back
// to the stored English text (an old report renders in English even when
// viewed with the app in Arabic, rather than showing raw keys).
export const localizeReadinessResult = (
  result: ReadinessResult,
  locale: Locale
): LocalizedResultView => {
  if (locale === 'en' || !result.levelId) {
    return {
      level: result.level,
      description: result.description,
      strengths: result.strengths,
      gaps: result.gaps,
      roadmap: result.roadmap,
      recommendedPilots: result.recommendedPilots,
    };
  }

  const level = translate(locale, `level.${result.levelId}.name`);
  let description = translate(locale, `level.${result.levelId}.desc`);

  // Mirrors the industry-context sentence appended in scoring.ts for
  // English — same idea, translated template instead of re-deriving it.
  if (result.industryId) {
    description += translate(locale, 'result.industryContext.template', {
      industry: translate(locale, `industry.${result.industryId}.name`),
      aiSolution: translate(locale, `industry.${result.industryId}.aiSolution`),
    });
  }

  // Governance gets PDPL-specific copy rather than the generic
  // "{dimension} is/requires..." template — mirrors the same special-case
  // in scoring.ts's English generation.
  const strengths = (result.strengthDimensionIds ?? []).map((id) =>
    id === 'governance'
      ? translate(locale, 'result.strength.governance.template')
      : translate(locale, 'result.strength.template', { dimension: translate(locale, `dim.${id}.title`) })
  );
  const gaps = (result.gapDimensionIds ?? []).map((id) =>
    id === 'governance'
      ? translate(locale, 'result.gap.governance.template')
      : translate(locale, 'result.gap.template', { dimension: translate(locale, `dim.${id}.title`) })
  );

  const roadmap = [1, 2, 3].map((n) => ({
    phase: translate(locale, `roadmap.phase${n}.name`),
    timeline: translate(locale, `roadmap.phase${n}.timeline`),
    actions: [1, 2].map((a) => translate(locale, `roadmap.phase${n}.action${a}`)),
  }));

  // recommendedPilots[0] is industry-specific when industryId is set —
  // mirrors scoring.ts's English generation via the same
  // industry.<id>.firstPilot translation key.
  const recommendedPilots = [1, 2, 3].map((n) =>
    n === 1 && result.industryId
      ? translate(locale, `industry.${result.industryId}.firstPilot`)
      : translate(locale, `pilot${n}`)
  );

  return { level, description, strengths, gaps, roadmap, recommendedPilots };
};
