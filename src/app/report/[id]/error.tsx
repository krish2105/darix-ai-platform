'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/Button';

export default function ReportError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error('Report route error', error);
  }, [error]);

  return (
    <section className="min-h-screen flex items-center justify-center py-32 bg-background">
      <div className="glass-card max-w-md p-10 text-center">
        <AlertTriangle className="w-10 h-10 text-risk-red mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Could not load this report</h1>
        <p className="text-muted-foreground text-sm mb-6">Something went wrong. Please try again.</p>
        <Button variant="outline" onClick={() => unstable_retry()} icon={<RefreshCw className="w-4 h-4" />}>
          Try Again
        </Button>
      </div>
    </section>
  );
}
