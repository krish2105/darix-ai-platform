import type { Metadata } from 'next';
import { WifiOff } from 'lucide-react';
import { defaultLocale, isLocale, translate } from '@/lib/i18n/translations';
import { RetryButton } from '@/components/RetryButton';

export const metadata: Metadata = {
  title: 'Offline | Darix AI',
  robots: { index: false, follow: false },
};

interface OfflinePageProps {
  params: Promise<{ locale: string }>;
}

// The service worker (public/sw.js) serves this page for any navigation
// that fails while offline — it's cached on first visit specifically so
// it's available with no network at all. Deliberately static (no data
// fetching): a page meant to render offline can't depend on a request
// that needs a connection to succeed.
export default async function OfflinePage({ params }: OfflinePageProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  return (
    <section className="min-h-screen flex items-center justify-center py-32 bg-background">
      <div className="glass-card p-10 text-center max-w-md">
        <WifiOff className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">{translate(locale, 'offline.title')}</h1>
        <p className="text-muted-foreground text-sm mb-6">{translate(locale, 'offline.body')}</p>
        <RetryButton label={translate(locale, 'offline.retry')} />
      </div>
    </section>
  );
}
