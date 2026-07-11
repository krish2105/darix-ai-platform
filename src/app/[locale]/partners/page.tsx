import type { Metadata } from 'next';
import { PartnersPageContent } from '@/components/PartnersPageContent';
import { defaultLocale, isLocale } from '@/lib/i18n/translations';
import { localeAlternates } from '@/lib/i18n/paths';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  return {
    title: 'Partners | Darix AI',
    description: 'Partner with Darix AI as a consultancy, systems integrator, or referral partner to bring AI readiness assessments to your UAE clients.',
    alternates: localeAlternates(locale, '/partners'),
  };
}

export default function PartnersPage() {
  return <PartnersPageContent />;
}
