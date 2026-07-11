// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { PrivacyActions } from './PrivacyActions';

const push = vi.fn();
const refresh = vi.fn();
const signOut = vi.fn().mockResolvedValue({ error: null });

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
  usePathname: () => '/dashboard',
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signOut } }),
}));

const renderPrivacyActions = () =>
  render(
    <LanguageProvider locale="en">
      <PrivacyActions />
    </LanguageProvider>
  );

describe('PrivacyActions', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    push.mockClear();
    refresh.mockClear();
    signOut.mockClear();
    // jsdom doesn't implement the Blob URL APIs the export flow relies on.
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('exports data on the happy path by fetching /api/account/export', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );
    renderPrivacyActions();

    await user.click(screen.getByRole('button', { name: /download my data/i }));

    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith('/api/account/export');
    expect(screen.queryByText(/could not export/i)).not.toBeInTheDocument();
  });

  it('shows an error when the export fails', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Export failed.' }), { status: 500 })
    );
    renderPrivacyActions();

    await user.click(screen.getByRole('button', { name: /download my data/i }));

    await waitFor(() => expect(screen.getByText('Export failed.')).toBeInTheDocument());
  });

  it('requires a second click to confirm account deletion, then signs out and redirects home', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );
    renderPrivacyActions();

    const deleteButton = screen.getByRole('button', { name: /delete my account/i });
    await user.click(deleteButton);

    expect(screen.getByRole('button', { name: /click again to confirm deletion/i })).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /click again to confirm deletion/i }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/account/delete', { method: 'POST' }));
    await waitFor(() => expect(signOut).toHaveBeenCalled());
    expect(push).toHaveBeenCalledWith('/');
    expect(refresh).toHaveBeenCalled();
  });

  it('shows an error and resets the confirmation state when deletion fails', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Could not delete your account.' }), { status: 500 })
    );
    renderPrivacyActions();

    await user.click(screen.getByRole('button', { name: /delete my account/i }));
    await user.click(screen.getByRole('button', { name: /click again to confirm deletion/i }));

    await waitFor(() => expect(screen.getByText('Could not delete your account.')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /delete my account/i })).toBeInTheDocument();
    expect(signOut).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
