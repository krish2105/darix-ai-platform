import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Automated a11y pass focused on the assessment flow and the
// glassmorphism-heavy sections, since low-contrast glass panels are a
// common failure point for this visual style. Scoped to WCAG 2.1 A/AA
// rules specifically (via .withTags) rather than axe's full default
// ruleset, which also includes non-WCAG "best practice" heuristics (e.g.
// heading-order) that would otherwise mix in unrelated noise. WCAG 2.1 AA
// is the explicit target because it's the conformance level the UAE's
// TDRA National Digital Accessibility Policy sets for federal government
// sites — a reasonable bar to hold this product to even before it
// pursues any public-sector angle. Fails the build only on critical/
// serious violations within that WCAG-tagged scope; moderate/minor
// findings are logged for visibility without blocking.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const BLOCKING_IMPACTS = new Set(['critical', 'serious']);

async function runAxeAndAssert(page: import('@playwright/test').Page, label: string) {
  // framer-motion's `initial={{ opacity: 0 }}` entrance state renders on
  // first paint and only commits to `animate`'s end state once React has
  // hydrated and run its first effect — even with reducedMotion="user"
  // making that transition instant, there's still a brief window right
  // after navigation where elements sit at opacity 0. Scanning during that
  // window makes axe sample a blended, near-invisible text color and
  // report a false-positive contrast failure. This settles it first.
  await page.waitForTimeout(500);
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
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
