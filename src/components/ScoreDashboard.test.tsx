// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { calculateReadiness } from '@/utils/scoring';
import { ScoreDashboard } from './ScoreDashboard';

// LanguageProvider now derives locale from the URL (src/proxy.ts,
// src/app/[locale]/layout.tsx) rather than localStorage, so it calls
// next/navigation's router/pathname hooks unconditionally — every test
// that renders it needs these mocked, same pattern as LeadStatusEditor.test.tsx.
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

const ASSESSMENT_ID = '11111111-1111-4111-8111-111111111111';

// A handful of mid-range answers is enough to produce a real, fully-formed
// ReadinessResult (score, level, strengths/gaps, roadmap) via the actual
// scoring logic, rather than hand-rolling a fixture that could drift out
// of sync with the ReadinessResult shape.
const result = calculateReadiness({ q1: 3, q2: 2, q3: 4, q4: 1, q5: 3 });

const renderDashboard = (props: Partial<React.ComponentProps<typeof ScoreDashboard>> = {}) =>
  render(
    <LanguageProvider locale="en">
      <ScoreDashboard result={result} assessmentId={ASSESSMENT_ID} {...props} />
    </LanguageProvider>
  );

const originalLocation = window.location;

describe('ScoreDashboard', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
    // jsdom's window.location.assign isn't directly spy-able (it's a
    // non-configurable accessor on the Location prototype), so the whole
    // object is swapped for a plain stand-in with a mockable assign.
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, assign: vi.fn() },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it('renders the readiness level and score UI', () => {
    renderDashboard();
    // The numeric score itself is an animated counter (framer-motion
    // ticks it up from 0 via requestAnimationFrame), so it isn't asserted
    // here — the level label and static "/100" suffix are enough to
    // confirm the score card rendered with real data.
    expect(screen.getByText(result.level)).toBeInTheDocument();
    expect(screen.getByText('/100')).toBeInTheDocument();
    expect(screen.getByTestId('download-pdf-button')).toBeInTheDocument();
  });

  it('submits the email-me form and shows a confirmation', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );
    renderDashboard();

    await user.click(screen.getByRole('button', { name: /email me this report/i }));
    const emailInput = screen.getByPlaceholderText('you@company.com');
    await user.type(emailInput, 'jane@example.com');
    await user.click(screen.getByRole('button', { name: /^send$/i }));

    await waitFor(() => expect(screen.getByText(/report sent/i)).toBeInTheDocument());
    expect(fetch).toHaveBeenCalledWith(
      `/api/assessments/${ASSESSMENT_ID}/email`,
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('submits the WhatsApp form and shows a confirmation', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );
    renderDashboard();

    await user.click(screen.getByRole('button', { name: /send to whatsapp/i }));
    const phoneInput = screen.getByPlaceholderText('971501234567');
    await user.type(phoneInput, '971501234567');
    await user.click(screen.getByRole('button', { name: /^send$/i }));

    await waitFor(() => expect(screen.getByText(/check whatsapp/i)).toBeInTheDocument());
    expect(fetch).toHaveBeenCalledWith(
      `/api/assessments/${ASSESSMENT_ID}/whatsapp`,
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('shows a WhatsApp send error without crashing', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Could not send.' }), { status: 502 })
    );
    renderDashboard();

    await user.click(screen.getByRole('button', { name: /send to whatsapp/i }));
    await user.type(screen.getByPlaceholderText('971501234567'), '971501234567');
    await user.click(screen.getByRole('button', { name: /^send$/i }));

    await waitFor(() => expect(screen.getByText('Could not send.')).toBeInTheDocument());
  });

  it('starts a Tabby pay-in-4 checkout and redirects on success', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ url: 'https://checkout.tabby.ai/session/abc' }), { status: 200 })
    );
    renderDashboard();

    await user.click(screen.getByRole('button', { name: /pay in 4 with tabby/i }));

    await waitFor(() =>
      expect(window.location.assign).toHaveBeenCalledWith('https://checkout.tabby.ai/session/abc')
    );
    expect(fetch).toHaveBeenCalledWith(
      '/api/checkout/tabby',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ assessmentId: ASSESSMENT_ID }),
      })
    );
  });

  it('shows a Tabby ineligibility error inline instead of redirecting', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ error: 'Pay-in-installments is not available for this purchase. Try another payment method.' }),
        { status: 422 }
      )
    );
    renderDashboard();

    await user.click(screen.getByRole('button', { name: /pay in 4 with tabby/i }));

    await waitFor(() =>
      expect(screen.getByText(/try another payment method/i)).toBeInTheDocument()
    );
    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it('does not show the Tabby button once already on the business tier', () => {
    renderDashboard({ tier: 'business' });
    expect(screen.queryByRole('button', { name: /pay in 4 with tabby/i })).not.toBeInTheDocument();
  });
});
