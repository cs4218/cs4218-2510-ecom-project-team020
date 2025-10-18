import { test, expect } from '@playwright/test';

test.describe('Update Product - True E2E Tests', () => {
  // Real admin credentials
  const ADMIN_CREDENTIALS = {
    email: 'gerald@gmail.com',
    password: 'Testing#'
  };

  // Helper function to perform real admin login
  const loginAsAdmin = async (page) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('domcontentloaded');
    
    await page.getByPlaceholder('Enter Your Email').fill(ADMIN_CREDENTIALS.email);
    await page.getByPlaceholder('Enter Your Password').fill(ADMIN_CREDENTIALS.password);
    await page.getByRole('button', { name: 'LOGIN' }).click();
    
    await expect(page.locator('text=Login Successful')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);
  };

  // Helper function to create a test product
  const createTestProduct = async (page) => {
    const productName = `Update Test Product ${Date.now()}`;
    const productData = {
      name: productName,
      description: 'Initial test product for update testing',
      price: '49.99',
      quantity: '5'
    };

    const createResult = await page.evaluate(async (data) => {
      try {
        const authData = localStorage.getItem('auth');
        const { token } = JSON.parse(authData);
        
        // Get categories first
        const categoriesResponse = await fetch('/api/v1/category/get-category');
        const categoriesData = await categoriesResponse.json();
        const categoryId = categoriesData.categories?.[0]?._id;
        
        if (!categoryId) throw new Error('No categories available');
        
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', data.description);
        formData.append('price', data.price);
        formData.append('quantity', data.quantity);
        formData.append('category', categoryId);
        
        // Create a minimal test image
        const imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        const imageBuffer = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
        const blob = new Blob([imageBuffer], { type: 'image/png' });
        formData.append('photo', blob, 'test.png');
        
        const response = await fetch('/api/v1/product/create-product', {
          method: 'POST',
          headers: {
            'Authorization': token
          },
          body: formData
        });
        
        const result = await response.json();
        return result;
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, productData);

    if (createResult.success) {
      return {
        productId: createResult.products._id,
        productSlug: createResult.products.slug,
        productName: productData.name
      };
    }
    return null;
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

  test('should successfully update a product - TRUE E2E with real backend', async ({ page }) => {
    console.log('🚀 Starting TRUE E2E test for product update...');
    
    // Step 1: Login with real admin account
    console.log('📝 Step 1: Logging in with real admin credentials...');
    await loginAsAdmin(page);
    
    // Step 2: Create a test product to update
    console.log('📝 Step 2: Creating test product for updating...');
    const testProduct = await createTestProduct(page);
    expect(testProduct).toBeTruthy();
    expect(testProduct.productId).toBeTruthy();
    expect(testProduct.productSlug).toBeTruthy();
    
    console.log(`📝 Created test product: ${testProduct.productName}`);
    
    // Step 3: Navigate to update product page
    console.log('📝 Step 3: Navigating to update product page...');
    await page.goto(`http://localhost:3000/dashboard/admin/product/${testProduct.productSlug}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Wait for product data to load
    
    // Verify we're on the correct page and form is loaded
    await expect(page).toHaveURL(new RegExp(`.*\/dashboard\/admin\/product\/${testProduct.productSlug}`));
    await expect(page.getByRole('heading', { name: 'Update Product' })).toBeVisible();
    
    // Step 4: Verify form is pre-populated with existing data
    console.log('📝 Step 4: Verifying form pre-population...');
    await expect(page.getByPlaceholder('Enter product name')).toHaveValue(testProduct.productName);
    await expect(page.getByPlaceholder('Enter product description')).toHaveValue('Initial test product for update testing');
    await expect(page.getByPlaceholder('Enter price')).toHaveValue('49.99');
    await expect(page.getByPlaceholder('Enter quantity')).toHaveValue('5');
    
    // Step 5: Update the product details
    const updatedName = `Updated ${testProduct.productName}`;
    const updatedDescription = 'Updated description for E2E testing';
    const updatedPrice = '79.99';
    const updatedQuantity = '15';
    
    console.log(`📝 Step 5: Updating product to: ${updatedName}`);
    
    // Clear and update fields
    await page.getByPlaceholder('Enter product name').clear();
    await page.getByPlaceholder('Enter product name').fill(updatedName);
    
    await page.getByPlaceholder('Enter product description').clear();
    await page.getByPlaceholder('Enter product description').fill(updatedDescription);
    
    await page.getByPlaceholder('Enter price').clear();
    await page.getByPlaceholder('Enter price').fill(updatedPrice);
    
    await page.getByPlaceholder('Enter quantity').clear();
    await page.getByPlaceholder('Enter quantity').fill(updatedQuantity);
    
    // Step 6: Submit the update form
    console.log('📝 Step 6: Submitting update form to real backend...');
    const updateButton = page.getByRole('button', { name: 'UPDATE PRODUCT' });
    await expect(updateButton).toBeVisible();
    await updateButton.click();
    
    // Step 7: Verify success message
    console.log('📝 Step 7: Waiting for success response from real backend...');
    await expect(page.locator('text=Product updated successfully')).toBeVisible({ timeout: 10000 });
    
    // Step 8: Verify navigation to products page
    console.log('📝 Step 8: Verifying navigation to products page...');
    await expect(page).toHaveURL(/.*\/dashboard\/admin\/products/, { timeout: 10000 });
    
    // Step 9: Verify product was actually updated in real database
    console.log('📝 Step 9: Verifying product was updated in real database...');
    const updatedProductResponse = await page.evaluate(async (pId) => {
      try {
        const response = await fetch('/api/v1/product/get-product');
        const data = await response.json();
        const product = data.products?.find(p => p._id === pId);
        return {
          success: data.success,
          product: product || null
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, testProduct.productId);
    
    expect(updatedProductResponse.success).toBe(true);
    expect(updatedProductResponse.product).toBeTruthy();
    expect(updatedProductResponse.product.name).toBe(updatedName);
    expect(updatedProductResponse.product.description).toBe(updatedDescription);
    expect(updatedProductResponse.product.price).toBe(parseFloat(updatedPrice));
    expect(updatedProductResponse.product.quantity).toBe(parseInt(updatedQuantity));
    
    console.log('✅ TRUE E2E Update Test Complete!');
    console.log(`✅ Product successfully updated: ${updatedName}`);
    console.log(`✅ Price updated: $49.99 → $${updatedPrice}`);
    console.log(`✅ Quantity updated: 5 → ${updatedQuantity}`);
    
    // Step 10: Cleanup - Delete the test product
    console.log('📝 Step 10: Cleaning up - deleting test product...');
    const deleteSuccess = await deleteProduct(page, testProduct.productId);
    
    if (deleteSuccess) {
      console.log(`🗑️ Test product "${updatedName}" successfully deleted from database`);
    } else {
      console.warn(`⚠️ Failed to delete test product`);
    }
  });

  test('should handle update validation errors', async ({ page }) => {
    console.log('🚀 Testing update validation errors...');
    
    await loginAsAdmin(page);
    
    // Create test product
    const testProduct = await createTestProduct(page);
    expect(testProduct).toBeTruthy();
    
    // Navigate to update page
    await page.goto(`http://localhost:3000/dashboard/admin/product/${testProduct.productSlug}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await expect(page.getByRole('heading', { name: 'Update Product' })).toBeVisible();
    
    // Clear required fields to trigger validation
    await page.getByPlaceholder('Enter product name').clear();
    await page.getByPlaceholder('Enter product description').clear();
    
    // Submit form with missing required fields
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
    
    // Should see validation error
    await expect(page.locator('text=Please fill in all required fields')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Update validation working correctly');
    
    // Cleanup
    await deleteProduct(page, testProduct.productId);
  });

  test('should handle invalid price during update', async ({ page }) => {
    console.log('🚀 Testing invalid price validation during update...');
    
    await loginAsAdmin(page);
    
    // Create test product
    const testProduct = await createTestProduct(page);
    expect(testProduct).toBeTruthy();
    
    // Navigate to update page
    await page.goto(`http://localhost:3000/dashboard/admin/product/${testProduct.productSlug}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await expect(page.getByRole('heading', { name: 'Update Product' })).toBeVisible();
    
    // Update with invalid price
    await page.getByPlaceholder('Enter price').clear();
    await page.getByPlaceholder('Enter price').fill('-25'); // Invalid negative price
    
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
    
    // Should see price validation error
    await expect(page.locator('text=Price must be a non-negative number')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Invalid price validation during update working correctly');
    
    // Cleanup
    await deleteProduct(page, testProduct.productId);
  });

  test('should maintain product data integrity during update', async ({ page }) => {
    console.log('🚀 Testing product data integrity during update...');
    
    await loginAsAdmin(page);
    
    // Create test product
    const testProduct = await createTestProduct(page);
    expect(testProduct).toBeTruthy();
    
    // Get initial product data
    const initialProductData = await page.evaluate(async (pId) => {
      try {
        const response = await fetch('/api/v1/product/get-product');
        const data = await response.json();
        const product = data.products?.find(p => p._id === pId);
        return product;
      } catch (error) {
        return null;
      }
    }, testProduct.productId);
    
    expect(initialProductData).toBeTruthy();
    
    // Navigate to update page
    await page.goto(`http://localhost:3000/dashboard/admin/product/${testProduct.productSlug}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Update only the description
    const updatedDescription = 'Only description updated - integrity test';
    await page.getByPlaceholder('Enter product description').clear();
    await page.getByPlaceholder('Enter product description').fill(updatedDescription);
    
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
    await expect(page.locator('text=Product updated successfully')).toBeVisible({ timeout: 10000 });
    
    // Verify only description changed, other fields preserved
    const updatedProductData = await page.evaluate(async (pId) => {
      try {
        const response = await fetch('/api/v1/product/get-product');
        const data = await response.json();
        const product = data.products?.find(p => p._id === pId);
        return product;
      } catch (error) {
        return null;
      }
    }, testProduct.productId);
    
    expect(updatedProductData).toBeTruthy();
    expect(updatedProductData.name).toBe(initialProductData.name); // Should be unchanged
    expect(updatedProductData.price).toBe(initialProductData.price); // Should be unchanged
    expect(updatedProductData.quantity).toBe(initialProductData.quantity); // Should be unchanged
    expect(updatedProductData.description).toBe(updatedDescription); // Should be updated
    expect(updatedProductData.category._id).toBe(initialProductData.category._id); // Should be unchanged
    
    console.log('✅ Product data integrity maintained during partial update');
    
    // Cleanup
    await deleteProduct(page, testProduct.productId);
  });

  test('should handle product deletion from update page', async ({ page }) => {
    console.log('🚀 Testing product deletion from update page...');
    
    await loginAsAdmin(page);
    
    // Create test product
    const testProduct = await createTestProduct(page);
    expect(testProduct).toBeTruthy();
    
    // Navigate to update page
    await page.goto(`http://localhost:3000/dashboard/admin/product/${testProduct.productSlug}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await expect(page.getByRole('heading', { name: 'Update Product' })).toBeVisible();
    
    // Click delete button
    const deleteButton = page.getByRole('button', { name: 'DELETE PRODUCT' });
    await expect(deleteButton).toBeVisible();
    
    // Handle the confirmation dialog
    page.on('dialog', async dialog => {
      console.log('📝 Handling confirmation dialog:', dialog.message());
      await dialog.accept();
    });
    
    await deleteButton.click();
    
    // Should see success message and navigate away
    await expect(page.locator('text=Product deleted successfully')).toBeVisible({ timeout: 10000 });
    
    // Verify product was deleted from database
    const deletedProductCheck = await page.evaluate(async (pId) => {
      try {
        const response = await fetch('/api/v1/product/get-product');
        const data = await response.json();
        const product = data.products?.find(p => p._id === pId);
        return product === undefined; // Should be undefined if deleted
      } catch (error) {
        return false;
      }
    }, testProduct.productId);
    
    expect(deletedProductCheck).toBe(true);
    
    console.log('✅ Product deletion from update page working correctly');
    console.log(`🗑️ Test product "${testProduct.productName}" successfully deleted`);
  });
});