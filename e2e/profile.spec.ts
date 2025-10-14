import { test, expect } from '@playwright/test';
import { registerAndLogin } from './utils/utils';

test.describe('Profile Form Management', () => {
  let email: string;

  test.beforeEach(async ({ page }) => {
    email = `johnnie+${Date.now()}@test.com`;
    await registerAndLogin(page, { email });

    await page.getByRole('button', { name: 'John' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();

    await page.getByRole("link", { name: "Profile" }).click();
    await expect(page.getByRole("heading", { name: /User Profile/i })).toBeVisible();
  });

  test('should display current user profile information', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'USER PROFILE' })).toBeVisible();

    await expect(page.getByRole('textbox', { name: 'name' })).toHaveValue('John');
    await expect(page.getByRole('textbox', { name: 'email' })).toHaveValue(email);
    await expect(page.getByRole('textbox', { name: 'phone' })).toHaveValue('98765432');
    await expect(page.getByRole('textbox', { name: 'address' })).toHaveValue('123 Street');

    // Email should be disabled
    await expect(page.getByRole('textbox', { name: 'email' })).toBeDisabled();
  });

  test('should update profile information successfully', async ({ page }) => {
    await page.getByRole('textbox', { name: 'name' }).fill('Updated Name');
    await page.getByRole('textbox', { name: 'phone' }).fill('9876543210');
    await page.getByRole('textbox', { name: 'address' }).fill('456 Updated Street');
    await page.getByRole('textbox', { name: 'password' }).fill('NewPass123!');

    await page.getByRole('button', { name: 'UPDATE' }).click();

    await expect(page.getByText('Profile Updated Successfully')).toBeVisible();

    await expect(page.getByRole('textbox', { name: 'name' })).toHaveValue('Updated Name');
    await expect(page.getByRole('textbox', { name: 'phone' })).toHaveValue('9876543210');
    await expect(page.getByRole('textbox', { name: 'address' })).toHaveValue('456 Updated Street');

    // header button should have been updated as well
    await expect(page.getByRole('button', { name: 'Updated Name' })).toBeVisible();
  });

  test('should validate phone number format', async ({ page }) => {
    await page.getByRole('textbox', { name: 'phone' }).fill('123');
    await page.getByRole('button', { name: 'UPDATE' }).click();

    await expect(page.getByText('Phone number must be 8–15 digits only')).toBeVisible();
  });

  test('should validate password strength', async ({ page }) => {
    await page.getByRole('textbox', { name: 'password' }).fill('weak');
    await page.getByRole('button', { name: 'UPDATE' }).click();

    await expect(page.getByText(/Must be at least 8 characters, 1 uppercase letter and 1 special character/)).toBeVisible();
  });

  test('should allow updating profile without password', async ({ page }) => {
    await page.getByRole('textbox', { name: 'name' }).fill('Name Without Password');
    await page.getByRole('textbox', { name: 'address' }).fill('Address Without Password');
    await page.getByRole('textbox', { name: 'password' }).fill('');
    await page.getByRole('button', { name: 'UPDATE' }).click();

    await expect(page.getByText('Profile Updated Successfully')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'name' })).toHaveValue('Name Without Password');
    await expect(page.getByRole('textbox', { name: 'address' })).toHaveValue('Address Without Password');
  });

  test('should persist profile changes after page refresh', async ({ page }) => {
    await page.getByRole('textbox', { name: 'name' }).fill('Persistent Name');
    await page.getByRole('textbox', { name: 'address' }).fill('Persistent Address');
    await page.getByRole('button', { name: 'UPDATE' }).click();

    await expect(page.getByText('Profile Updated Successfully')).toBeVisible();

    await page.reload();

    await expect(page.getByRole('textbox', { name: 'name' })).toHaveValue('Persistent Name');
    await expect(page.getByRole('textbox', { name: 'address' })).toHaveValue('Persistent Address');
  });

  test('should show error for server-side validation failures', async ({ page }) => {
    await page.getByRole('textbox', { name: 'name' }).fill('');
    await page.getByRole('textbox', { name: 'phone' }).fill('invalid-phone');
    await page.getByRole('button', { name: 'UPDATE' }).click();

    await expect(page.getByText('Please fix the errors before submitting')).toBeVisible();
  });
});

test.describe('Profile Password Update Test', () => {
  let email: string;

  test.beforeEach(async ({ page }) => {
    email = `johnnie+${Date.now()}@test.com`;
    await registerAndLogin(page, { email });

    await page.getByRole('button', { name: 'John' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();

    await page.getByRole("link", { name: "Profile" }).click();
    await expect(page.getByRole("heading", { name: /User Profile/i })).toBeVisible();
  });

  test('should update password, logout and login with the new password', async ({ page }) => {
    const newPassword = 'NewPassword123!';

    await expect(page.getByRole('heading', { name: 'USER PROFILE' })).toBeVisible();
    await page.getByRole('textbox', { name: 'password' }).fill(newPassword);
    await page.getByRole('button', { name: 'UPDATE' }).click();
    await expect(page.getByText('Profile Updated Successfully')).toBeVisible();

    await page.getByRole('button', { name: 'John' }).click();
    await page.getByRole('link', { name: 'Logout' }).click();

    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(email);
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(newPassword);
    await page.getByRole('button', { name: 'LOGIN' }).click();

    await expect(page.getByText('🙏Login Successful')).toBeVisible();
    await expect(page.getByRole('button', { name: 'John' })).toBeVisible();
  });

  test('should login with old credentials when there is profile update error', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'USER PROFILE' })).toBeVisible();

    await page.route('**/api/v1/auth/profile', route => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 500, body: JSON.stringify({ success: false, message: 'Internal Error' }) });
      }
      return route.continue();
    });

    await page.getByRole('textbox', { name: 'password' }).fill('TmpPass123!');
    await page.getByRole('button', { name: 'UPDATE' }).click();

    await expect(page.getByText('Something went wrong')).toBeVisible();

    await page.getByRole('button', { name: 'John' }).click();
    await page.getByRole('link', { name: 'Logout' }).click();

    // Login with old credentials should still work
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(email);
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('Password123!');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page.getByText('🙏Login Successful')).toBeVisible();
    await expect(page.getByRole('button', { name: 'John' })).toBeVisible();
  });
})

test.describe('Profile Dashboard Update Test', () => {
  test('should show updated profile details on dashboard', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'USER PROFILE' })).toBeVisible();
    await page.getByRole('textbox', { name: 'name' }).fill('New Name');
    await page.getByRole('textbox', { name: 'address' }).fill('999 New Ave');
    await page.getByRole('button', { name: 'UPDATE' }).click();
    await expect(page.getByText('Profile Updated Successfully')).toBeVisible();

    await page.getByRole('button', { name: 'New Name' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page.getByRole('heading', { name: /Name:\s*New Name/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Address:\s*999 New Ave/i })).toBeVisible();
  });

  test('dashboard details should not change when there is profile update error ', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'USER PROFILE' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'name' })).toHaveValue('John');
    await expect(page.getByRole('textbox', { name: 'address' })).toHaveValue('123 Street');

    await page.route('**/api/v1/auth/profile', route => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Failed to update' })
        });
      }
      return route.continue();
    });

    await page.getByRole('textbox', { name: 'name' }).fill('Should Not Apply');
    await page.getByRole('textbox', { name: 'address' }).fill('Should Not Apply Address');
    await page.getByRole('button', { name: 'UPDATE' }).click();

    await expect(page.getByText('Failed to update')).toBeVisible();

    await page.getByRole('button', { name: 'John' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page.getByRole('heading', { name: /Name:\s*John/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Address:\s*123 Street/i })).toBeVisible();
  });
});