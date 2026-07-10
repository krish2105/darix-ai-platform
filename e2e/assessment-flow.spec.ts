import { test, expect } from '@playwright/test';
import { dimensions } from '../src/data/questions';
import { calculateReadiness } from '../src/utils/scoring';

// Runs against a placeholder Supabase project (see playwright.config.ts),
// so /api/* calls are intercepted here with canned responses. This
// exercises the real UI flow — filling the quiz, viewing results,
// downloading the report, submitting the contact form — deterministically,
// without needing live database/email credentials in CI.
const FAKE_ASSESSMENT_ID = '99999999-9999-4999-8999-999999999999';

test.describe('core assessment → report → contact flow', () => {
  test('complete assessment, view results, download PDF, submit contact form', async ({ page }) => {
    const answers: Record<string, number> = {};
    dimensions.forEach((dim) => dim.questions.forEach((q) => (answers[q.id] = 3)));
    const expectedResult = calculateReadiness(answers);

    await page.route('**/api/assessments', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: FAKE_ASSESSMENT_ID, result: expectedResult }),
      });
    });

    // Trailing `**` because the real request carries a `?locale=` query
    // string (added when Arabic report content was localized) — an exact
    // suffix match here would silently never fire and the click would
    // hang waiting for a download that never starts.
    await page.route(`**/api/assessments/${FAKE_ASSESSMENT_ID}/pdf**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        headers: { 'Content-Disposition': 'attachment; filename="darix-ai-readiness-report.pdf"' },
        body: Buffer.from('%PDF-1.4 fake-pdf-content-for-e2e-test'),
      });
    });

    await page.route('**/api/contact', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto('/');

    // Step 1: complete the assessment
    await page.locator('#assessment').scrollIntoViewIfNeeded();
    for (let i = 0; i < dimensions.length; i++) {
      const dim = dimensions[i];
      for (const q of dim.questions) {
        await page.getByTestId(`answer-${q.id}-3`).click();
      }
      await page.getByTestId('assessment-next-button').click();
    }

    // Step 2: view the results dashboard
    await expect(page.getByText('Your AI Readiness Command Center')).toBeVisible();
    await expect(page.getByText(expectedResult.level).first()).toBeVisible();

    // Step 3: download the PDF report
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('download-pdf-button').click(),
    ]);
    expect(download.suggestedFilename()).toBe('darix-ai-readiness-report.pdf');

    // Step 4: submit the contact form
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.locator('input[name="fullName"]').fill('Jane Doe');
    await page.locator('input[name="workEmail"]').fill('jane@example.com');
    await page.locator('input[name="companyName"]').fill('Acme Corp');
    await page.locator('select[name="companySize"]').selectOption('1-50');
    await page.locator('textarea[name="challenge"]').fill('We need help identifying high-ROI AI use cases for our team.');
    await page.getByTestId('contact-submit-button').click();

    await expect(page.getByTestId('contact-success')).toBeVisible();
    await expect(page.getByText('Request Submitted')).toBeVisible();
  });
});
