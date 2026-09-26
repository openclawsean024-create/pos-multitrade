import { test, expect } from '@playwright/test';

test.describe('POS workbench smoke', () => {
  test('workbench renders, seeds default profile, and completes checkout', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/');
    await expect(page.getByTestId('pos-workbench')).toBeVisible({ timeout: 30_000 });

    // Wait for catalogue to populate from IndexedDB
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

    // Profile title should reflect the default fnb industry
    await expect(page.getByTestId('profile-title')).toContainText(/Food & Beverage|餐飲業/);

    // Add a product to the cart
    const firstProduct = page.getByTestId('products').locator('.product').first();
    await firstProduct.click();
    await expect(page.getByTestId('cart-count')).toContainText(/1 items/);

    // Select credit payment and checkout
    await page.getByTestId('payment-credit').click();
    await page.getByTestId('complete').click();
    await expect(page.getByTestId('checkout-success')).toBeVisible({ timeout: 15_000 });

    // Cart should be cleared after checkout
    await expect(page.getByTestId('cart-empty')).toBeVisible();
  });

  test('does not claim cloud sync, tax, hardware, or live payments', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await expect(page.getByTestId('pos-workbench')).toBeVisible({ timeout: 30_000 });
    const text = await page.content();
    expect(text).not.toMatch(/cloud sync|雲端同步/);
    expect(text).not.toMatch(/hardware|硬體/i);
    expect(text).not.toMatch(/e-?invoice|電子發票/);
  });
});
