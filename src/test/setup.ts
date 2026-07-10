import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup, configure } from '@testing-library/react';

// Vitest doesn't run with Jest's global `afterEach`, which is what
// @testing-library/react's auto-cleanup normally hooks into — without this,
// every render() in a component test file stacks onto the previous one's
// leftover DOM instead of replacing it.
afterEach(() => {
  cleanup();
});

// RTL's default waitFor timeout (1000ms) is tight enough that running the
// full jsdom component-test suite in parallel (many test files, 4 CPUs)
// can genuinely blow past it under real contention — not a bug in any
// individual test, just real timers competing for a CPU. Raised suite-wide
// rather than patched per-test so this doesn't have to be rediscovered
// every time a new component test file gets added.
configure({ asyncUtilTimeout: 3000 });
