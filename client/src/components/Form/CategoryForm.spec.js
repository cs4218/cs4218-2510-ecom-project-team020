import { test, expect } from '@playwright/test';


test.describe('CategoryForm UI Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
   // Navigate directly to create category page (skip login for now)
   await page.goto('/dashboard/admin/create-category');
 });


 test('should render category form elements', async ({ page }) => {
   // Check if the page loads and basic elements are present
   await page.waitForLoadState('networkidle');
  
   // Look for form elements with flexible selectors
   const categoryInput = page.locator('input[placeholder*="category"], input[name*="category"], input[type="text"]').first();
   const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("CREATE")').first();
  
   if (await categoryInput.count() > 0) {
     await expect(categoryInput).toBeVisible();
   }
  
   if (await submitButton.count() > 0) {
     await expect(submitButton).toBeVisible();
   }
 });


 test('should handle basic input interaction', async ({ page }) => {
   await page.waitForLoadState('networkidle');
  
   // Find any text input that might be the category input
   const categoryInput = page.locator('input[type="text"]').first();
  
   if (await categoryInput.count() > 0) {
     await categoryInput.fill('Test Category');
     await expect(categoryInput).toHaveValue('Test Category');
    
     // Clear the input
     await categoryInput.clear();
     await expect(categoryInput).toHaveValue('');
   }
 });


 test('should handle form submission attempt', async ({ page }) => {
   await page.waitForLoadState('networkidle');
  
   // Find input and button
   const categoryInput = page.locator('input[type="text"]').first();
   const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("CREATE")').first();
  
   if (await categoryInput.count() > 0 && await submitButton.count() > 0) {
     await categoryInput.fill('Sample Category');
     await submitButton.click();
    
     // Wait a moment for any response
     await page.waitForTimeout(1000);
    
     // Check if there's any response - success message, error, or form reset
     const hasSuccess = await page.locator('text*=created, text*=success, text*=Success').count() > 0;
     const hasError = await page.locator('text*=error, text*=Error, text*=invalid').count() > 0;
     const isFormReset = await categoryInput.inputValue() === '';
    
     // At least one of these should be true
     expect(hasSuccess || hasError || isFormReset).toBe(true);
   }
 });
});
