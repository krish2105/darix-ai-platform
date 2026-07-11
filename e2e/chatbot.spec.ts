import { test, expect } from '@playwright/test';

// Same interception strategy as e2e/checkout-and-forms.spec.ts: the real
// Gemini-backed route is mocked with a canned streamed response so this
// runs deterministically without a real GEMINI_API_KEY.
test.describe('FAQ chatbot widget', () => {
  test('opens, sends a message, and renders the streamed reply', async ({ page }) => {
    await page.route('**/api/chatbot/faq', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: 'Darix AI has a free tier and paid plans.',
      });
    });

    await page.goto('/');

    await page.getByRole('button', { name: /chat with darix ai/i }).click();
    await expect(page.getByText(/ask me anything about darix ai/i)).toBeVisible();

    await page.getByPlaceholder('Type a message…').fill('What does it cost?');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByText('Darix AI has a free tier and paid plans.')).toBeVisible();
  });

  test('shows a graceful error when the assistant is unavailable', async ({ page }) => {
    await page.route('**/api/chatbot/faq', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'The assistant is temporarily unavailable.' }),
      });
    });

    await page.goto('/');
    await page.getByRole('button', { name: /chat with darix ai/i }).click();
    await page.getByPlaceholder('Type a message…').fill('Hello');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByText('The assistant is temporarily unavailable.')).toBeVisible();
  });
});
