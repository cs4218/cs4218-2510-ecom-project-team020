import { test, expect } from '@playwright/test';
import { registerAndLogin } from './utils/utils';

test.describe('Dashboard Managment', () => {
  let email: string;

  test.beforeEach(async ({ page }) => {
    email = `johnnie+${Date.now()}@test.com`;
    await registerAndLogin(page, { email });

    await page.getByRole('button', { name: 'John' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
  });

  test('should display user details correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Name:\s*John/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: new RegExp(`Email:\\s*${email}`) })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Address:\s*123 Street/i })).toBeVisible();
  });

  test('should show user menu links on dashboard', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Profile' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible();
  });
});
