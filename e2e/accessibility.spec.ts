import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Automated a11y pass focused on the assessment flow and the
// glassmorphism-heavy sections, since low-contrast glass panels are a
// common failure point for this visual style. Fails the build only on
// critical/serious violations; moderate/minor findings are logged for
// visibility without blocking (matches the "no critical accessibility
// failures" bar from the MVP definition of done).
const BLOCKING_IMPACTS = new Set(['critical', 'serious']);

async function runAxeAndAssert(page: import('@playwright/test').Page, label: string) {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter((v) => BLOCKING_IMPACTS.has(v.impact ?? ''));
  const nonBlocking = results.violations.filter((v) => !BLOCKING_IMPACTS.has(v.impact ?? ''));

  if (nonBlocking.length > 0) {
    console.log(
      `[a11y:${label}] ${nonBlocking.length} non-blocking finding(s): ${nonBlocking.map((v) => `${v.id} (${v.impact})`).join(', ')}`
    );
  }

  expect(
    blocking,
    `[a11y:${label}] critical/serious violations:\n${blocking
      .map((v) => `- ${v.id}: ${v.help} (${v.nodes.length} node(s))`)
      .join('\n')}`
  ).toEqual([]);
}

test.describe('accessibility', () => {
  test('homepage has no critical/serious violations', async ({ page }) => {
    await page.goto('/');
    await runAxeAndAssert(page, 'homepage');
  });

  test('assessment flow (glass-panel heavy) has no critical/serious violations', async ({ page }) => {
    await page.goto('/');
    await page.locator('#assessment').scrollIntoViewIfNeeded();
    await runAxeAndAssert(page, 'assessment');
  });

  test('login page has no critical/serious violations', async ({ page }) => {
    await page.goto('/login');
    await runAxeAndAssert(page, 'login');
  });

  test('privacy and terms pages have no critical/serious violations', async ({ page }) => {
    await page.goto('/privacy');
    await runAxeAndAssert(page, 'privacy');
    await page.goto('/terms');
    await runAxeAndAssert(page, 'terms');
  });
});
