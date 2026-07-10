import { defineConfig } from 'vitest/config';

// Separate from vitest.config.ts (which powers `npm test`) on purpose: these
// tests hit a real local Postgres/PostgREST instance via the Supabase CLI's
// Docker stack, not a mock. They're slower and require Docker, so they run
// as their own `npm run test:rls` (see scripts/run-rls-tests.sh), not as
// part of the fast unit-test suite that CI and local dev run on every save.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['rls-tests/**/*.test.ts'],
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
