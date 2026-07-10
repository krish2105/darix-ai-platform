import type { Metadata } from 'next';
import { ResourcesPageContent } from '@/components/ResourcesPageContent';

export const metadata: Metadata = {
  title: 'Resources | Darix AI',
  description: 'Practical guidance on AI readiness, UAE PDPL compliance, and AI ROI for UAE businesses.',
};

export default function ResourcesPage() {
  return <ResourcesPageContent />;
}
