import type { Metadata } from 'next';
import { CaseStudiesPageContent } from '@/components/CaseStudiesPageContent';
import { defaultLocale, isLocale } from '@/lib/i18n/translations';
import { localeAlternates } from '@/lib/i18n/paths';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  return {
    title: 'Case Studies | Darix AI',
    description: 'Illustrative AI transformation scenarios across Dubai real estate, retail, hospitality, and SME operations — see the readiness gaps and roadmaps behind them.',
    alternates: localeAlternates(locale, '/case-studies'),
  };
}

export default function CaseStudiesPage() {
  return <CaseStudiesPageContent />;
}
