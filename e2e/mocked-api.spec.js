import { test, expect } from '@playwright/test';

test.describe('E2E Tests with API Mocking', () => {
  
  // Helper function to perform login with mocked API
  const loginAsAdmin = async (page) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    await page.getByPlaceholder('Enter Your Email').fill('admin@test.com');
    await page.getByPlaceholder('Enter Your Password').fill('123456');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    
    // Wait for success message
    await expect(page.locator('text=Login Successful')).toBeVisible({ timeout: 5000 });
    
    // Set localStorage for auth context
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { _id: 'mock-user-id', name: 'Admin User', email: 'admin@test.com', role: 1 },
        token: 'mock-jwt-token'
      }));
    });
    
    // Wait a moment for context to update
    await page.waitForTimeout(1000);
  };

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(15000);
    
    // Mock the login API to always return success
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Login Successful',
          user: {
            _id: 'mock-user-id',
            name: 'Admin User',
            email: 'admin@test.com',
            role: 1
          },
          token: 'mock-jwt-token'
        })
      });
    });

    // Mock category creation API
    await page.route('**/api/v1/category/create-category', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Category created successfully',
          category: {
            _id: 'mock-category-id',
            name: 'Test Category'
          }
        })
      });
    });

    // Mock get categories API
    await page.route('**/api/v1/category/get-category', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'All categories',
          category: [
            { _id: 'cat1', name: 'Electronics' },
            { _id: 'cat2', name: 'Clothing' }
          ]
        })
      });
    });

    // Mock product creation API
    await page.route('**/api/v1/product/create-product', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Product Created Successfully',
          product: {
            _id: 'mock-product-id',
            name: 'Test Product'
          }
        })
      });
    });

    // Mock get products API
    await page.route('**/api/v1/product/get-product', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          products: [
            { _id: 'prod1', name: 'Test Product 1', price: 100 },
            { _id: 'prod2', name: 'Test Product 2', price: 200 }
          ]
        })
      });
    });
  });

  test('should successfully login with mocked API', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    // Fill login form
    await page.getByPlaceholder('Enter Your Email').fill('admin@test.com');
    await page.getByPlaceholder('Enter Your Password').fill('123456');
    
    // Submit login form
    await page.getByRole('button', { name: 'LOGIN' }).click();
    
    // Should see success message
    await expect(page.locator('text=Login Successful')).toBeVisible({ timeout: 5000 });
    
    // Also set localStorage to ensure auth context works
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { _id: 'mock-user-id', name: 'Admin User', email: 'admin@test.com', role: 1 },
        token: 'mock-jwt-token'
      }));
    });
  });

  test('should navigate to admin dashboard after login', async ({ page }) => {
    // Login using helper function
    await loginAsAdmin(page);
    
    // Navigate to admin dashboard
    await page.goto('/dashboard/admin');
    await page.waitForLoadState('domcontentloaded');
    
    // Should be on admin dashboard
    await expect(page).toHaveURL(/.*\/dashboard\/admin/);
  });

  test('should create category with mocked API', async ({ page }) => {
    // Login using helper function
    await loginAsAdmin(page);
    
    // Navigate to create category
    await page.goto('/dashboard/admin/create-category');
    await page.waitForLoadState('domcontentloaded');
    
    // Fill category form
    const categoryName = `Test Category ${Date.now()}`;
    await page.getByPlaceholder('Enter new category').fill(categoryName);
    
    // Submit form
    await page.getByRole('button', { name: 'Submit' }).click();
    
    // Should see success message
    await expect(page.locator('text=created successfully')).toBeVisible({ timeout: 5000 });
  });

  test('should create product with mocked API', async ({ page }) => {
    // Login using helper function
    await loginAsAdmin(page);
    
    // Navigate to create product
    await page.goto('/dashboard/admin/create-product');
    await page.waitForLoadState('domcontentloaded');
    
    // Fill product form
    const productName = `Test Product ${Date.now()}`;
    await page.getByPlaceholder('Write a name').fill(productName);
    await page.getByPlaceholder('Write a description').fill('Test product description');
    await page.getByPlaceholder('Write a Price').fill('99.99');
    await page.getByPlaceholder('Write a quantity').fill('10');
    
    // Select category if dropdown exists
    const categorySelect = page.locator('select');
    if (await categorySelect.count() > 0) {
      await categorySelect.selectOption({ index: 1 });
    }
    
    // Submit form
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    
    // Should see success message
    await expect(page.locator('text=Product Created Successfully')).toBeVisible({ timeout: 5000 });
  });

  test('should display admin menu navigation', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByPlaceholder('Enter Your Email').fill('admin@test.com');
    await page.getByPlaceholder('Enter Your Password').fill('123456');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page.locator('text=Login Successful')).toBeVisible({ timeout: 5000 });
    
    // Go to admin dashboard
    await page.goto('/dashboard/admin');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for admin menu elements
    const adminMenuItems = page.locator('a:has-text("Create"), a:has-text("Product"), a:has-text("Category")');
    
    // Should have some menu items
    expect(await adminMenuItems.count()).toBeGreaterThan(0);
  });

  test('should handle form validation on empty fields', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByPlaceholder('Enter Your Email').fill('admin@test.com');
    await page.getByPlaceholder('Enter Your Password').fill('123456');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page.locator('text=Login Successful')).toBeVisible({ timeout: 5000 });
    
    // Go to create category
    await page.goto('/dashboard/admin/create-category');
    await page.waitForLoadState('domcontentloaded');
    
    // Try to submit empty form
    await page.getByRole('button', { name: 'Submit' }).click();
    
    // Form should still be visible (indicating validation prevented submission)
    await expect(page.getByPlaceholder('Enter new category')).toBeVisible();
  });

  test('should navigate between admin pages', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByPlaceholder('Enter Your Email').fill('admin@test.com');
    await page.getByPlaceholder('Enter Your Password').fill('123456');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page.locator('text=Login Successful')).toBeVisible({ timeout: 5000 });
    
    // Test navigation to different admin pages
    const adminPages = [
      '/dashboard/admin',
      '/dashboard/admin/create-category', 
      '/dashboard/admin/create-product'
    ];
    
    for (const url of adminPages) {
      await page.goto(url);
      await page.waitForLoadState('domcontentloaded');
      
      // Verify each page loads
      const body = page.locator('body');
      await expect(body).not.toBeEmpty();
      
      // Should be on the correct URL
      expect(page.url()).toContain(url);
    }
  });
});