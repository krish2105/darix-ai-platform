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

export const calculateReadiness = (answers: Record<string, number>): ReadinessResult => {
  const dimensionTotals: Record<string, { total: number; max: number }> = {};
  
  // Hardcoding dimension ids based on questions.ts
  const dimensions = ['strategy', 'data', 'tech', 'process', 'people', 'governance', 'usecases', 'roi'];
  dimensions.forEach(d => {
    dimensionTotals[d] = { total: 0, max: 15 }; // 3 questions * 5 max points
  });

  // Example mappings
  const qToDim: Record<string, string> = {
    q1: 'strategy', q2: 'strategy', q3: 'strategy',
    q4: 'data', q5: 'data', q6: 'data',
    q7: 'tech', q8: 'tech', q9: 'tech',
    q10: 'process', q11: 'process', q12: 'process',
    q13: 'people', q14: 'people', q15: 'people',
    q16: 'governance', q17: 'governance', q18: 'governance',
    q19: 'usecases', q20: 'usecases', q21: 'usecases',
    q22: 'roi', q23: 'roi', q24: 'roi'
  };

  let totalScore = 0;
  let totalMax = 120; // 24 questions * 5 points

  Object.entries(answers).forEach(([qId, value]) => {
    const dim = qToDim[qId];
    if (dim) {
      dimensionTotals[dim].total += value;
      totalScore += value;
    }
  });

  const percentageScore = Math.round((totalScore / totalMax) * 100);

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

  const dimensionScores = dimensions.map(d => ({
    dimensionId: d,
    score: dimensionTotals[d].total,
    percentage: Math.round((dimensionTotals[d].total / dimensionTotals[d].max) * 100)
  }));

  // Sort dimensions to find strengths and gaps
  const sortedDims = [...dimensionScores].sort((a, b) => b.percentage - a.percentage);
  
  const dimNames: Record<string, string> = {
    strategy: 'AI Strategy', data: 'Data Maturity', tech: 'Technology Infrastructure',
    process: 'Process Automation', people: 'People & Skills', governance: 'AI Governance',
    usecases: 'Use Case Potential', roi: 'ROI & Business Value'
  };

  const strengths = sortedDims.slice(0, 3).map(d => dimNames[d.dimensionId] + ' is a core competency');
  const gaps = sortedDims.slice(-3).map(d => dimNames[d.dimensionId] + ' requires attention');

  const roadmap = [
    { phase: 'Phase 1', timeline: 'Days 1–30', actions: ['Data and use-case audit', 'Leadership alignment workshop'] },
    { phase: 'Phase 2', timeline: 'Days 31–60', actions: ['Pilot design', 'Governance framework setup'] },
    { phase: 'Phase 3', timeline: 'Days 61–90', actions: ['Build, test, and measure AI pilot', 'Refine and scale'] }
  ];

  const recommendedPilots = [
    'AI Customer Support Assistant',
    'Sales Lead Scoring Dashboard',
    'Internal Knowledge Base Agent'
  ];

  return {
    score: percentageScore,
    level,
    description,
    strengths,
    gaps,
    recommendedPilots,
    roadmap,
    dimensionScores
  };
};
