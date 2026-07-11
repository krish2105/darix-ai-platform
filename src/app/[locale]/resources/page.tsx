import type { Metadata } from 'next';
import { ResourcesPageContent } from '@/components/ResourcesPageContent';
import { defaultLocale, isLocale } from '@/lib/i18n/translations';
import { localeAlternates } from '@/lib/i18n/paths';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  return {
    title: 'Resources | Darix AI',
    description: 'Practical guidance on AI readiness, UAE PDPL compliance, and AI ROI for UAE businesses.',
    alternates: localeAlternates(locale, '/resources'),
  };
}

export default function ResourcesPage() {
  return <ResourcesPageContent />;
}
