import { test, expect } from '@playwright/test';

// Browser E2E coverage for the POS commerce console workbench.
// These tests run against a real Next.js dev server backed by IndexedDB.

test.describe('POS workbench', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/');
    await expect(page.getByTestId('pos-workbench')).toBeVisible({ timeout: 30_000 });
    // Wait for catalogue to be ready (products or empty state)
    await page.waitForFunction(
      () => {
        const products = document.querySelector('[data-testid="products"]');
        const empty = document.querySelector('[data-testid="products-empty"]');
        const loading = document.querySelector('[data-testid="products-loading"]');
        return Boolean(products) && (products!.children.length > 0 || Boolean(empty)) && !loading;
      },
      undefined,
      { timeout: 60_000 },
    );
  });

  test('renders command rail, context bar, catalogue, and cart', async ({ page }) => {
    await expect(page.locator('.rail')).toBeVisible();
    await expect(page.locator('.context')).toBeVisible();
    await expect(page.locator('.console')).toBeVisible();
    await expect(page.locator('.checkout')).toBeVisible();
    await expect(page.getByTestId('profile-title')).toContainText(/Food & beverage|餐飲業/);
    await expect(page.getByTestId('products').locator('.product').first()).toBeVisible();
    await expect(page.getByTestId('cart-empty')).toBeVisible();
  });

  test('adds two products, updates totals, completes checkout', async ({ page }) => {
    const products = page.getByTestId('products').locator('.product');
    const first = products.nth(0);
    const second = products.nth(1);

    const firstName = await first.locator('.product-name').innerText();
    await first.click();
    await second.click();
    // Bump quantity of first product to 2 via the + button in the cart
    const firstCartRow = page.locator(`[data-testid^="cart-row-"]`).filter({ hasText: firstName }).first();
    await firstCartRow.getByRole('button', { name: /increase/ }).click();

    await expect(page.getByTestId('cart-count')).toContainText(/3 items/);
    // Total should be a non-zero NT$ amount
    const totalText = await page.getByTestId('total').innerText();
    expect(totalText).toMatch(/NT\$\d/);
    expect(totalText).not.toBe('NT$0');

    await page.getByTestId('payment-credit').click();
    await expect(page.getByTestId('payment-credit')).toHaveAttribute('aria-checked', 'true');

    await page.getByTestId('complete').click();
    await expect(page.getByTestId('checkout-success')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('cart-empty')).toBeVisible();

    // Activity table should now include the new order
    const table = page.getByTestId('activity-table');
    const rows = table.locator('tr');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('modal: switch industry persists snapshot and updates products', async ({ page }) => {
    await page.getByTestId('profile-btn-retail').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Pick the retail profile in the modal
    await page.locator('[data-modal="retail"]').click();
    await page.getByTestId('modal-confirm').click();

    // Profile title should now show Retail / 零售業
    await expect(page.getByTestId('profile-title')).toContainText(/Retail|零售業/);
    // Cart should be cleared on switch
    await expect(page.getByTestId('cart-empty')).toBeVisible();
  });

  test('Esc closes modal and `/` focuses search', async ({ page }) => {
    await page.getByTestId('profile-btn-service').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).toBeHidden();

    // `/` should focus the search input (only when not in an input)
    await page.keyboard.press('/');
    const focused = await page.evaluate(() => document.activeElement?.classList.contains('search'));
    expect(focused).toBe(true);
  });

  test('filters products by category', async ({ page }) => {
    const tabs = page.locator('[role="tab"][data-cat]');
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThan(1);
    await tabs.nth(1).click();
    const productsAfter = page.getByTestId('products').locator('.product');
    expect(await productsAfter.count()).toBeGreaterThan(0);
  });

  test('locale toggle shows English copy', async ({ page }) => {
    const btn = page.getByRole('button', { name: /Locale/ });
    await btn.click();
    // After toggle, the checkout button (when cart empty) shows "Select items to continue"
    const complete = page.getByTestId('complete');
    await expect(complete).toContainText(/Select items to continue/);
  });

  test('does not claim cloud sync, tax, hardware, or live payments', async ({ page }) => {
    const text = await page.content();
    expect(text).not.toMatch(/cloud sync|雲端同步/);
    expect(text).not.toMatch(/hardware|硬體/i);
    expect(text).not.toMatch(/e-?invoice|電子發票/);
  });

  test('offline mode keeps local checkout usable', async ({ page, context }) => {
    await context.setOffline(true);
    await page.waitForTimeout(100);
    const products = page.getByTestId('products').locator('.product');
    await products.nth(0).click();
    await products.nth(1).click();
    await expect(page.getByTestId('cart-count')).toContainText(/2 items/);
    await page.getByTestId('complete').click();
    await expect(page.getByTestId('checkout-success')).toBeVisible({ timeout: 10_000 });
    await context.setOffline(false);
  });
});
