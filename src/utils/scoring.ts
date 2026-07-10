import { dimensions as questionDimensions } from '@/data/questions';

export interface ReadinessResult {
  score: number;
  level: string;
  description: string;
  strengths: string[];
  gaps: string[];
  recommendedPilots: string[];
  roadmap: { phase: string; timeline: string; actions: string[] }[];
  dimensionScores: { dimensionId: string; score: number; percentage: number }[];
}

// ---------------------------------------------------------------------------
// BUSINESS-LOGIC REVIEW FLAG
//
// This model was written as a working placeholder during initial build-out
// and has not been validated by a domain expert. Before treating assessment
// results as a real product output, someone with AI-transformation
// consulting expertise should review:
//
//   1. Equal weighting — every dimension currently contributes exactly
//      1/8th of the total score. Is "AI Governance" really as important to
//      overall readiness as "AI Strategy"? Real-world scoring rubrics
//      usually weight dimensions unevenly.
//   2. Linear 0–5 answer scale — each question answer (0–5) is summed
//      directly. No attempt is made to weight individual questions within
//      a dimension differently, or to treat the scale as anything but
//      linear.
//   3. Level thresholds (25/50/75/90) — chosen as round numbers, not
//      derived from any benchmark data or calibrated against real
//      assessment outcomes.
//   4. Strengths/gaps text and the 90-day roadmap are generic templates
//      keyed off the top/bottom 3 dimensions — they are not adapted to
//      the specific answers, industry, or company size.
//
// None of the above changed in this pass; this file was only refactored so
// the dimension/question mapping is derived from `src/data/questions.ts`
// (single source of truth) instead of duplicated by hand, which had been
// silently drifting out of sync with the real question set.
// ---------------------------------------------------------------------------

const dimensionIds = questionDimensions.map((d) => d.id);

const questionToDimension: Record<string, string> = Object.fromEntries(
  questionDimensions.flatMap((dim) => dim.questions.map((q) => [q.id, dim.id]))
);

const dimensionNames: Record<string, string> = Object.fromEntries(
  questionDimensions.map((dim) => [dim.id, dim.title])
);

const POINTS_PER_QUESTION_MAX = 5;

export const calculateReadiness = (answers: Record<string, number>): ReadinessResult => {
  const dimensionTotals: Record<string, { total: number; max: number }> = {};
  dimensionIds.forEach((id) => {
    const dim = questionDimensions.find((d) => d.id === id)!;
    dimensionTotals[id] = { total: 0, max: dim.questions.length * POINTS_PER_QUESTION_MAX };
  });

  const totalMax = questionDimensions.reduce(
    (sum, dim) => sum + dim.questions.length * POINTS_PER_QUESTION_MAX,
    0
  );

  let totalScore = 0;
  Object.entries(answers).forEach(([qId, rawValue]) => {
    const dim = questionToDimension[qId];
    if (!dim) return;
    const value = Math.min(POINTS_PER_QUESTION_MAX, Math.max(0, rawValue));
    dimensionTotals[dim].total += value;
    totalScore += value;
  });

  const percentageScore = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  let level = '';
  let description = '';
  if (percentageScore <= 25) {
    level = 'AI Explorer';
    description = 'Early stage. Needs foundational strategy, data cleanup, and leadership alignment.';
  } else if (percentageScore <= 50) {
    level = 'AI Starter';
    description = 'Some readiness exists. Needs structured roadmap, use-case prioritization, and governance.';
  } else if (percentageScore <= 75) {
    level = 'AI Builder';
    description = 'Good foundation. Ready for pilots, automation, dashboards, and team enablement.';
  } else if (percentageScore <= 90) {
    level = 'AI Scaler';
    description = 'Strong readiness. Ready to scale AI across departments with governance and measurement.';
  } else {
    level = 'AI Leader';
    description = 'Advanced readiness. Ready for enterprise AI operating model, predictive systems, and continuous optimization.';
  }

  const dimensionScores = dimensionIds.map((id) => ({
    dimensionId: id,
    score: dimensionTotals[id].total,
    percentage:
      dimensionTotals[id].max > 0
        ? Math.round((dimensionTotals[id].total / dimensionTotals[id].max) * 100)
        : 0,
  }));

  const sortedDims = [...dimensionScores].sort((a, b) => b.percentage - a.percentage);

  const strengths = sortedDims
    .slice(0, 3)
    .map((d) => `${dimensionNames[d.dimensionId]} is a core competency`);
  const gaps = sortedDims
    .slice(-3)
    .map((d) => `${dimensionNames[d.dimensionId]} requires attention`);

  const roadmap = [
    { phase: 'Phase 1', timeline: 'Days 1–30', actions: ['Data and use-case audit', 'Leadership alignment workshop'] },
    { phase: 'Phase 2', timeline: 'Days 31–60', actions: ['Pilot design', 'Governance framework setup'] },
    { phase: 'Phase 3', timeline: 'Days 61–90', actions: ['Build, test, and measure AI pilot', 'Refine and scale'] },
  ];

  const recommendedPilots = [
    'AI Customer Support Assistant',
    'Sales Lead Scoring Dashboard',
    'Internal Knowledge Base Agent',
  ];

  return {
    score: percentageScore,
    level,
    description,
    strengths,
    gaps,
    recommendedPilots,
    roadmap,
    dimensionScores,
  };
};
