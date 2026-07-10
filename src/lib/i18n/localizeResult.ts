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
  const description = translate(locale, `level.${result.levelId}.desc`);

  const strengths = (result.strengthDimensionIds ?? []).map((id) =>
    translate(locale, 'result.strength.template', { dimension: translate(locale, `dim.${id}.title`) })
  );
  const gaps = (result.gapDimensionIds ?? []).map((id) =>
    translate(locale, 'result.gap.template', { dimension: translate(locale, `dim.${id}.title`) })
  );

  const roadmap = [1, 2, 3].map((n) => ({
    phase: translate(locale, `roadmap.phase${n}.name`),
    timeline: translate(locale, `roadmap.phase${n}.timeline`),
    actions: [1, 2].map((a) => translate(locale, `roadmap.phase${n}.action${a}`)),
  }));

  const recommendedPilots = [1, 2, 3].map((n) => translate(locale, `pilot${n}`));

  return { level, description, strengths, gaps, roadmap, recommendedPilots };
};
