'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/Button';

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard route error', error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <section className="min-h-screen flex items-center justify-center py-32 bg-background">
      <div className="glass-card max-w-md p-10 text-center">
        <AlertTriangle className="w-10 h-10 text-risk-red mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Could not load your dashboard</h1>
        <p className="text-muted-foreground text-sm mb-6">Something went wrong fetching your assessments. Please try again.</p>
        <Button variant="outline" onClick={() => unstable_retry()} icon={<RefreshCw className="w-4 h-4" />}>
          Try Again
        </Button>
      </div>
    </section>
  );
}
