import type { Metadata } from 'next';
import { CaseStudiesPageContent } from '@/components/CaseStudiesPageContent';

export const metadata: Metadata = {
  title: 'Case Studies | Darix AI',
  description: 'Illustrative AI transformation scenarios across Dubai real estate, retail, hospitality, and SME operations — see the readiness gaps and roadmaps behind them.',
};

export default function CaseStudiesPage() {
  return <CaseStudiesPageContent />;
}
