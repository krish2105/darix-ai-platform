import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Vitest doesn't run with Jest's global `afterEach`, which is what
// @testing-library/react's auto-cleanup normally hooks into — without this,
// every render() in a component test file stacks onto the previous one's
// leftover DOM instead of replacing it.
afterEach(() => {
  cleanup();
});
