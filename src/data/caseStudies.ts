export interface CaseStudy {
  id: string;
  title: string;
  challenge: string;
  readinessGap: string;
  aiSolution: string;
  businessValue: string;
  timeline: string;
  toolsUsed: string[];
  result: string;
}

export const caseStudies: CaseStudy[] = [
  {
    id: 'real-estate',
    title: 'Dubai Real Estate Agency',
    challenge: 'Low lead conversion and manual follow-up.',
    readinessGap: 'Fragmented data and limited technical skills.',
    aiSolution: 'AI lead scoring and property recommendation assistant.',
    businessValue: 'Higher conversion rate and saved 20 hours/week per agent.',
    timeline: '3 Months',
    toolsUsed: ['Predictive CRM', 'NLP Chatbot'],
    result: 'Faster lead prioritization and improved sales workflow.'
  },
  {
    id: 'luxury-retail',
    title: 'Luxury Retail Group',
    challenge: 'Generic customer experience and weak personalization.',
    readinessGap: 'Customer data was siloed across offline and online channels.',
    aiSolution: 'AI customer segmentation and recommendation dashboard.',
    businessValue: '35% increase in repeat high-value purchases.',
    timeline: '4 Months',
    toolsUsed: ['Customer Data Platform', 'Recommendation Engine'],
    result: 'Improved VIP targeting and merchandising insights.'
  },
  {
    id: 'hospitality',
    title: 'Hospitality Brand',
    challenge: 'High guest query volume across multiple languages.',
    readinessGap: 'Lack of automated workflows and digital tools.',
    aiSolution: 'AI concierge and demand forecasting.',
    businessValue: 'Reduced response time by 80% and optimized staffing.',
    timeline: '2 Months',
    toolsUsed: ['Conversational AI', 'Time-series Forecasting'],
    result: 'Faster response and improved guest experience.'
  },
  {
    id: 'sme-ops',
    title: 'SME Operations Team',
    challenge: 'Manual reporting and repetitive admin workflows.',
    readinessGap: 'No documented processes for automation.',
    aiSolution: 'AI automation roadmap and business intelligence dashboard.',
    businessValue: 'Eliminated 40 hours of manual data entry per month.',
    timeline: '6 Weeks',
    toolsUsed: ['RPA', 'Automated BI Dashboards'],
    result: 'Better visibility, less manual reporting, faster decision-making.'
  }
];
