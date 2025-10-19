import { test, expect } from '@playwright/test';


test.describe('Create Category - True E2E Test', () => {


 // Real admin credentials provided by user
 const ADMIN_CREDENTIALS = {
   email: 'gerald@gmail.com',
   password: 'Testing#'
 };

 // Track categories created in each test for cleanup
 const testCategoriesCreated: string[] = [];

 // Helper function to perform real admin login
 const loginAsAdmin = async (page) => {
   await page.goto('/login');
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

 // Helper function to delete a category by ID
 const deleteCategory = async (page, categoryId: string) => {
   try {
     const deleteResponse = await page.evaluate(async (catId) => {
       try {
         const authData = localStorage.getItem('auth');
         if (!authData) return { success: false, error: 'No auth data' };

         const { token } = JSON.parse(authData);
         if (!token) return { success: false, error: 'No token' };

         const response = await fetch(`/api/v1/category/delete-category/${catId}`, {
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
     }, categoryId);

     return deleteResponse.success;
   } catch (error) {
     console.error('Failed to delete category:', error);
     return false;
   }
 };


 test.beforeEach(async ({ page }) => {
   // Set timeout for real network operations
   page.setDefaultTimeout(20000);

   // Clear the tracking array for this test
   testCategoriesCreated.length = 0;

   // NO API MOCKING - This is a true E2E test
   // All requests go to real backend with real database
 });

 test.afterEach(async ({ page }) => {
   // Clean up any categories created during the test
   if (testCategoriesCreated.length > 0) {
     console.log(`🧹 Cleaning up ${testCategoriesCreated.length} test categories...`);
     
     for (const categoryName of testCategoriesCreated) {
       try {
         // Get category ID
         const categoryId = await page.evaluate(async (catName) => {
           try {
             const response = await fetch('/api/v1/category/get-category');
             const data = await response.json();
             const category = data.categories?.find(cat => cat.name === catName);
             return category?._id;
           } catch (error) {
             return null;
           }
         }, categoryName);

         if (categoryId) {
           const deleted = await deleteCategory(page, categoryId);
           if (deleted) {
             console.log(`  ✓ Cleaned up: ${categoryName}`);
           }
         }
       } catch (error) {
         console.error(`  ✗ Failed to cleanup: ${categoryName}`);
       }
     }
   }
 });


 test('should successfully create a new category - TRUE E2E with real backend', async ({ page }) => {
   console.log('🚀 Starting TRUE E2E test with real backend...');


   // Step 1: Login with real admin account
   console.log('📝 Step 1: Logging in with real admin credentials...');
   await loginAsAdmin(page);


   // Step 2: Navigate to create category page
   console.log('📝 Step 2: Navigating to create category page...');
   await page.goto('http://localhost:3000/dashboard/admin/create-category');
   await page.waitForLoadState('domcontentloaded');
   await page.waitForTimeout(1000); // Wait for React to render


   // Verify we're on the correct page
   await expect(page).toHaveURL(/.*\/dashboard\/admin\/create-category/);


   // Step 3: Verify page elements are loaded
   console.log('📝 Step 3: Verifying page elements...');
   await expect(page.getByRole('heading', { name: 'Manage Category' })).toBeVisible({ timeout: 10000 });


   // Step 4: Get current categories count from real database
   console.log('📝 Step 4: Getting current categories from real database...');
   const initialCategoriesResponse = await page.evaluate(async () => {
     try {
       const response = await fetch('/api/v1/category/get-category');
       const data = await response.json();
       return data;
     } catch (error) {
       return { success: false, error: error.message };
     }
   });


   expect(initialCategoriesResponse.success).toBe(true);
   const initialCategoriesCount = initialCategoriesResponse.categories?.length || 0;
   console.log(`📊 Found ${initialCategoriesCount} existing categories in real database`);


   // Step 5: Create a unique category name to avoid conflicts
   const categoryName = `E2E Test Category ${Date.now()}`;
   console.log(`📝 Step 5: Creating category: ${categoryName}`);
   
   // Track this category for cleanup
   testCategoriesCreated.push(categoryName);


   const categoryInput = page.getByPlaceholder('Enter new category');
   await expect(categoryInput).toBeVisible();
   await categoryInput.fill(categoryName);


   // Verify the input has the correct value
   await expect(categoryInput).toHaveValue(categoryName);


   // Step 6: Submit the form to real backend API
   console.log('📝 Step 6: Submitting form to real backend...');
   const submitButton = page.getByRole('button', { name: 'Submit' });
   await expect(submitButton).toBeVisible();
   await submitButton.click();


   // Step 7: Verify success message from real backend
   console.log('📝 Step 7: Waiting for success response from real backend...');
   await expect(page.locator(`text=Category "${categoryName}" created successfully`)).toBeVisible({ timeout: 10000 });


   // Step 8: Verify form is reset after successful submission
   console.log('📝 Step 8: Verifying form reset...');
   await expect(categoryInput).toHaveValue('');


   // Step 9: Verify category was actually created in real database
   console.log('📝 Step 9: Verifying category exists in real database...');


   // Wait for page to refresh with new data
   await page.waitForTimeout(2000);


   // Verify the new category appears in the categories table
   await expect(page.getByRole('cell', { name: categoryName })).toBeVisible({ timeout: 10000 });


   // Step 10: Double-check with direct API call to real backend
   console.log('📝 Step 10: Double-checking with direct API call...');
   const finalCategoriesResponse = await page.evaluate(async (catName) => {
     try {
       const response = await fetch('/api/v1/category/get-category');
       const data = await response.json();
       const categoryExists = data.categories?.some(cat => cat.name === catName) || false;
       const category = data.categories?.find(cat => cat.name === catName);
       return {
         success: data.success,
         categoryExists,
         totalCategories: data.categories?.length || 0,
         categoryId: category?._id
       };
     } catch (error) {
       return { success: false, error: error.message };
     }
   }, categoryName);


   expect(finalCategoriesResponse.success).toBe(true);
   expect(finalCategoriesResponse.categoryExists).toBe(true);
   expect(finalCategoriesResponse.totalCategories).toBe(initialCategoriesCount + 1);


   console.log('✅ TRUE E2E Test Complete!');
   console.log(`✅ Category "${categoryName}" successfully created in real database`);
   console.log(`✅ Total categories increased from ${initialCategoriesCount} to ${finalCategoriesResponse.totalCategories}`);


   // Step 11: Cleanup - Delete the test category to keep database clean
   console.log('📝 Step 11: Cleaning up - deleting test category...');
   if (finalCategoriesResponse.categoryId) {
     const deleteResponse = await page.evaluate(async (catId) => {
       try {
         // Get the token from localStorage (same way the frontend does it)
         const authData = localStorage.getItem('auth');
         if (!authData) {
           return { success: false, error: 'No auth token found' };
         }


         const { token } = JSON.parse(authData);
         if (!token) {
           return { success: false, error: 'No token in auth data' };
         }


         const response = await fetch(`/api/v1/category/delete-category/${catId}`, {
           method: 'DELETE',
           headers: {
             'Authorization': token, // Use token directly as stored
             'Content-Type': 'application/json'
           }
         });


         const data = await response.json();
         return {
           success: data.success,
           message: data.message,
           status: response.status
         };
       } catch (error) {
         return { success: false, error: error.message };
       }
     }, finalCategoriesResponse.categoryId);


     if (deleteResponse.success) {
       console.log(`🗑️ Test category "${categoryName}" successfully deleted from database`);


       // Verify the category was actually deleted
       const verifyDeleteResponse = await page.evaluate(async () => {
         try {
           const response = await fetch('/api/v1/category/get-category');
           const data = await response.json();
           return {
             success: data.success,
             totalCategories: data.categories?.length || 0
           };
         } catch (error) {
           return { success: false, error: error.message };
         }
       });


       if (verifyDeleteResponse.success) {
         console.log(`✅ Database cleanup verified: ${verifyDeleteResponse.totalCategories} categories (back to ${initialCategoriesCount})`);
         expect(verifyDeleteResponse.totalCategories).toBe(initialCategoriesCount);
       }
     } else {
       console.warn(`⚠️ Failed to delete test category: ${deleteResponse.message}`);
     }
   }
 });


 test('should handle empty form submission gracefully', async ({ page }) => {
   console.log('🚀 Testing empty form submission behavior...');


   // Login with real admin account
   await loginAsAdmin(page);


   await page.goto('http://localhost:3000/dashboard/admin/create-category');
   await page.waitForLoadState('domcontentloaded');
   await page.waitForTimeout(1000);


   // Verify page elements are loaded
   await expect(page.getByRole('heading', { name: 'Manage Category' })).toBeVisible();


   // Try to submit empty form - this should be silently prevented by frontend
   console.log('📝 Testing empty form submission...');
   const submitButton = page.getByRole('button', { name: 'Submit' });
   await expect(submitButton).toBeVisible();
   const categoryInput = page.getByPlaceholder('Enter new category');
   
   // Ensure input is empty
   await categoryInput.clear();
   await expect(categoryInput).toHaveValue('');
   
   await submitButton.click();


   // Wait a moment to see if anything happens
   await page.waitForTimeout(2000);


   // Verify no empty category was created by checking:
   // 1. Input field is still empty (form didn't submit)
   // 2. No success message appeared
   await expect(categoryInput).toHaveValue('');
   
   // Verify no success toast appeared
   const successMessage = page.locator('text=created successfully');
   await expect(successMessage).not.toBeVisible();
   
   console.log('✅ Empty form submission correctly prevented - form validation working');
 });


 test('should handle special characters in category names', async ({ page }) => {
   console.log('🚀 Testing category creation with special characters...');


   // Login with real admin account
   await loginAsAdmin(page);


   await page.goto('http://localhost:3000/dashboard/admin/create-category');
   await page.waitForLoadState('domcontentloaded');
   await page.waitForTimeout(1000);


   await expect(page.getByRole('heading', { name: 'Manage Category' })).toBeVisible();


   // Test category with special characters
   const categoryName = `Special-Test_Category & More ${Date.now()}`;
   console.log(`📝 Creating category with special characters: ${categoryName}`);
   
   // Track this category for cleanup
   testCategoriesCreated.push(categoryName);


   const categoryInput = page.getByPlaceholder('Enter new category');
   await categoryInput.fill(categoryName);


   // Submit form
   await page.getByRole('button', { name: 'Submit' }).click();


   // Should successfully create the category
   await expect(page.locator(`text=Category "${categoryName}" created successfully`)).toBeVisible({ timeout: 10000 });


   // Verify the category was created and appears in the table
   await expect(page.getByRole('cell', { name: categoryName })).toBeVisible({ timeout: 10000 });


   console.log('✅ Category with special characters created successfully');


   // Cleanup - Delete the test category
   console.log('📝 Cleaning up test category...');
   const categoryId = await page.evaluate(async (catName) => {
     try {
       const response = await fetch('/api/v1/category/get-category');
       const data = await response.json();
       const category = data.categories?.find(cat => cat.name === catName);
       return category?._id;
     } catch (error) {
       return null;
     }
   }, categoryName);


   if (categoryId) {
     const deleteResponse = await page.evaluate(async (catId) => {
       try {
         const authData = localStorage.getItem('auth');
         const { token } = JSON.parse(authData);


         const response = await fetch(`/api/v1/category/delete-category/${catId}`, {
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
     }, categoryId);


     if (deleteResponse.success) {
       console.log(`🗑️ Test category "${categoryName}" successfully deleted`);
     }
   }
 });


 test('should prevent duplicate category creation - real backend validation', async ({ page }) => {
   console.log('🚀 Testing real backend duplicate prevention...');


   // Step 1: Login with real admin account
   await loginAsAdmin(page);


   // Step 2: Create a test category first
   await page.goto('http://localhost:3000/dashboard/admin/create-category');
   await page.waitForLoadState('domcontentloaded');
   await page.waitForTimeout(1000);


   await expect(page.getByRole('heading', { name: 'Manage Category' })).toBeVisible();


   const uniqueCategoryName = `Duplicate Test ${Date.now()}`;
   console.log(`📝 Step 1: Creating initial category: ${uniqueCategoryName}`);
   
   // Track this category for cleanup
   testCategoriesCreated.push(uniqueCategoryName);


   // Create the first category
   const categoryInput = page.getByPlaceholder('Enter new category');
   await categoryInput.fill(uniqueCategoryName);
   await page.getByRole('button', { name: 'Submit' }).click();
   await expect(page.locator(`text=Category "${uniqueCategoryName}" created successfully`)).toBeVisible({ timeout: 10000 });


   // Step 3: Try to create the same category again
   console.log(`📝 Step 2: Attempting to create duplicate category: ${uniqueCategoryName}`);
   await categoryInput.fill(uniqueCategoryName);
   await page.getByRole('button', { name: 'Submit' }).click();


   // Should see duplicate validation error (generic error message is shown)
   await expect(page.locator('text=Failed to create category. Please check your input and try again.')).toBeVisible({ timeout: 5000 });


   console.log('✅ Real backend duplicate prevention working correctly');


   // Step 4: Cleanup - Delete the test category
   console.log('📝 Step 3: Cleaning up test category...');
   const categoryId = await page.evaluate(async (catName) => {
     try {
       const response = await fetch('/api/v1/category/get-category');
       const data = await response.json();
       const category = data.categories?.find(cat => cat.name === catName);
       return category?._id;
     } catch (error) {
       return null;
     }
   }, uniqueCategoryName);


   if (categoryId) {
     const deleteResponse = await page.evaluate(async (catId) => {
       try {
         const authData = localStorage.getItem('auth');
         const { token } = JSON.parse(authData);


         const response = await fetch(`/api/v1/category/delete-category/${catId}`, {
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
     }, categoryId);


     if (deleteResponse.success) {
       console.log(`🗑️ Test category "${uniqueCategoryName}" successfully deleted`);
     }
   }
 });


 test('should maintain session during navigation - real auth system', async ({ page }) => {
   console.log('🚀 Testing real authentication session persistence...');


   // Step 1: Login and create a category first
   await loginAsAdmin(page);
   await page.goto('http://localhost:3000/dashboard/admin/create-category');
   await page.waitForLoadState('domcontentloaded');
   await page.waitForTimeout(1000);


   await expect(page.getByRole('heading', { name: 'Manage Category' })).toBeVisible();


   // Step 2: Create a test category
   const categoryName = `Session Test ${Date.now()}`;
   console.log(`📝 Step 1: Creating test category: ${categoryName}`);
   
   // Track this category for cleanup
   testCategoriesCreated.push(categoryName);


   await page.getByPlaceholder('Enter new category').fill(categoryName);
   await page.getByRole('button', { name: 'Submit' }).click();
   await expect(page.locator(`text=Category "${categoryName}" created successfully`)).toBeVisible({ timeout: 10000 });


   // Step 3: Navigate to other admin pages to test session persistence
   console.log('📝 Step 2: Testing navigation with real auth session...');


   // Navigate to main admin dashboard
   await page.goto('http://localhost:3000/dashboard/admin');
   await page.waitForLoadState('domcontentloaded');
   await expect(page).toHaveURL(/.*\/dashboard\/admin$/);
   console.log('✅ Successfully navigated to admin dashboard');


   // Navigate to create product page (if it exists)
   await page.goto('http://localhost:3000/dashboard/admin/create-product');
   await page.waitForLoadState('domcontentloaded');
   await expect(page).toHaveURL(/.*\/dashboard\/admin\/create-product/);
   console.log('✅ Successfully navigated to create product page');


   // Navigate back to create category - should still be authenticated
   await page.goto('http://localhost:3000/dashboard/admin/create-category');
   await page.waitForLoadState('domcontentloaded');
   await page.waitForTimeout(1000);


   // Step 4: Verify we can still access admin functionality
   await expect(page.getByRole('heading', { name: 'Manage Category' })).toBeVisible();
   await expect(page.getByPlaceholder('Enter new category')).toBeVisible();


   console.log('✅ Real authentication session persistence working correctly');


   // Step 5: Cleanup - Delete the test category
   console.log('📝 Step 3: Cleaning up test category...');
   const categoryId = await page.evaluate(async (catName) => {
     try {
       const response = await fetch('/api/v1/category/get-category');
       const data = await response.json();
       const category = data.categories?.find(cat => cat.name === catName);
       return category?._id;
     } catch (error) {
       return null;
     }
   }, categoryName);


   if (categoryId) {
     const deleteResponse = await page.evaluate(async (catId) => {
       try {
         const authData = localStorage.getItem('auth');
         const { token } = JSON.parse(authData);


         const response = await fetch(`/api/v1/category/delete-category/${catId}`, {
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
     }, categoryId);


     if (deleteResponse.success) {
       console.log(`🗑️ Test category "${categoryName}" successfully deleted`);
     }
   }
 });
});
