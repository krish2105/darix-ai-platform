'use client';

import { RotateCw } from 'lucide-react';

interface RetryButtonProps {
  label: string;
}

// Plain reload — if the network is back, this re-runs the original
// navigation the service worker intercepted; if not, the SW just serves
// this same offline page again.
export const RetryButton = ({ label }: RetryButtonProps) => (
  <button
    type="button"
    onClick={() => window.location.reload()}
    className="inline-flex items-center gap-2 text-cyber-cyan hover:text-electric-blue font-medium transition-colors"
  >
    <RotateCw className="w-4 h-4" /> {label}
  </button>
);
