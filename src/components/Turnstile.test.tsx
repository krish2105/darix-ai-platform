// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

const ORIGINAL_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

describe('TurnstileWidget', () => {
  afterEach(() => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = ORIGINAL_SITE_KEY;
    vi.resetModules();
    vi.restoreAllMocks();
    document.head.querySelectorAll('script').forEach((s) => s.remove());
  });

  it('renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set (graceful degradation)', async () => {
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    vi.resetModules();
    const { TurnstileWidget } = await import('./Turnstile');

    const { container } = render(<TurnstileWidget onVerify={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
    // No script should be injected either, since the effect bails out early.
    expect(document.head.querySelector('script[src*="challenges.cloudflare.com"]')).not.toBeInTheDocument();
  });

  it('injects the Cloudflare Turnstile script and renders a container when a site key is configured', async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'test-site-key';
    vi.resetModules();
    const { TurnstileWidget } = await import('./Turnstile');

    const { container } = render(<TurnstileWidget onVerify={vi.fn()} />);

    // Renders the wrapper + inner ref div rather than null, and kicks off
    // loading the real Turnstile script (window.turnstile isn't available
    // in jsdom, so render() itself won't fire — this asserts the
    // graceful-degradation-free path doesn't crash and does the expected
    // setup work).
    expect(container.firstChild).not.toBeNull();
    const script = document.head.querySelector<HTMLScriptElement>('script[src*="challenges.cloudflare.com"]');
    expect(script).toBeInTheDocument();
    expect(script?.src).toBe('https://challenges.cloudflare.com/turnstile/v0/api.js');
  });

  it('does not crash if the widget unmounts before the script finishes loading', async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'test-site-key';
    vi.resetModules();
    const { TurnstileWidget } = await import('./Turnstile');

    const view = render(<TurnstileWidget onVerify={vi.fn()} />);
    expect(() => view.unmount()).not.toThrow();
    cleanup();
  });
});
