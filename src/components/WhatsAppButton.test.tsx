// @vitest-environment jsdom
import { describe, expect, it, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { translate } from '@/lib/i18n/translations';
import { WhatsAppButton } from './WhatsAppButton';

// process.env.NEXT_PUBLIC_WHATSAPP_NUMBER is read inside the component
// body on every render (not at module load time), so a plain env var
// assignment before render is enough here — no vi.resetModules()/dynamic
// import needed (that combination actually breaks this specific test: it
// would leave the statically-imported LanguageProvider holding a stale
// module instance of LanguageContext's React Context object while a
// freshly re-imported component reads a different one, so useContext
// returns null even though a provider is rendered).
const ORIGINAL_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

const renderButton = () =>
  render(
    <LanguageProvider>
      <WhatsAppButton />
    </LanguageProvider>
  );

describe('WhatsAppButton', () => {
  afterEach(() => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = ORIGINAL_NUMBER;
  });

  it('renders nothing when NEXT_PUBLIC_WHATSAPP_NUMBER is not set', () => {
    delete process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    const { container } = renderButton();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders a wa.me deep link with the configured number and a prefilled message when set', () => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '971501234567';
    renderButton();

    const link = screen.getByRole('link', { name: /chat with us on whatsapp/i });
    const expectedText = encodeURIComponent(translate('en', 'whatsapp.defaultMessage'));
    expect(link).toHaveAttribute('href', `https://wa.me/971501234567?text=${expectedText}`);
    expect(link).toHaveAttribute('target', '_blank');
  });
});
