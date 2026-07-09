export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
}

export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free Assessment',
    price: 'AED 0',
    description: 'Perfect for getting an initial baseline.',
    features: [
      'Basic AI readiness score',
      'Dimension snapshot',
      'Starter recommendations',
      'Industry benchmark preview'
    ]
  },
  {
    id: 'pro',
    name: 'Professional Report',
    price: 'AED 499',
    description: 'Deep dive into your organization’s AI capabilities.',
    features: [
      'Full AI readiness report',
      'Department-level analysis',
      '90-day roadmap',
      'AI opportunity matrix',
      'Governance checklist',
      'PDF export'
    ],
    isPopular: true
  },
  {
    id: 'business',
    name: 'Business Consultation',
    price: 'AED 1,999',
    description: 'Expert guidance to build your AI strategy.',
    features: [
      'Full professional report',
      '60-minute AI strategy call',
      'Custom use-case prioritization',
      'ROI planning',
      'Leadership presentation summary'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise AI Readiness',
    price: 'Custom',
    description: 'Comprehensive transformation for large organizations.',
    features: [
      'Multi-department assessment',
      'Stakeholder interviews',
      'Data maturity review',
      'AI governance framework',
      'Executive workshop',
      'Transformation roadmap'
    ]
  }
];
