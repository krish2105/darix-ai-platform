import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    // Deterministic runs: with MotionConfig reducedMotion="user" wired up
    // in the app, this also makes framer-motion entrance animations
    // resolve instantly instead of transitioning, so axe never samples a
    // mid-fade element (which briefly renders as a blended, low-contrast
    // color) — the real bug the flaky color-contrast failures pointed to.
    contextOptions: {
      reducedMotion: 'reduce',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
          ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
          : undefined,
      },
    },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'placeholder-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'placeholder-service-role-key',
      // Renders the chat widget for e2e/chatbot.spec.ts — the widget's
      // own network calls are mocked (no real GEMINI_API_KEY needed),
      // this only controls the client-side render guard.
      NEXT_PUBLIC_CHATBOT_ENABLED: 'true',
    },
  },
});
