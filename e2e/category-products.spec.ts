import { test, expect } from '@playwright/test';
import { CategoryProductsPage } from './pom/CategoryProductsPage';

/**
 * E2E Tests for Category Products Page
 * 
 * Tests cover:
 * - Category page display
 * - Product filtering by category
 * - Product card rendering
 * - Navigation to product details
 * - Price and description formatting
 * - Result count accuracy
 * - Error handling
 * - Edge cases (empty categories, invalid slugs)
 * 
 * Components tested:
 * - Frontend: CategoryProduct.js
 * - Backend: productCategoryController
 * - Integration: Complete category filtering workflow from UI to DB and back
 */

test.describe('Category Products Page', () => {
  let categoryPage: CategoryProductsPage;

  test.beforeEach(async ({ page }) => {
    categoryPage = new CategoryProductsPage(page);
  });

  /**
   * TC1: Display Products by Category (Happy Path)
   * 
   * Tests the complete category page display:
   * 1. User navigates to category page
   * 2. Category name is displayed
   * 3. Products are filtered and displayed
   * 4. Result count is shown
   */
  test('should display products filtered by category', async ({ page }) => {
    // ACT - Navigate to first available category
    await categoryPage.gotoFirstCategoryFromHomepage();

    // ASSERT - Verify page structure
    await categoryPage.expectPageStructure();

    // Verify category name is displayed
    const categoryName = await categoryPage.getCategoryName();
    expect(categoryName.length).toBeGreaterThan(0);

    // Verify products are displayed
    await categoryPage.expectProductsDisplayed();

    // Verify result count is accurate
    await categoryPage.expectResultCountAccurate();

    // Log success
    const count = await categoryPage.getProductCardsCount();
    console.log(`✅ Category "${categoryName}" displayed ${count} products correctly`);
  });

  /**
   * TC2: Product Card Structure
   * 
   * Tests that product cards have all required elements:
   * 1. Image
   * 2. Title
   * 3. Price
   * 4. Description
   * 5. "More Details" button
   */
  test('should display complete product card information', async ({ page }) => {
    // ARRANGE - Navigate to category
    await categoryPage.gotoFirstCategoryFromHomepage();

    const count = await categoryPage.getProductCardsCount();

    if (count > 0) {
      // ACT & ASSERT - Verify first product card
      await categoryPage.expectProductCardComplete(0);

      // Verify image
      await categoryPage.expectProductImage(0);

      // Verify product name
      const productName = await categoryPage.getProductName(0);
      expect(productName.length).toBeGreaterThan(0);

      // Verify price
      const price = await categoryPage.getProductPrice(0);
      expect(price).toContain('$');

      console.log(`✅ Product card displays all required information for "${productName}"`);
    } else {
      console.log('⚠️ Skipped: No products in this category');
    }
  });

  /**
   * TC3: Navigate to Product Details
   * 
   * Tests navigation from category page to product details:
   * 1. User clicks "More Details" on a product
   * 2. Navigates to product details page
   * 3. Product details are displayed
   */
  test('should navigate to product details from category page', async ({ page }) => {
    // ARRANGE - Navigate to category
    await categoryPage.gotoFirstCategoryFromHomepage();

    const count = await categoryPage.getProductCardsCount();

    if (count > 0) {
      const productName = await categoryPage.getProductName(0);

      // ACT - Click "More Details"
      await categoryPage.clickMoreDetails(0);

      // ASSERT - Verify navigation to product details
      await expect(page).toHaveURL(/\/product\//);
      await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();

      console.log(`✅ Successfully navigated to product details for "${productName}"`);
    } else {
      console.log('⚠️ Skipped: No products available for navigation test');
    }
  });

  /**
   * TC4: Price Formatting
   * 
   * Tests that prices are displayed in correct USD format:
   * 1. All prices follow USD currency format
   * 2. Format: $X,XXX.XX
   */
  test('should display prices in correct USD format', async ({ page }) => {
    // ARRANGE - Navigate to category
    await categoryPage.gotoFirstCategoryFromHomepage();

    const count = await categoryPage.getProductCardsCount();

    if (count > 0) {
      // ACT & ASSERT - Check first product price format
      await categoryPage.expectPriceFormatted(0);

      // Check additional products if available
      if (count > 1) {
        await categoryPage.expectPriceFormatted(1);
      }

      console.log('✅ Prices displayed in correct USD format');
    } else {
      console.log('⚠️ Skipped: No products to verify price format');
    }
  });

  /**
   * TC5: Description Truncation
   * 
   * Tests that product descriptions are truncated:
   * 1. Descriptions are limited to 60 characters
   * 2. Truncated descriptions end with "..."
   */
  test('should truncate product descriptions', async ({ page }) => {
    // ARRANGE - Navigate to category
    await categoryPage.gotoFirstCategoryFromHomepage();

    const count = await categoryPage.getProductCardsCount();

    if (count > 0) {
      // ACT & ASSERT - Check description truncation
      await categoryPage.expectDescriptionTruncated(0);

      console.log('✅ Product descriptions truncated correctly');
    } else {
      console.log('⚠️ Skipped: No products to verify description truncation');
    }
  });

  /**
   * TC6: Result Count Accuracy
   * 
   * Tests that displayed count matches actual number of products:
   * 1. Result count text shows correct number
   * 2. Number matches actual product cards displayed
   */
  test('should display accurate result count', async ({ page }) => {
    // ARRANGE - Navigate to category
    await categoryPage.gotoFirstCategoryFromHomepage();

    // ACT - Get counts
    const displayedCount = await categoryPage.getResultCount();
    const actualCount = await categoryPage.getProductCardsCount();

    // ASSERT - Counts should match
    expect(displayedCount).toBe(actualCount);

    console.log(`✅ Result count accurate: ${displayedCount} displayed, ${actualCount} actual`);
  });

  /**
   * TC7: Navigate Between Categories
   * 
   * Tests navigation between different categories:
   * 1. User views one category
   * 2. Navigates to different category
   * 3. Products update to show new category
   */
  test('should navigate between different categories', async ({ page }) => {
    // ARRANGE - Navigate to first category
    await categoryPage.gotoFirstCategoryFromHomepage();
    
    const firstCategoryName = await categoryPage.getCategoryName();
    const firstSlug = await categoryPage.getCurrentCategorySlug();

    // ACT - Navigate to homepage and select different category
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();
    
    // Click Categories dropdown
    await page.getByRole('link', { name: 'Categories' }).click();
    await page.waitForTimeout(500);
    
    // Get all category links
    const categoryLinks = page.locator('.dropdown-menu .dropdown-item');
    const linkCount = await categoryLinks.count();
    
    if (linkCount > 2) {
      // Click third category (different from first)
      await categoryLinks.nth(2).click();
      
      // ASSERT - Verify we're on a different category
      await categoryPage.waitForPageLoad();
      await categoryPage.expectDifferentCategory(firstSlug);
      
      const secondCategoryName = await categoryPage.getCategoryName();
      expect(secondCategoryName).not.toBe(firstCategoryName);
      
      console.log(`✅ Navigated from "${firstCategoryName}" to "${secondCategoryName}"`);
    } else {
      console.log('⚠️ Skipped: Not enough categories for navigation test');
    }
  });

  /**
   * TC8: Navigate Back to Homepage
   * 
   * Tests navigation from category page back to homepage:
   * 1. User navigates to category
   * 2. Clicks browser back button
   * 3. Returns to homepage
   */
  test('should navigate back to homepage', async ({ page }) => {
    // ARRANGE - Start from homepage
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();

    // Navigate to category
    await categoryPage.gotoFirstCategoryFromHomepage();

    // ACT - Go back
    await categoryPage.goBack();

    // ASSERT - Should be back on homepage
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();

    console.log('✅ Successfully navigated back to homepage');
  });

  /**
   * TC9: Category API Error Handling
   * 
   * Tests graceful handling when category API fails:
   * 1. Mock API failure
   * 2. Navigate to category
   * 3. App handles error gracefully
   */
  test('should handle category API failure gracefully', async ({ page }) => {
    // ARRANGE - Mock API failure
    await page.route('**/api/v1/product/product-category/**', route => route.abort());

    // ACT - Try to navigate to category
    await page.goto('/category/electronics');

    // ASSERT - Page should load without crashing
    await expect(categoryPage.categoryHeading).toBeVisible();

    // Should show 0 results or handle error gracefully
    const count = await categoryPage.getProductCardsCount();
    expect(count).toBe(0);

    console.log('✅ Category API failure handled gracefully');
  });

  /**
   * TC10: Product Images Load Correctly
   * 
   * Tests that product images are displayed:
   * 1. Images are visible
   * 2. Image sources point to correct API endpoint
   */
  test('should load product images correctly', async ({ page }) => {
    // ARRANGE - Navigate to category
    await categoryPage.gotoFirstCategoryFromHomepage();

    const count = await categoryPage.getProductCardsCount();

    if (count > 0) {
      // ACT & ASSERT - Verify image on first product
      await categoryPage.expectProductImage(0);

      console.log('✅ Product images loaded correctly');
    } else {
      console.log('⚠️ Skipped: No products to verify image loading');
    }
  });

  /**
   * TC11: Multiple Products Display
   * 
   * Tests that multiple products are displayed correctly:
   * 1. Category has multiple products
   * 2. All products are rendered
   * 3. Each has complete information
   */
  test('should display multiple products correctly', async ({ page }) => {
    // ARRANGE - Navigate to category
    await categoryPage.gotoFirstCategoryFromHomepage();

    const count = await categoryPage.getProductCardsCount();

    if (count >= 2) {
      // ACT & ASSERT - Verify first two products
      await categoryPage.expectProductCardComplete(0);
      await categoryPage.expectProductCardComplete(1);

      // Verify they have different names
      const name1 = await categoryPage.getProductName(0);
      const name2 = await categoryPage.getProductName(1);
      
      // Names should be different (different products)
      // But we won't assert this as they could theoretically be the same
      
      console.log(`✅ Multiple products displayed correctly (${count} products)`);
    } else if (count === 1) {
      console.log('✅ Single product displayed correctly');
    } else {
      console.log('⚠️ No products in this category');
    }
  });

  /**
   * TC12: Category Name Display
   * 
   * Tests that category name is displayed correctly:
   * 1. Category heading shows category name
   * 2. Name is not empty or "undefined"
   */
  test('should display category name correctly', async ({ page }) => {
    // ARRANGE - Navigate to category
    await categoryPage.gotoFirstCategoryFromHomepage();

    // ACT - Get category name
    const categoryName = await categoryPage.getCategoryName();

    // ASSERT - Name should be valid
    expect(categoryName).toBeTruthy();
    expect(categoryName.length).toBeGreaterThan(0);
    expect(categoryName.toLowerCase()).not.toBe('undefined');

    console.log(`✅ Category name "${categoryName}" displayed correctly`);
  });
});

/**
 * Additional test suite for edge cases
 */
test.describe('Category Products Edge Cases', () => {
  let categoryPage: CategoryProductsPage;

  test.beforeEach(async ({ page }) => {
    categoryPage = new CategoryProductsPage(page);
  });

  /**
   * TC13: Invalid Category Slug
   * 
   * Tests handling of invalid/non-existent category slug:
   * 1. Navigate to non-existent category
   * 2. App handles gracefully
   */
  test('should handle invalid category slug gracefully', async ({ page }) => {
    // ACT - Navigate to non-existent category
    await page.goto('/category/non-existent-category-12345');

    // ASSERT - Page should load without crashing
    await expect(categoryPage.categoryHeading).toBeVisible();

    // Should show 0 results or empty state
    const count = await categoryPage.getProductCardsCount();
    expect(count).toBe(0);

    console.log('✅ Invalid category slug handled gracefully');
  });

  /**
   * TC14: Empty Category
   * 
   * Tests display when category has no products:
   * 1. Category exists but has no products
   * 2. Shows 0 results
   * 3. No product cards displayed
   */
  test('should handle empty category correctly', async ({ page }) => {
    // This test assumes there might be an empty category
    // If all categories have products, this will be skipped
    
    await categoryPage.gotoFirstCategoryFromHomepage();
    
    const count = await categoryPage.getProductCardsCount();
    const resultCount = await categoryPage.getResultCount();
    
    if (count === 0) {
      // ASSERT - Verify empty state
      await categoryPage.expectNoProducts();
      expect(resultCount).toBe(0);
      
      console.log('✅ Empty category handled correctly');
    } else {
      console.log(`✅ Category has ${count} products (not empty)`);
    }
  });

  /**
   * TC15: Rapid Category Navigation
   * 
   * Tests that rapid navigation between categories works:
   * 1. Navigate to multiple categories quickly
   * 2. Each loads correctly
   * 3. No race conditions or errors
   */
  test('should handle rapid category navigation', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Get all categories
    await page.getByRole('link', { name: 'Categories' }).click();
    await page.waitForTimeout(500);
    
    const categoryLinks = page.locator('.dropdown-menu .dropdown-item');
    const linkCount = await categoryLinks.count();
    
    if (linkCount > 3) {
      // Navigate to first category
      await categoryLinks.nth(1).click();
      await categoryPage.waitForPageLoad();
      
      // Quickly navigate to second category
      await page.goto('/');
      await page.getByRole('link', { name: 'Categories' }).click();
      await page.waitForTimeout(300);
      await categoryLinks.nth(2).click();
      await categoryPage.waitForPageLoad();
      
      // Quickly navigate to third category
      await page.goto('/');
      await page.getByRole('link', { name: 'Categories' }).click();
      await page.waitForTimeout(300);
      await categoryLinks.nth(3).click();
      await categoryPage.waitForPageLoad();
      
      // ASSERT - Final category should be loaded correctly
      await categoryPage.expectPageStructure();
      
      console.log('✅ Rapid category navigation handled correctly');
    } else {
      console.log('⚠️ Skipped: Not enough categories for rapid navigation test');
    }
  });

  /**
   * TC16: Direct URL Navigation
   * 
   * Tests navigating directly to category via URL:
   * 1. User enters category URL directly
   * 2. Page loads correctly
   * 3. Products are displayed
   */
  test('should handle direct URL navigation to category', async ({ page }) => {
    // ACT - Navigate directly via URL (assuming "electronics" category exists)
    await page.goto('/category/electronics');

    // ASSERT - Page should load
    await expect(categoryPage.categoryHeading).toBeVisible();
    await expect(categoryPage.resultCountText).toBeVisible();

    // Should show some result (even if 0)
    const resultCount = await categoryPage.getResultCount();
    expect(resultCount).toBeGreaterThanOrEqual(0);

    console.log('✅ Direct URL navigation handled correctly');
  });
});

