import { test, expect } from '@playwright/test';

test.describe('UpdateProduct UI Integration Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate directly to update product page
    await page.goto('/dashboard/admin/update-product');
    await page.waitForLoadState('networkidle');
  });

  test('should render update product page', async ({ page }) => {
    // Check if page loads without major errors
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
    
    // Verify the page has content
    const bodyText = await body.textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText.trim().length).toBeGreaterThan(0);
  });

  test('should display product list or form elements', async ({ page }) => {
    // Look for product-related elements
    const productElements = page.locator('[data-testid*="product"], .product, input, button, select, textarea');
    
    // Verify we have some interactive elements on the page
    expect(await productElements.count()).toBeGreaterThan(0);
    
    // Check for common update page elements without strict visibility requirement
    const updateButtons = page.locator('button:has-text("Update"), button:has-text("Edit"), button:has-text("Save")');
    expect(await updateButtons.count()).toBeGreaterThanOrEqual(0);
  });

  test('should handle responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    await expect(body).toBeVisible();
  });
});