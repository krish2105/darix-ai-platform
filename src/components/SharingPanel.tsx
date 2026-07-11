'use client';

import { useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ShareExpiryOption } from '@/lib/validation/schemas';

interface SharingPanelProps {
  assessmentId: string;
  shareEnabled: boolean;
  shareExpiresAt: string | null;
  organizationShared: boolean;
  reportUrl: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// shareExpiresAt is an absolute timestamp, not one of the four buckets this
// panel offers going forward — this maps it back to the closest bucket so
// re-opening the panel doesn't default to "never" and silently clear an
// existing expiry the first time the owner hits Save without touching it.
const closestExpiryOption = (shareExpiresAt: string | null): ShareExpiryOption => {
  if (!shareExpiresAt) return 'never';
  const daysLeft = (new Date(shareExpiresAt).getTime() - Date.now()) / DAY_MS;
  if (daysLeft <= 2) return '1d';
  if (daysLeft <= 14) return '7d';
  return '30d';
};

// Owner-only sharing controls for a report, rendered on report/[id]/page.tsx.
// Two independent channels: the public "anyone with the link" toggle/expiry,
// and a team-share toggle that lazily creates an organization for the owner
// the first time it's switched on (src/lib/organizations/ensure.ts) — there's
// no separate "create a team first" step.
export const SharingPanel = ({
  assessmentId,
  shareEnabled: initialShareEnabled,
  shareExpiresAt,
  organizationShared: initialOrganizationShared,
  reportUrl,
}: SharingPanelProps) => {
  const { t } = useLanguage();
  const [shareEnabled, setShareEnabled] = useState(initialShareEnabled);
  const [shareExpiry, setShareExpiry] = useState<ShareExpiryOption>(() => closestExpiryOption(shareExpiresAt));
  const [organizationShared, setOrganizationShared] = useState(initialOrganizationShared);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [copied, setCopied] = useState(false);

  const save = async () => {
    setStatus('saving');
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/sharing`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareEnabled, shareExpiry, organizationShared }),
      });
      if (!res.ok) throw new Error('Request failed');
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(reportUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied — nothing to recover from here.
    }
  };

  return (
    <section className="container mx-auto px-4 md:px-6 py-8">
      <div className="max-w-3xl mx-auto glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-4 h-4 text-cyber-cyan" />
          <h2 className="font-display font-bold text-sm text-foreground">{t('sharing.title')}</h2>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <input
            readOnly
            value={reportUrl}
            className="flex-1 min-w-0 text-xs px-3 py-2 rounded-md bg-glass-panel border border-card-border text-muted-foreground truncate"
          />
          <button
            type="button"
            onClick={copyLink}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-md bg-glass-panel border border-card-border text-foreground hover:border-cyber-cyan/50 transition-colors flex-shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? t('sharing.linkCopied') : t('sharing.copyLink')}
          </button>
        </div>

        <label className="flex items-center justify-between gap-3 py-2 cursor-pointer">
          <span className="text-sm text-foreground">{t('sharing.publicLinkLabel')}</span>
          <input
            type="checkbox"
            checked={shareEnabled}
            onChange={(e) => setShareEnabled(e.target.checked)}
            className="w-4 h-4 accent-cyber-cyan"
          />
        </label>
        {!shareEnabled && (
          <p className="text-xs text-muted-foreground mb-2">{t('sharing.linkDisabledNote')}</p>
        )}

        {shareEnabled && (
          <div className="flex items-center justify-between gap-3 py-2">
            <span className="text-sm text-foreground">{t('sharing.expiryLabel')}</span>
            <select
              value={shareExpiry}
              onChange={(e) => setShareExpiry(e.target.value as ShareExpiryOption)}
              className="text-sm px-2 py-1.5 rounded-md bg-glass-panel border border-card-border text-foreground"
            >
              <option value="never">{t('sharing.expiry.never')}</option>
              <option value="1d">{t('sharing.expiry.1d')}</option>
              <option value="7d">{t('sharing.expiry.7d')}</option>
              <option value="30d">{t('sharing.expiry.30d')}</option>
            </select>
          </div>
        )}

        <label className="flex items-center justify-between gap-3 py-2 cursor-pointer">
          <span className="text-sm text-foreground">{t('sharing.teamShareLabel')}</span>
          <input
            type="checkbox"
            checked={organizationShared}
            onChange={(e) => setOrganizationShared(e.target.checked)}
            className="w-4 h-4 accent-cyber-cyan"
          />
        </label>

        <div className="flex items-center gap-3 mt-4">
          <button
            type="button"
            onClick={save}
            disabled={status === 'saving'}
            className="text-sm px-4 py-2 rounded-md bg-cyber-cyan text-background font-medium hover:bg-cyber-cyan/90 transition-colors disabled:opacity-60"
          >
            {t('sharing.save')}
          </button>
          {status === 'saved' && <span className="text-xs text-emerald-400">{t('sharing.saved')}</span>}
          {status === 'error' && <span className="text-xs text-red-400">{t('sharing.saveError')}</span>}
        </div>
      </div>
    </section>
  );
};
