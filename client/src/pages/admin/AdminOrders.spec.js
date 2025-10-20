// client/src/pages/admin/AdminOrders.spec.js
import { test, expect } from '@playwright/test';

test.describe('AdminOrders UI Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 1) Pretend we’re logged in as an admin BEFORE the app initializes
    await page.addInitScript(() => {
      localStorage.setItem(
        'auth',
        JSON.stringify({
          user: { _id: 'u1', name: 'Admin User', email: 'admin@test.com', role: 1 },
          token: 'FAKE_TOKEN'
        })
      );
    });

    // 2) Stub auth guard endpoint
    await page.route('**/api/v1/auth/admin-auth', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
    );

    // 3) Default orders (tests override when needed)
    await page.route('**/api/v1/auth/all-orders', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'o1',
            status: 'Processing',
            buyer: { name: 'Alice' },
            createAt: new Date().toISOString(),
            payment: { success: true },
            products: [{ _id: 'p1', name: 'Book', description: 'A book desc', price: 10 }],
          },
        ]),
      })
    );

    // images
    await page.route('**/api/v1/product/product-photo/**', route => route.fulfill({ status: 204, body: '' }));

    // 4) Go to Admin Orders
    await page.goto('/dashboard/admin/orders');
    await page.waitForLoadState('networkidle');
  });

  test('renders list of orders with table(s) and basic structure', async ({ page }) => {
    await expect(page.getByText(/All Orders/i)).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible();
    await expect(page.getByText(/Processing/i)).toBeVisible();
    await expect(page.getByText(/Alice/i)).toBeVisible();
  });

  test('status change triggers PUT and page reflects updated status', async ({ page }) => {
    let putCalled = false;

    // Return "Processing" initially, "Shipped" after PUT
    await page.unroute('**/api/v1/auth/all-orders');
    await page.route('**/api/v1/auth/all-orders', route => {
      const initial = [{
        _id: 'o1',
        status: 'Processing',
        buyer: { name: 'Alice' },
        createAt: new Date().toISOString(),
        payment: { success: true },
        products: [{ _id: 'p1', name: 'Book', description: 'A book desc', price: 10 }],
      }];
      const after = [{ ...initial[0], status: 'Shipped' }];
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(putCalled ? after : initial),
      });
    });

    await page.route('**/api/v1/auth/order-status/*', route => {
      putCalled = true;
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    // Open AntD Select and choose "Shipped" from the visible dropdown (portal)
    await page.locator('.ant-select-selector').first().click();
    const dropdown = page.locator('.ant-select-dropdown:visible').first();
    await expect(dropdown).toBeVisible();
    await dropdown.getByRole('option', { name: 'Shipped' }).click();

    // Re-fetch happened, UI shows updated status
    const row = page.locator('[data-test="order-row"]').first();
    await expect(row.locator('[data-test="status-cell"] .ant-select-selection-item')).toHaveText('Shipped');
  });

  test('PUT failure -> UI survives and status does not change', async ({ page }) => {
    // Keep GET static at "Processing"
    await page.unroute('**/api/v1/auth/all-orders');
    await page.route('**/api/v1/auth/all-orders', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'o1',
            status: 'Processing',
            buyer: { name: 'Alice' },
            createAt: new Date().toISOString(),
            payment: { success: true },
            products: [{ _id: 'p1', name: 'Book', description: 'A book desc', price: 10 }],
          },
        ]),
      })
    );

    // Force PUT to fail
    await page.route('**/api/v1/auth/order-status/*', route =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ ok: false }) })
    );

    await page.locator('.ant-select-selector').first().click();
    const dropdown = page.locator('.ant-select-dropdown:visible').first();
    await expect(dropdown).toBeVisible();
    await dropdown.getByRole('option', { name: 'Shipped' }).click();

    // Still shows original status and table still present
    await expect(page.getByText('Processing')).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('empty GET -> shows empty state (or at least no tables)', async ({ page }) => {
    await page.unroute('**/api/v1/auth/all-orders');
    await page.route('**/api/v1/auth/all-orders', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('table')).toHaveCount(0);
    await expect(page.getByText(/All Orders/i)).toBeVisible();
  });
});
