export interface Industry {
  id: string;
  name: string;
  problem: string;
  aiSolution: string;
  impact: string;
  risk: 'Low' | 'Medium' | 'High';
  difficulty: 'Low' | 'Medium' | 'High';
  firstPilot: string;
}

export const industries: Industry[] = [
  {
    id: 'real-estate',
    name: 'Real Estate',
    problem: 'Slow lead qualification and inconsistent buyer follow-up.',
    aiSolution: 'Predictive lead scoring, AI sales assistant, property recommendation engine.',
    impact: 'Faster response, better conversion, improved sales productivity.',
    risk: 'Medium',
    difficulty: 'Medium',
    firstPilot: 'AI lead scoring dashboard.'
  },
  {
    id: 'tourism',
    name: 'Tourism & Hospitality',
    problem: 'Guests expect personalized experiences across languages and channels.',
    aiSolution: 'AI concierge, itinerary personalization, demand forecasting.',
    impact: 'Better guest satisfaction, higher upsell potential, faster service.',
    risk: 'Medium',
    difficulty: 'Medium',
    firstPilot: 'Multilingual AI concierge.'
  },
  {
    id: 'retail',
    name: 'Retail & Luxury',
    problem: 'Customer preferences are not fully used for personalization.',
    aiSolution: 'Recommendation engine, VIP customer prediction, inventory intelligence.',
    impact: 'Higher conversion, better customer retention, improved merchandising.',
    risk: 'Medium',
    difficulty: 'Medium',
    firstPilot: 'AI personalization engine.'
  },
  {
    id: 'finance',
    name: 'Finance',
    problem: 'Manual risk analysis and fraud monitoring.',
    aiSolution: 'Predictive risk scoring, anomaly detection, financial forecasting.',
    impact: 'Faster decisions, lower risk, better compliance support.',
    risk: 'High',
    difficulty: 'High',
    firstPilot: 'Risk monitoring dashboard.'
  },
  {
    id: 'government',
    name: 'Government Services',
    problem: 'High-volume citizen queries and document workflows.',
    aiSolution: 'AI assistant, document classification, service prediction.',
    impact: 'Faster response, better satisfaction, reduced manual workload.',
    risk: 'High',
    difficulty: 'High',
    firstPilot: 'AI service assistant.'
  },
  {
    id: 'logistics',
    name: 'Logistics',
    problem: 'Inefficient route planning and supply chain blind spots.',
    aiSolution: 'Predictive routing, demand forecasting, warehouse automation.',
    impact: 'Lower fuel costs, faster delivery, optimized inventory.',
    risk: 'Medium',
    difficulty: 'High',
    firstPilot: 'Predictive demand dashboard.'
  }
];
