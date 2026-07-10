'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { createClient } from '@/lib/supabase/client';

// PDPL self-service panel for signed-in users: export (right to access /
// portability) is a single click, delete (right to erasure) requires an
// explicit second click on the same button to guard against misclicks,
// since it permanently removes the account and every assessment tied to it.
export const PrivacyActions = () => {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      const res = await fetch('/api/account/export');
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Could not export your data. Please try again.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'darix-my-data.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Could not export your data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      setDeleteError(null);
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error || 'Could not delete your account. Please try again.');
      }
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch (err) {
      setIsDeleting(false);
      setConfirmingDelete(false);
      setDeleteError(err instanceof Error ? err.message : 'Could not delete your account. Please try again.');
    }
  };

  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold text-foreground mb-1">Your data, your control</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Under UAE PDPL, you can download or permanently erase every assessment tied to this account at any time.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          icon={isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        >
          {isExporting ? 'Preparing download…' : 'Download my data'}
        </Button>

        <Button
          variant={confirmingDelete ? 'primary' : 'outline'}
          size="sm"
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className={confirmingDelete ? '!bg-risk-red !text-white hover:!bg-risk-red/90' : '!border-risk-red/50 !text-risk-red hover:!bg-risk-red/10'}
          icon={isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        >
          {isDeleting ? 'Deleting…' : confirmingDelete ? 'Click again to confirm deletion' : 'Delete my account'}
        </Button>
      </div>

      {confirmingDelete && !isDeleting && (
        <p className="text-xs text-risk-red flex items-center gap-1.5 mt-3">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          This permanently deletes your account and all assessments. This cannot be undone.
        </p>
      )}

      {exportError && <p className="text-risk-red text-sm mt-3">{exportError}</p>}
      {deleteError && <p className="text-risk-red text-sm mt-3">{deleteError}</p>}
    </div>
  );
};
