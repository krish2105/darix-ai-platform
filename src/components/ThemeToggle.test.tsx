// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const setTheme = vi.fn();
let resolvedTheme = 'light';

vi.mock('next-themes', () => ({
  useTheme: () => ({ setTheme, resolvedTheme }),
}));

// useHasMounted uses useSyncExternalStore(subscribe, () => true, () => false),
// which resolves to `true` outside of SSR — real in jsdom, no need to mock.
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    setTheme.mockClear();
    resolvedTheme = 'light';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the toggle button once mounted', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
  });

  it('switches to dark when currently light', async () => {
    resolvedTheme = 'light';
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: /toggle theme/i }));

    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('switches to light when currently dark', async () => {
    resolvedTheme = 'dark';
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: /toggle theme/i }));

    expect(setTheme).toHaveBeenCalledWith('light');
  });
});
