import { test, expect } from '@playwright/test';
import { registerAndLogin } from './utils/utils';

test('should render homepage correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();
    await expect(page.getByRole('button', { name: /reset filters/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /filter by category/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /filter by price/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /load more/i })).toBeVisible();
    // expect at least one product card and it should be rendered correctly
    await expect(page.locator('.card').first()).toBeVisible();
    await expect(page.getByRole('img').first()).toBeVisible();
    await expect(page.locator('.card').first().getByRole('button', { name: /more details/i })).toBeVisible();
    await expect(page.locator('.card').first().getByRole('button', { name: /add to cart/i })).toBeVisible();
});

test('should filter by checkbox and reset filters', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();

    const productCards = page.locator('.card.m-2');
    const initialCount = await productCards.count();

    await page.getByRole('checkbox', { name: 'Book' }).check();

    // Expect filtered results (count > 0 and not more than initial)
    await expect(productCards.first()).toBeVisible();
    const filteredCount = await productCards.count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    await page.getByRole('button', { name: /reset filters/i }).click();
    await expect(productCards.first()).toBeVisible();

    const resetCount = await productCards.count();
    expect(resetCount).toBeGreaterThanOrEqual(initialCount);
});

test('should filter by radio button and reset filters', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();

    const initialProductCards = page.locator('.card.m-2');
    const initialCardCount = await initialProductCards.count();

    await page.getByRole('radio', { name: '$0 to' }).click();

    // Check that all product cards have prices less than $19
    const productCards = page.locator('.card.m-2');
    const cardCount = await productCards.count();

    for (let i = 0; i < cardCount - 1; i++) {
        const card = productCards.nth(i);
        const priceElement = card.locator('.card-price');
        const priceText = await priceElement.textContent();

        const priceMatch = priceText?.match(/\$?([\d,]+\.?\d*)/);
        if (priceMatch) {
            const price = parseFloat(priceMatch[1].replace(',', ''));
            expect(price).toBeLessThan(19);
        }
    }

    await page.getByRole('button', { name: /reset filters/i }).click();

    // Check that there is at least one product with price more than $19
    let hasProductGreaterThan19Dollars = false;

    for (let i = 0; i < initialCardCount; i++) {
        const card = initialProductCards.nth(i);
        const priceElement = card.locator('.card-price');
        const priceText = await priceElement.textContent();

        const priceMatch = priceText?.match(/\$?([\d,]+\.?\d*)/);
        if (priceMatch) {
            const price = parseFloat(priceMatch[1].replace(',', ''));
            if (price > 19) {
                hasProductGreaterThan19Dollars = true;
                break;
            }
        }
    }
    expect(hasProductGreaterThan19Dollars).toBe(true);
});

test('should filter by checkbox AND radio and reset filters', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();

    const productCards = page.locator('.card.m-2');
    await expect(productCards.first()).toBeVisible();
    const initialCount = await productCards.count();
    expect(initialCount).toBeGreaterThan(0);

    await page.getByRole('checkbox', { name: 'Book' }).check();
    await page.getByRole('radio', { name: /\$0 to/i }).click();

    await page.waitForTimeout(1000);
    const filteredCount = await productCards.count();

    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    const priceTexts = await productCards.locator('.card-price').allTextContents();
    const prices = priceTexts
      .map(t => parseFloat(t.replace(/[^0-9.]/g, '')))
      .filter(Boolean);

    for (const price of prices) {
      expect(price).toBeLessThan(19);
    }

    await page.getByRole('button', { name: /reset filters/i }).click();

    // wait for page to reload (reset triggers reload)
    await page.waitForLoadState('domcontentloaded');

    const resetCards = page.locator('.card.m-2');
    await expect(resetCards.first()).toBeVisible();
    const resetCount = await resetCards.count();
    expect(resetCount).toBeGreaterThanOrEqual(initialCount);

    const resetPriceTexts = await resetCards.locator('.card-price').allTextContents();
    const resetPrices = resetPriceTexts
      .map(t => parseFloat(t.replace(/[^0-9.]/g, '')))
      .filter(Boolean);

    const hasProductGreaterThan19 = resetPrices.some(price => price > 19);
    expect(hasProductGreaterThan19).toBe(true);
  });


test('should allow user to view details and go back to homepage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();
    await page.getByRole('button', { name: /more details/i }).first().click();

    await expect(page).toHaveURL(/\/product\//);
    await page.goBack({ waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL("/");
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();
});

test('should allow user to add to cart from homepage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();

    await page.getByRole('button', { name: /add to cart/i }).first().click();
    await expect(page.getByText(/item added to cart/i)).toBeVisible();

    const cart = await page.evaluate(() => {
        const raw = localStorage.getItem('cart');
        return raw ? JSON.parse(raw) : null;
    });
    expect(cart?.length).toBe(1);
});

test('should allow logged-in user to view product details and add to cart', async ({ page }) => {
    const email = `johnnie+${Date.now()}@test.com`;
    await registerAndLogin(page, { email });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();

    await page.getByRole('button', { name: /more details/i }).first().click();
    await expect(page).toHaveURL(/\/product\//);

    await page.goBack({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();

    await page.getByRole('button', { name: /add to cart/i }).first().click();
    await expect(page.getByText(/item added to cart/i)).toBeVisible();

    const cart = await page.evaluate(() => {
        const raw = localStorage.getItem('cart');
        return raw ? JSON.parse(raw) : null;
    });

    expect(cart?.length).toBe(1);
});


test('should have empty page when there is api error retrieving products', async ({ page }) => {
    await page.route('**/api/v1/product/product-list/**', route => route.abort());

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();

    // expect no product cards
    await expect(page.locator('.card').first()).not.toBeVisible();
    await expect(page.locator('.card').first().getByRole('button', { name: /more details/i })).not.toBeVisible();
    await expect(page.locator('.card').first().getByRole('button', { name: /add to cart/i })).not.toBeVisible();
});

test('items should stay the same when there is api error retrieving more products', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.route('**/api/v1/product/product-list/**', route => route.abort());

    const initialCount = await page.locator('.card').count();
    await page.getByRole('button', { name: /load more/i }).click();

    // count should stay the same since api call failed
    await expect(page.locator('.card')).toHaveCount(initialCount);
});

test('add to cart fails gracefully', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
        localStorage.setItem = () => { throw new Error('Error'); };
    });

    await page.getByRole('button', { name: /add to cart/i }).first().click();
    await page.goto('/cart');
    await expect(page.getByText(/your cart is empty/i)).toBeVisible();
});
