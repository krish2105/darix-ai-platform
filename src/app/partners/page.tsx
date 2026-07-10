import type { Metadata } from 'next';
import { PartnersPageContent } from '@/components/PartnersPageContent';

export const metadata: Metadata = {
  title: 'Partners | Darix AI',
  description: 'Partner with Darix AI as a consultancy, systems integrator, or referral partner to bring AI readiness assessments to your UAE clients.',
};

export default function PartnersPage() {
  return <PartnersPageContent />;
}
