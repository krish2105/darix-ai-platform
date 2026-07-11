// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ContactSection } from './ContactSection';

// LanguageProvider derives locale from the URL and calls next/navigation's
// router/pathname hooks unconditionally — needs mocking for every render.
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

// ContactSection's motion.div wrappers use framer-motion's whileInView,
// which needs a real IntersectionObserver — jsdom doesn't implement one.
// Assigned directly (not via vi.stubGlobal) so it survives the
// vi.unstubAllGlobals() call in afterEach below.
class IntersectionObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = () => [];
}
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IntersectionObserverStub;

const renderContact = () =>
  render(
    <LanguageProvider locale="en">
      <ContactSection />
    </LanguageProvider>
  );

describe('ContactSection', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shows Zod validation errors when submitting an empty form', async () => {
    const user = userEvent.setup();
    renderContact();

    await user.click(screen.getByTestId('contact-submit-button'));

    await waitFor(() => {
      expect(screen.getByText('Full name is required')).toBeInTheDocument();
      expect(screen.getByText('Enter a valid work email')).toBeInTheDocument();
      expect(screen.getByText('Company name is required')).toBeInTheDocument();
      expect(screen.getByText('Select a company size')).toBeInTheDocument();
      expect(screen.getByText('Please provide a bit more detail (10+ characters)')).toBeInTheDocument();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('submits successfully and shows the confirmation screen, with a business jurisdiction selected', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );
    renderContact();

    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/work email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/company name/i), 'Acme Corp');
    await user.selectOptions(screen.getByLabelText(/company size/i), '1-50');
    await user.selectOptions(screen.getByLabelText(/business registration/i), 'mainland');
    await user.type(screen.getByLabelText(/main ai challenge/i), 'We need help scaling our AI initiatives.');

    await user.click(screen.getByTestId('contact-submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('contact-success')).toBeInTheDocument();
      expect(screen.getByText('Request Submitted')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/contact',
      expect.objectContaining({ method: 'POST' })
    );
    const [, options] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body).toMatchObject({
      fullName: 'Jane Doe',
      workEmail: 'jane@example.com',
      companyName: 'Acme Corp',
      companySize: '1-50',
      businessJurisdiction: 'mainland',
      challenge: 'We need help scaling our AI initiatives.',
    });
  });

  it('shows a submit error returned by the API without crashing', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Could not submit.' }), { status: 500 })
    );
    renderContact();

    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/work email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/company name/i), 'Acme Corp');
    await user.selectOptions(screen.getByLabelText(/company size/i), '1-50');
    await user.selectOptions(screen.getByLabelText(/business registration/i), 'mainland');
    await user.type(screen.getByLabelText(/main ai challenge/i), 'We need help scaling our AI initiatives.');

    await user.click(screen.getByTestId('contact-submit-button'));

    await waitFor(() => expect(screen.getByText('Could not submit.')).toBeInTheDocument());
  });

  it('submits successfully when business jurisdiction is left unselected', async () => {
    // businessJurisdiction's placeholder option is selectable (not
    // `disabled`, unlike companySize's), so its native default value is
    // "" rather than never being submitted at all. contactSchema handles
    // this with `.optional().or(z.literal(''))` (see schemas.ts) — same
    // pattern as createAssessmentSchema's contactEmail — so an untouched
    // field doesn't block submission despite being a real, selectable "".
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );
    renderContact();

    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/work email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/company name/i), 'Acme Corp');
    await user.selectOptions(screen.getByLabelText(/company size/i), '1-50');
    await user.type(screen.getByLabelText(/main ai challenge/i), 'We need help scaling our AI initiatives.');

    await user.click(screen.getByTestId('contact-submit-button'));

    await waitFor(() => expect(screen.getByTestId('contact-success')).toBeInTheDocument());
    expect(fetch).toHaveBeenCalledWith('/api/contact', expect.objectContaining({ method: 'POST' }));
  });
});
