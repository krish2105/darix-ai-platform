'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check } from 'lucide-react';
import { leadStatusOptions, type UpdateLeadInput } from '@/lib/validation/schemas';

const statusPillClass: Record<(typeof leadStatusOptions)[number], string> = {
  new: 'bg-electric-blue/15 text-electric-blue',
  contacted: 'bg-warning-amber/15 text-warning-amber',
  qualified: 'bg-ai-violet/15 text-ai-violet',
  won: 'bg-emerald-success/15 text-emerald-success',
  lost: 'bg-risk-red/15 text-risk-red',
};

interface LeadStatusEditorProps {
  leadId: string;
  initialStatus: (typeof leadStatusOptions)[number];
  initialNotes: string | null;
}

// CRM-lite editor embedded in each lead card on /admin: change the
// pipeline status inline, and jot a note. Saves on blur/change rather than
// needing a separate submit step, since this is an internal tool.
export const LeadStatusEditor: React.FC<LeadStatusEditorProps> = ({ leadId, initialStatus, initialNotes }) => {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (patch: UpdateLeadInput) => {
    setIsSaving(true);
    setError(null);
    setJustSaved(false);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Could not save.');
      }
      setJustSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as (typeof leadStatusOptions)[number];
    setStatus(next);
    save({ status: next });
  };

  return (
    <div className="mt-3 pt-3 border-t border-card-border/60 space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={status}
          onChange={handleStatusChange}
          disabled={isSaving}
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border-0 appearance-none cursor-pointer ${statusPillClass[status]}`}
        >
          {leadStatusOptions.map((option) => (
            <option key={option} value={option} className="bg-card text-foreground">
              {option}
            </option>
          ))}
        </select>
        {isSaving && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
        {justSaved && !isSaving && <Check className="w-3 h-3 text-emerald-success" />}
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => save({ notes })}
        placeholder="Add a note…"
        rows={2}
        className="w-full text-xs bg-glass-panel border border-card-border rounded-lg px-3 py-2 text-foreground/90 focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors resize-none"
      />
      {error && <p className="text-[10px] text-risk-red">{error}</p>}
    </div>
  );
};
