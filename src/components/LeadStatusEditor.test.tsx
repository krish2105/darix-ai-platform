// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeadStatusEditor } from './LeadStatusEditor';

const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh, push: vi.fn() }),
}));

const LEAD_ID = '33333333-3333-4333-8333-333333333333';

describe('LeadStatusEditor', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    refresh.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders the initial status and notes', () => {
    render(<LeadStatusEditor leadId={LEAD_ID} initialStatus="new" initialNotes="Called once, no answer." />);

    expect(screen.getByRole('combobox')).toHaveValue('new');
    expect(screen.getByPlaceholderText('Add a note…')).toHaveValue('Called once, no answer.');
  });

  it('PATCHes /api/admin/leads/{id} with the new status when changed, and shows a saved indicator', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ lead: { id: LEAD_ID, status: 'contacted', notes: null } }), { status: 200 })
    );
    render(<LeadStatusEditor leadId={LEAD_ID} initialStatus="new" initialNotes={null} />);

    await user.selectOptions(screen.getByRole('combobox'), 'contacted');

    expect(fetch).toHaveBeenCalledWith(
      `/api/admin/leads/${LEAD_ID}`,
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'contacted' }),
      })
    );
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it('PATCHes notes on blur', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ lead: { id: LEAD_ID, status: 'new', notes: 'Follow up next week.' } }), { status: 200 })
    );
    render(<LeadStatusEditor leadId={LEAD_ID} initialStatus="new" initialNotes={null} />);

    const notesField = screen.getByPlaceholderText('Add a note…');
    await user.type(notesField, 'Follow up next week.');
    await user.tab();

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        `/api/admin/leads/${LEAD_ID}`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ notes: 'Follow up next week.' }),
        })
      )
    );
  });

  it('shows an error state when the save fails without crashing', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Could not save.' }), { status: 500 })
    );
    render(<LeadStatusEditor leadId={LEAD_ID} initialStatus="new" initialNotes={null} />);

    await user.selectOptions(screen.getByRole('combobox'), 'qualified');

    await waitFor(() => expect(screen.getByText('Could not save.')).toBeInTheDocument());
    expect(refresh).not.toHaveBeenCalled();
  });
});
