'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';

// Owner-only invite form rendered by TeamPanel. Posts to
// /api/organizations/invite (which itself re-checks the caller is the
// org's owner via RLS-backed lookups — this component doesn't gate
// anything security-relevant, it's just the UI for it) then refreshes the
// server-rendered dashboard so the new member/pending-invite row appears
// without a full reload.
export const InviteTeammateForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/organizations/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error || 'Could not send this invite.');
      }
      setSuccess(body?.status === 'joined' ? 'Added to your team.' : 'Invite sent.');
      setEmail('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send this invite.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@company.com"
          className="flex-1 min-w-0 text-sm px-3 py-2 rounded-md bg-glass-panel border border-card-border text-foreground placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-md bg-cyber-cyan text-background font-medium hover:bg-cyber-cyan/90 transition-colors disabled:opacity-60 flex-shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Invite
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {success && <p className="text-xs text-emerald-400">{success}</p>}
    </form>
  );
};
