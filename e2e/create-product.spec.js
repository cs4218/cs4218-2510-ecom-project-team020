import { test, expect } from '@playwright/test';

test.describe('Create Product - True E2E Tests', () => {

  // Real admin credentials
  const ADMIN_CREDENTIALS = {
    email: 'gerald@gmail.com',
    password: 'Testing#'
  };

  // Helper function to perform real admin login
  const loginAsAdmin = async (page) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('domcontentloaded');
    
    // Fill real login credentials - NO MOCKING
    await page.getByPlaceholder('Enter Your Email').fill(ADMIN_CREDENTIALS.email);
    await page.getByPlaceholder('Enter Your Password').fill(ADMIN_CREDENTIALS.password);
    await page.getByRole('button', { name: 'LOGIN' }).click();
    
    // Wait for real authentication success
    await expect(page.locator('text=Login Successful')).toBeVisible({ timeout: 10000 });
    
    // Wait for auth context to update
    await page.waitForTimeout(2000);
  };

  // Helper function to get test category ID
  const getTestCategoryId = async (page) => {
    const categoriesResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/v1/category/get-category');
        const data = await response.json();
        return data.categories?.find(cat => cat.name === 'Electronics')?._id || 
               data.categories?.[0]?._id;
      } catch (error) {
        return null;
      }
    });
    return categoriesResponse;
  };

  // Helper function to delete a product
  const deleteProduct = async (page, productId) => {
    if (!productId) return false;
    
    const deleteResponse = await page.evaluate(async (pid) => {
      try {
        const authData = localStorage.getItem('auth');
        const { token } = JSON.parse(authData);
        
        const response = await fetch(`/api/v1/product/delete-product/${pid}`, {
          method: 'DELETE',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        return data;
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, productId);
    
    return deleteResponse.success;
  };

  test('should successfully create a new product - TRUE E2E with real backend', async ({ page }) => {
    console.log('🚀 Starting TRUE E2E test for product creation...');
    
    // Step 1: Login with real admin account
    console.log('📝 Step 1: Logging in with real admin credentials...');
    await loginAsAdmin(page);
    
    // Step 2: Navigate to create product page
    console.log('📝 Step 2: Navigating to create product page...');
    await page.goto('http://localhost:3000/dashboard/admin/create-product');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    // Verify we're on the correct page
    await expect(page).toHaveURL(/.*\/dashboard\/admin\/create-product/);
    await expect(page.getByRole('heading', { name: 'Create Product' })).toBeVisible();
    
    // Step 3: Get initial products count from real database
    console.log('📝 Step 3: Getting current products from real database...');
    const initialProductsResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/v1/product/get-product');
        const data = await response.json();
        return {
          success: data.success,
          totalProducts: data.products?.length || 0
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    expect(initialProductsResponse.success).toBe(true);
    const initialProductsCount = initialProductsResponse.totalProducts;
    console.log(`📊 Found ${initialProductsCount} existing products in real database`);
    
    // Step 4: Get a test category ID
    console.log('📝 Step 4: Getting test category...');
    const categoryId = await getTestCategoryId(page);
    expect(categoryId).toBeTruthy();
    
    // Step 5: Fill out the product creation form
    const productName = `E2E Test Product ${Date.now()}`;
    const productDescription = `This is a test product created by E2E tests at ${new Date().toISOString()}`;
    const productPrice = '99.99';
    const productQuantity = '10';
    
    console.log(`📝 Step 5: Creating product: ${productName}`);
    
    // Wait for form elements to be visible
    await expect(page.getByPlaceholder('Enter product name')).toBeVisible({ timeout: 10000 });
    
    // Select category - be more specific to target the first (category) dropdown
    await page.locator('.ant-select').first().click();
    await page.waitForTimeout(500);
    await page.locator('.ant-select-item').first().click();
    
    // Create a test file for upload (1x1 pixel PNG)
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    
    // Upload photo
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-product.png',
      mimeType: 'image/png',
      buffer: testImageBuffer
    });
    
    // Fill other required fields with correct placeholders
    await page.getByPlaceholder('Enter product name').fill(productName);
    await page.getByPlaceholder('Enter product description').fill(productDescription);
    await page.getByPlaceholder('Enter price').fill(productPrice);
    await page.getByPlaceholder('Enter quantity').fill(productQuantity);
    
    // Select shipping option - target the second dropdown
    await page.locator('.ant-select').nth(1).click();
    await page.waitForTimeout(500);
    await page.locator('.ant-select-item:has-text("Yes")').click();
    
    // Step 6: Submit the form to real backend API
    console.log('📝 Step 6: Submitting form to real backend...');
    const createButton = page.getByRole('button', { name: 'CREATE PRODUCT' });
    await expect(createButton).toBeVisible();
    await createButton.click();
    
    // Step 7: Verify success message from real backend
    console.log('📝 Step 7: Waiting for success response from real backend...');
    await expect(page.locator('text=Product created successfully')).toBeVisible({ timeout: 10000 });
    
    // Step 8: Verify navigation to products page
    console.log('📝 Step 8: Verifying navigation to products page...');
    await expect(page).toHaveURL(/.*\/dashboard\/admin\/products/, { timeout: 10000 });
    
        // Step 9: Verify product was actually created in real database
    console.log('📝 Step 9: Verifying product exists in real database...');
    await page.waitForTimeout(3000); // Give more time for DB operation
    
    // Retry logic for database verification
    let finalProductsResponse;
    let retries = 3;
    
    for (let i = 0; i < retries; i++) {
      finalProductsResponse = await page.evaluate(async (pName) => {
        try {
          const response = await fetch('/api/v1/product/get-product');
          const data = await response.json();
          const product = data.products?.find(p => p.name === pName);
          const productExists = !!product;
          
          return {
            success: data.success,
            productExists,
            totalProducts: data.products?.length || 0,
            productId: product?._id
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }, productName);
      
      if (finalProductsResponse.productExists) {
        break; // Product found, exit retry loop
      }
      
      if (i < retries - 1) {
        console.log(`📝 Retry ${i + 1}/${retries}: Product not found yet, waiting...`);
        await page.waitForTimeout(2000);
      }
    }
    
    expect(finalProductsResponse.success).toBe(true);
    expect(finalProductsResponse.productExists).toBe(true);
    // Verify product count increased (should be at least the initial count)
    expect(finalProductsResponse.totalProducts).toBeGreaterThanOrEqual(initialProductsCount);
    
    console.log('✅ TRUE E2E Test Complete!');
    console.log(`✅ Product "${productName}" successfully created in real database`);
    console.log(`✅ Total products: ${initialProductsCount} → ${finalProductsResponse.totalProducts}`);
    
    // Step 10: Cleanup - Delete the test product to keep database clean
    console.log('📝 Step 10: Cleaning up - deleting test product...');
    if (finalProductsResponse.productId) {
      const deleteSuccess = await deleteProduct(page, finalProductsResponse.productId);
      
      if (deleteSuccess) {
        console.log(`🗑️ Test product "${productName}" successfully deleted from database`);
        
        // Verify the product was actually deleted
        const verifyDeleteResponse = await page.evaluate(async () => {
          try {
            const response = await fetch('/api/v1/product/get-product');
            const data = await response.json();
            return {
              success: data.success,
              totalProducts: data.products?.length || 0
            };
          } catch (error) {
            return { success: false, error: error.message };
          }
        });
        
        if (verifyDeleteResponse.success) {
          console.log(`✅ Database cleanup verified: ${verifyDeleteResponse.totalProducts} products (back to ${initialProductsCount})`);
          expect(verifyDeleteResponse.totalProducts).toBe(initialProductsCount);
        }
      } else {
        console.warn(`⚠️ Failed to delete test product`);
      }
    }
  });

  test('should handle empty form submission gracefully', async ({ page }) => {
    console.log('🚀 Testing empty form submission behavior...');
    
    // Login with real admin account
    await loginAsAdmin(page);
    
    await page.goto('http://localhost:3000/dashboard/admin/create-product');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    // Verify page elements are loaded
    await expect(page.getByRole('heading', { name: 'Create Product' })).toBeVisible();
    
    // Get initial products count
    const initialProductsResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/v1/product/get-product');
        const data = await response.json();
        return data.products?.length || 0;
      } catch (error) {
        return 0;
      }
    });
    
    // Try to submit empty form
    console.log('📝 Testing empty form submission...');
    const createButton = page.getByRole('button', { name: 'CREATE PRODUCT' });
    await expect(createButton).toBeVisible();
    await createButton.click();
    
    // Should see validation error message
    await expect(page.locator('text=Please fill in all required fields')).toBeVisible({ timeout: 5000 });
    
    // Verify no product was created
    const finalProductsResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/v1/product/get-product');
        const data = await response.json();
        return data.products?.length || 0;
      } catch (error) {
        return 0;
      }
    });
    
    expect(finalProductsResponse).toBe(initialProductsResponse);
    console.log('✅ Empty form submission correctly prevented - no products were created');
  });

  test('should handle invalid price validation', async ({ page }) => {
    console.log('🚀 Testing invalid price validation...');
    
    await loginAsAdmin(page);
    
    await page.goto('http://localhost:3000/dashboard/admin/create-product');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    await expect(page.getByRole('heading', { name: 'Create Product' })).toBeVisible();
    
    // Wait for form elements to be visible
    await expect(page.getByPlaceholder('Enter product name')).toBeVisible({ timeout: 10000 });
    
    // Fill form with invalid price
    await page.getByPlaceholder('Enter product name').fill('Test Product');
    await page.getByPlaceholder('Enter product description').fill('Test Description');
    await page.getByPlaceholder('Enter price').fill('-10'); // Invalid negative price
    await page.getByPlaceholder('Enter quantity').fill('5');
    
    // Select category
    await page.locator('.ant-select').first().click();
    await page.waitForTimeout(500);
    await page.locator('.ant-select-item').first().click();
    
    // Upload a test photo (required field)
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-product.png',
      mimeType: 'image/png',
      buffer: testImageBuffer
    });
    
    // Submit form
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    
    // Should see price validation error (as toast message)
    await expect(page.locator('text=Price must be a non-negative number')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Invalid price validation working correctly');
  });

  test('should handle large photo file validation', async ({ page }) => {
    console.log('🚀 Testing large photo file validation...');
    
    await loginAsAdmin(page);
    
    await page.goto('http://localhost:3000/dashboard/admin/create-product');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    await expect(page.getByRole('heading', { name: 'Create Product' })).toBeVisible();
    
    // Wait for form elements to be visible
    await expect(page.getByPlaceholder('Enter product name')).toBeVisible({ timeout: 10000 });
    
    // Create a large file buffer (> 1MB) - simulate large image
    const largeBuffer = Buffer.alloc(1500000, 'x'); // 1.5MB
    
    // Fill required fields
    await page.getByPlaceholder('Enter product name').fill('Test Product Large Image');
    await page.getByPlaceholder('Enter product description').fill('Test Description');
    await page.getByPlaceholder('Enter price').fill('29.99');
    await page.getByPlaceholder('Enter quantity').fill('3');
    
    // Select category
    await page.locator('.ant-select').first().click();
    await page.waitForTimeout(500);
    await page.locator('.ant-select-item').first().click();
    
    // Upload large photo
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'large-test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: largeBuffer
    });
    
    // Submit form
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    
    // Should see photo size validation error from backend
    await expect(page.locator('text=Failed to create product. Please check your input and try again.')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Large photo validation working correctly');
  });
});