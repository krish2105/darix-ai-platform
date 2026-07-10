// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrivacyRequestForm } from './PrivacyRequestForm';

describe('PrivacyRequestForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shows Zod validation errors when submitting an empty form', async () => {
    const user = userEvent.setup();
    render(<PrivacyRequestForm />);

    await user.click(screen.getByRole('button', { name: /submit request/i }));

    await waitFor(() => {
      expect(screen.getByText('Full name is required')).toBeInTheDocument();
      expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
      // "Select a request type" also appears as the disabled placeholder
      // <option> text, so scope the error-message match to the <p>.
      expect(screen.getByText('Select a request type', { selector: 'p' })).toBeInTheDocument();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('submits successfully to /api/privacy/request and shows the confirmation screen', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );
    render(<PrivacyRequestForm />);

    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.selectOptions(screen.getByLabelText(/request type/i), 'access');
    await user.type(screen.getByLabelText(/details/i), 'The email I used for an assessment.');

    await user.click(screen.getByRole('button', { name: /submit request/i }));

    await waitFor(() => expect(screen.getByText('Request received')).toBeInTheDocument());

    expect(fetch).toHaveBeenCalledWith(
      '/api/privacy/request',
      expect.objectContaining({ method: 'POST' })
    );
    const [, options] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body).toMatchObject({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      requestType: 'access',
    });
  });

  it('shows a submit error returned by the API without crashing', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Could not submit your request.' }), { status: 500 })
    );
    render(<PrivacyRequestForm />);

    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.selectOptions(screen.getByLabelText(/request type/i), 'erasure');

    await user.click(screen.getByRole('button', { name: /submit request/i }));

    await waitFor(() => expect(screen.getByText('Could not submit your request.')).toBeInTheDocument());
  });
});
