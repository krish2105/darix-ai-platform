import { dimensions as questionDimensions } from '@/data/questions';
import { industries } from '@/data/industries';

export type ReadinessLevelId = 'explorer' | 'starter' | 'builder' | 'scaler' | 'leader';

export interface ReadinessResult {
  score: number;
  level: string;
  description: string;
  strengths: string[];
  gaps: string[];
  recommendedPilots: string[];
  roadmap: { phase: string; timeline: string; actions: string[] }[];
  dimensionScores: { dimensionId: string; score: number; percentage: number }[];
  // Locale-independent companions to the English fields above — added so
  // Arabic rendering (ScoreDashboard, PDF export) can look up translated
  // templates instead of re-deriving them. The English string fields stay
  // the source of truth for English rendering and for assessments saved
  // before this field existed (locale-aware rendering falls back to the
  // English fields when these are absent). See src/lib/i18n/localizeResult.ts.
  levelId?: ReadinessLevelId;
  strengthDimensionIds?: string[];
  gapDimensionIds?: string[];
  // Set when the submitter selected a known industry (src/data/industries.ts)
  // at intake. Used to personalize recommendedPilots/description in both
  // this file (English) and src/lib/i18n/localizeResult.ts (Arabic), via
  // the industry.<id>.* translation keys that already exist bilingually.
  industryId?: string;
}

export interface CalculateReadinessOptions {
  industryId?: string;
}

// ---------------------------------------------------------------------------
// BUSINESS-LOGIC REVIEW FLAG
//
// This model was written as a working placeholder during initial build-out.
// A domain-expert (AI-transformation consulting) review is still the right
// long-term step before treating results as authoritative, but this pass
// resolved two of the four originally-flagged gaps with a documented,
// reasoned approach rather than leaving them as silent defaults:
//
//   1. Dimension weighting — RESOLVED (see DIMENSION_WEIGHTS below).
//      Strategy, Data, and Governance are weighted higher than the other
//      five dimensions: Strategy and Data because nothing else in the
//      model matters if either is absent (they're prerequisites, not
//      peers, of the other dimensions), and Governance because UAE PDPL
//      (Federal Decree-Law No. 45 of 2021) attaches real fine exposure
//      (AED 50,000–5,000,000) to weak AI governance specifically — a
//      regulatory-risk argument the other dimensions don't carry. This is
//      an internally-reasoned choice, not an externally validated one;
//      revisit it once a domain expert or real assessment-outcome data is
//      available.
//   2. Linear 0–5 answer scale within a dimension — UNCHANGED. Each
//      question still contributes equally within its dimension; no
//      question-level weighting exists yet.
//   3. Level thresholds (25/50/75/90) — UNCHANGED. Deliberately left as
//      round numbers rather than guessed at with no benchmark data;
//      recalibrate once real assessment-outcome volume exists.
//   4. Strengths/gaps/roadmap adaptation — PARTIALLY RESOLVED.
//      recommendedPilots and description are now industry-aware when an
//      industryId is supplied (see below), and the AI Governance
//      strength/gap copy is now PDPL-specific rather than generic. The
//      other seven dimensions' strengths/gaps text, and the 90-day
//      roadmap, remain generic templates — not yet adapted to company
//      size or the specific answer pattern.
// ---------------------------------------------------------------------------

const dimensionIds = questionDimensions.map((d) => d.id);

const questionToDimension: Record<string, string> = Object.fromEntries(
  questionDimensions.flatMap((dim) => dim.questions.map((q) => [q.id, dim.id]))
);

const dimensionNames: Record<string, string> = Object.fromEntries(
  questionDimensions.map((dim) => [dim.id, dim.title])
);

// Sums to 1.0 across the 8 dimensions in src/data/questions.ts — see the
// rationale in the review-flag comment above. Any dimension id missing
// from this map (shouldn't happen with the current question set) falls
// back to an equal share so the score never silently breaks.
const DIMENSION_WEIGHTS: Record<string, number> = {
  strategy: 0.15,
  data: 0.15,
  tech: 0.1,
  process: 0.1,
  people: 0.1,
  governance: 0.15,
  usecases: 0.125,
  roi: 0.125,
};

const POINTS_PER_QUESTION_MAX = 5;

export const calculateReadiness = (
  answers: Record<string, number>,
  options: CalculateReadinessOptions = {}
): ReadinessResult => {
  const dimensionTotals: Record<string, { total: number; max: number }> = {};
  dimensionIds.forEach((id) => {
    const dim = questionDimensions.find((d) => d.id === id)!;
    dimensionTotals[id] = { total: 0, max: dim.questions.length * POINTS_PER_QUESTION_MAX };
  });

  Object.entries(answers).forEach(([qId, rawValue]) => {
    const dim = questionToDimension[qId];
    if (!dim) return;
    const value = Math.min(POINTS_PER_QUESTION_MAX, Math.max(0, rawValue));
    dimensionTotals[dim].total += value;
  });

  // Overall score is a weighted average of each dimension's own 0-100%,
  // not a flat sum of raw points — this is what makes DIMENSION_WEIGHTS
  // actually change the result instead of just documenting an intent.
  const equalShare = 1 / dimensionIds.length;
  const percentageScore = Math.round(
    dimensionIds.reduce((sum, id) => {
      const { total, max } = dimensionTotals[id];
      const dimPercentage = max > 0 ? (total / max) * 100 : 0;
      const weight = DIMENSION_WEIGHTS[id] ?? equalShare;
      return sum + dimPercentage * weight;
    }, 0)
  );

  const industry = options.industryId ? industries.find((i) => i.id === options.industryId) : undefined;

  let level = '';
  let description = '';
  let levelId: ReadinessLevelId;
  if (percentageScore <= 25) {
    level = 'AI Explorer';
    description = 'Early stage. Needs foundational strategy, data cleanup, and leadership alignment.';
    levelId = 'explorer';
  } else if (percentageScore <= 50) {
    level = 'AI Starter';
    description = 'Some readiness exists. Needs structured roadmap, use-case prioritization, and governance.';
    levelId = 'starter';
  } else if (percentageScore <= 75) {
    level = 'AI Builder';
    description = 'Good foundation. Ready for pilots, automation, dashboards, and team enablement.';
    levelId = 'builder';
  } else if (percentageScore <= 90) {
    level = 'AI Scaler';
    description = 'Strong readiness. Ready to scale AI across departments with governance and measurement.';
    levelId = 'scaler';
  } else {
    level = 'AI Leader';
    description = 'Advanced readiness. Ready for enterprise AI operating model, predictive systems, and continuous optimization.';
    levelId = 'leader';
  }

  if (industry) {
    description += ` As a ${industry.name} business, immediate leverage areas include: ${industry.aiSolution}`;
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

  const strengthDimensionIds = sortedDims.slice(0, 3).map((d) => d.dimensionId);
  const gapDimensionIds = sortedDims.slice(-3).map((d) => d.dimensionId);

  // Governance gets PDPL-specific copy rather than the generic
  // "<dimension> is/requires..." template — see review-flag item 4 above.
  // Kept as a single conditional rather than a per-dimension lookup table
  // since governance is currently the only dimension with a regulatory
  // angle strong enough to warrant bespoke text.
  const GOVERNANCE_STRENGTH_TEXT =
    'AI Governance is a core competency — your organization already has policies and review processes in place that reduce UAE PDPL compliance risk as you scale AI initiatives.';
  const GOVERNANCE_GAP_TEXT =
    'AI Governance requires attention — under UAE PDPL (Federal Decree-Law No. 45 of 2021), weak AI governance carries real regulatory exposure (fines from AED 50,000 up to AED 5,000,000). Prioritize clear data privacy policies and a formal AI risk review process.';

  const strengths = strengthDimensionIds.map((id) =>
    id === 'governance' ? GOVERNANCE_STRENGTH_TEXT : `${dimensionNames[id]} is a core competency`
  );
  const gaps = gapDimensionIds.map((id) =>
    id === 'governance' ? GOVERNANCE_GAP_TEXT : `${dimensionNames[id]} requires attention`
  );

  const roadmap = [
    { phase: 'Phase 1', timeline: 'Days 1–30', actions: ['Data and use-case audit', 'Leadership alignment workshop'] },
    { phase: 'Phase 2', timeline: 'Days 31–60', actions: ['Pilot design', 'Governance framework setup'] },
    { phase: 'Phase 3', timeline: 'Days 61–90', actions: ['Build, test, and measure AI pilot', 'Refine and scale'] },
  ];

  // recommendedPilots[0] is industry-specific when a known industry was
  // supplied at intake (falls back to the generic default otherwise); the
  // other two stay generic. Arabic rendering mirrors this in
  // src/lib/i18n/localizeResult.ts using the same industry.<id>.firstPilot
  // translation key so both languages stay in sync from one source idea.
  const recommendedPilots = [
    industry?.firstPilot ?? 'AI Customer Support Assistant',
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
    levelId,
    strengthDimensionIds,
    gapDimensionIds,
    industryId: industry?.id,
  };
};
