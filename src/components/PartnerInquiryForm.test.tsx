// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PartnerInquiryForm } from './PartnerInquiryForm';

describe('PartnerInquiryForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shows Zod validation errors when submitting an empty form', async () => {
    const user = userEvent.setup();
    render(<PartnerInquiryForm />);

    await user.click(screen.getByRole('button', { name: /apply to partner/i }));

    await waitFor(() => {
      expect(screen.getByText('Organization name is required')).toBeInTheDocument();
      expect(screen.getByText('Select a partner type')).toBeInTheDocument();
      expect(screen.getByText('Full name is required')).toBeInTheDocument();
      expect(screen.getByText('Enter a valid work email')).toBeInTheDocument();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('submits successfully to /api/partners/apply and shows the confirmation screen', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );
    render(<PartnerInquiryForm />);

    await user.type(screen.getByLabelText(/organization name/i), 'Acme Consulting');
    await user.selectOptions(screen.getByLabelText(/partner type/i), 'consultancy');
    await user.type(screen.getByLabelText(/your name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/work email/i), 'jane@acme-consulting.com');
    await user.type(screen.getByLabelText(/tell us about your practice/i), 'We work with mid-market retail clients.');

    await user.click(screen.getByRole('button', { name: /apply to partner/i }));

    await waitFor(() => expect(screen.getByText('Application received')).toBeInTheDocument());

    expect(fetch).toHaveBeenCalledWith(
      '/api/partners/apply',
      expect.objectContaining({ method: 'POST' })
    );
    const [, options] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body).toMatchObject({
      organizationName: 'Acme Consulting',
      partnerType: 'consultancy',
      contactName: 'Jane Doe',
      contactEmail: 'jane@acme-consulting.com',
    });
  });

  it('shows a submit error returned by the API without crashing', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Could not submit your application.' }), { status: 500 })
    );
    render(<PartnerInquiryForm />);

    await user.type(screen.getByLabelText(/organization name/i), 'Acme Consulting');
    await user.selectOptions(screen.getByLabelText(/partner type/i), 'referral');
    await user.type(screen.getByLabelText(/your name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/work email/i), 'jane@acme-consulting.com');

    await user.click(screen.getByRole('button', { name: /apply to partner/i }));

    await waitFor(() => expect(screen.getByText('Could not submit your application.')).toBeInTheDocument());
  });
});
