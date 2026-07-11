import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { PrivacyRequestForm } from '@/components/PrivacyRequestForm';
import { defaultLocale, isLocale } from '@/lib/i18n/translations';
import { localeAlternates, localePath } from '@/lib/i18n/paths';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  return {
    title: 'Privacy Center | Darix AI',
    description: 'Exercise your UAE PDPL data rights: access, export, or delete the personal data Darix AI holds about you.',
    alternates: localeAlternates(locale, '/privacy-center'),
  };
}

interface PrivacyCenterPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PrivacyCenterPage({ params }: PrivacyCenterPageProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  // Unlike /dashboard and /admin, this page is reachable by anonymous
  // visitors and never redirects — it must not crash when Supabase isn't
  // configured, it should just show the same view as a logged-out visitor.
  const user = isSupabaseConfigured()
    ? (await (await createServerSupabaseClient()).auth.getUser()).data.user
    : null;

  return (
    <section className="py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">Privacy Center</h1>
          <p className="text-muted-foreground leading-relaxed">
            Under the UAE Personal Data Protection Law (Federal Decree-Law No. 45 of 2021), you have
            the right to access, correct, export, or erase the personal data we hold about you.
            Use the options below to exercise those rights.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-8">
          {user ? (
            <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t-2 border-t-cyber-cyan">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-cyber-cyan flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold text-foreground">You&apos;re signed in as {user.email}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Download or permanently delete your account data instantly from your dashboard.
                  </p>
                </div>
              </div>
              <Link
                href={localePath(locale, '/dashboard')}
                className="inline-flex items-center gap-2 text-cyber-cyan hover:text-electric-blue font-medium transition-colors flex-shrink-0"
              >
                Go to dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="glass-card p-6 border-t-2 border-t-cyber-cyan">
              <h2 className="font-semibold text-foreground mb-1">Have a Darix account?</h2>
              <p className="text-sm text-muted-foreground">
                <Link href={localePath(locale, '/login')} className="text-cyber-cyan hover:text-electric-blue underline underline-offset-2">
                  Sign in
                </Link>{' '}
                to download or delete your data instantly, without waiting for a manual request.
              </p>
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              {user ? 'Requesting for a different email?' : "Don't have an account?"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Submit a request below — for example, if you took the assessment without creating an
              account, or you&apos;re asking on behalf of someone else&apos;s submission. We&apos;ll
              respond within 30 days and may email you to verify your identity first.
            </p>
            <PrivacyRequestForm />
          </div>
        </div>
      </div>
    </section>
  );
}
