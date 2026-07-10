import { test, expect, type Page } from '@playwright/test';
import { dimensions } from '../src/data/questions';
import { calculateReadiness } from '../src/utils/scoring';

// Same interception strategy as e2e/assessment-flow.spec.ts: /api/* calls
// are mocked with canned responses so these run deterministically against
// a placeholder Supabase project. Checkout redirects go to real third-party
// domains (checkout.stripe.com, secure.telr.com, checkout.tabby.ai) — those
// are intercepted too, purely so the test can observe that the browser
// actually navigated there, without needing a live merchant account.
const FAKE_ASSESSMENT_ID = '99999999-9999-4999-8999-999999999999';

const completeAssessment = async (page: Page) => {
  const answers: Record<string, number> = {};
  dimensions.forEach((dim) => dim.questions.forEach((q) => (answers[q.id] = 3)));
  const result = calculateReadiness(answers);

  await page.route('**/api/assessments', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: FAKE_ASSESSMENT_ID, result }),
    });
  });

  await page.goto('/');
  await page.locator('#assessment').scrollIntoViewIfNeeded();
  for (const dim of dimensions) {
    for (const q of dim.questions) {
      await page.getByTestId(`answer-${q.id}-3`).click();
    }
    await page.getByTestId('assessment-next-button').click();
  }
  await expect(page.getByText('Your AI Readiness Command Center')).toBeVisible();
};

test.describe('checkout — both payment providers', () => {
  test('Professional tier checkout redirects to the Stripe-hosted page', async ({ page }) => {
    await completeAssessment(page);

    await page.route('**/api/checkout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'https://checkout.stripe.com/pay/cs_test_fake123' }),
      });
    });
    await page.route('**://checkout.stripe.com/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>stripe checkout</body></html>' });
    });

    await page.getByRole('button', { name: /upgrade to professional/i }).click();
    await page.waitForURL(/checkout\.stripe\.com/);
    expect(page.url()).toContain('checkout.stripe.com');
  });

  test('Business Consultation tier checkout redirects to the Telr-hosted page', async ({ page }) => {
    await completeAssessment(page);

    // The same /api/checkout endpoint fronts both gateways server-side
    // (PAYMENT_PROVIDER selects Stripe vs Telr); the UI only ever follows
    // whatever url it's given, so mocking a Telr-shaped url here exercises
    // the identical client redirect path Stripe's test above exercises.
    await page.route('**/api/checkout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'https://secure.telr.com/gateway/process.html?o=fake-ref-123' }),
      });
    });
    await page.route('**://secure.telr.com/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>telr checkout</body></html>' });
    });

    await page.getByRole('button', { name: /upgrade to business consultation/i }).click();
    await page.waitForURL(/secure\.telr\.com/);
    expect(page.url()).toContain('secure.telr.com');
  });

  test('Tabby pay-in-4 checkout redirects to the Tabby-hosted page', async ({ page }) => {
    await completeAssessment(page);

    await page.route('**/api/checkout/tabby', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'https://checkout.tabby.ai/session/fake123' }),
      });
    });
    await page.route('**://checkout.tabby.ai/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>tabby checkout</body></html>' });
    });

    await page.getByRole('button', { name: /pay in 4 with tabby/i }).click();
    await page.waitForURL(/checkout\.tabby\.ai/);
    expect(page.url()).toContain('checkout.tabby.ai');
  });

  test('shows an inline error instead of redirecting when Tabby declines eligibility', async ({ page }) => {
    await completeAssessment(page);

    await page.route('**/api/checkout/tabby', async (route) => {
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Pay-in-installments is not available for this purchase. Try another payment method.' }),
      });
    });

    await page.getByRole('button', { name: /pay in 4 with tabby/i }).click();
    await expect(page.getByText(/try another payment method/i)).toBeVisible();
    expect(page.url()).not.toContain('tabby');
  });
});

test.describe('results screen — WhatsApp report delivery', () => {
  test('sends the report over WhatsApp and shows a confirmation', async ({ page }) => {
    await completeAssessment(page);

    await page.route(`**/api/assessments/${FAKE_ASSESSMENT_ID}/whatsapp`, async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });

    await page.getByRole('button', { name: /send to whatsapp/i }).click();
    await page.getByPlaceholder('971501234567').fill('971501234567');
    await page.getByRole('button', { name: /^send$/i }).click();

    await expect(page.getByText(/check whatsapp/i)).toBeVisible();
  });
});

test.describe('privacy center — anonymous PDPL request form', () => {
  test('submits an access request and shows a confirmation', async ({ page }) => {
    await page.route('**/api/privacy/request', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });

    await page.goto('/privacy-center');
    await page.locator('input#fullName').fill('Jane Doe');
    await page.locator('input#email').fill('jane@example.com');
    await page.locator('select#requestType').selectOption('access');
    await page.getByRole('button', { name: /submit request/i }).click();

    await expect(page.getByText('Request received')).toBeVisible();
  });

  test('submits an erasure request and shows a confirmation', async ({ page }) => {
    await page.route('**/api/privacy/request', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });

    await page.goto('/privacy-center');
    await page.locator('input#fullName').fill('John Smith');
    await page.locator('input#email').fill('john@example.com');
    await page.locator('select#requestType').selectOption('erasure');
    await page.getByRole('button', { name: /submit request/i }).click();

    await expect(page.getByText('Request received')).toBeVisible();
  });
});

test.describe('partners — application form', () => {
  test('submits a partner application and shows a confirmation', async ({ page }) => {
    await page.route('**/api/partners/apply', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });

    await page.goto('/partners');
    await page.locator('input#organizationName').fill('Acme Consulting');
    await page.locator('select#partnerType').selectOption('consultancy');
    await page.locator('input#contactName').fill('Jane Doe');
    await page.locator('input#contactEmail').fill('jane@acme-consulting.com');
    await page.getByRole('button', { name: /apply to partner/i }).click();

    await expect(page.getByText('Application received')).toBeVisible();
  });
});
