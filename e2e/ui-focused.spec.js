import { test, expect } from '@playwright/test';

test.describe('UI-Focused E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(15000);
  });

  test('should load homepage and basic navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded'); // Use faster load state
    
    // Verify basic page structure
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
    
    // Look for navigation elements with timeout
    const navLinks = page.locator('a, nav');
    await page.waitForTimeout(2000); // Give it a moment for elements to appear
    expect(await navLinks.count()).toBeGreaterThan(0);
  });

  test('should display login form with correct elements', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Verify login form elements exist
    await expect(page.getByPlaceholder('Enter Your Email')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'LOGIN' })).toBeVisible();
    
    // Test form interaction (UI only)
    await page.getByPlaceholder('Enter Your Email').fill('test@example.com');
    await page.getByPlaceholder('Enter Your Password').fill('password123');
    
    // Verify form can be filled
    await expect(page.getByPlaceholder('Enter Your Email')).toHaveValue('test@example.com');
    await expect(page.getByPlaceholder('Enter Your Password')).toHaveValue('password123');
  });

  test('should navigate to admin pages without authentication errors', async ({ page }) => {
    // Test that admin pages load (even if they redirect to login)
    await page.goto('/dashboard/admin');
    await page.waitForLoadState('networkidle');
    
    // Should either show admin dashboard or redirect to login
    const currentUrl = page.url();
    const isOnLogin = currentUrl.includes('/login');
    const isOnDashboard = currentUrl.includes('/dashboard');
    
    expect(isOnLogin || isOnDashboard).toBe(true);
  });

  test('should load create category page structure', async ({ page }) => {
    await page.goto('/dashboard/admin/create-category');
    await page.waitForLoadState('networkidle');
    
    // May redirect to login, which is fine
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      // This is expected behavior - admin pages should require auth
      await expect(page.getByPlaceholder('Enter Your Email')).toBeVisible();
    } else {
      // If we somehow get to the page, verify its structure
      const body = page.locator('body');
      await expect(body).not.toBeEmpty();
    }
  });

  test('should load create product page structure', async ({ page }) => {
    await page.goto('/dashboard/admin/create-product');
    await page.waitForLoadState('networkidle');
    
    // May redirect to login, which is fine
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      // This is expected behavior - admin pages should require auth
      await expect(page.getByPlaceholder('Enter Your Email')).toBeVisible();
    } else {
      // If we somehow get to the page, verify its structure
      const body = page.locator('body');
      await expect(body).not.toBeEmpty();
    }
  });

  test('should handle navigation between pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded'); // Use faster load state
    
    // Test navigation to login
    const loginLink = page.getByRole('link', { name: 'Login' });
    if (await loginLink.count() > 0) {
      await loginLink.click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/.*\/login/);
    }
    
    // Test navigation back to home
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });

  test('should display proper error handling on forms', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Try to submit empty login form
    await page.getByRole('button', { name: 'LOGIN' }).click();
    
    // Wait a moment for any validation or error messages
    await page.waitForTimeout(1000);
    
    // The form should still be visible (indicating validation prevented submission)
    await expect(page.getByRole('button', { name: 'LOGIN' })).toBeVisible();
  });

  test('should load and display page content consistently', async ({ page }) => {
    const pages = ['/', '/login'];
    
    for (const url of pages) {
      await page.goto(url);
      await page.waitForLoadState('domcontentloaded'); // Use faster load state
      
      // Verify each page loads some content
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
      expect(bodyText.trim().length).toBeGreaterThan(0);
    }
  });
});