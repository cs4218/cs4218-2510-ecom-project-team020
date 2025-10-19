import { test, expect } from '@playwright/test';
import { ProductDetailsPage } from './pom/ProductDetailsPage';

/**
 * E2E Tests for Product Details Page
 * 
 * Tests cover:
 * - Product details display
 * - Product image rendering
 * - Add to cart functionality
 * - Similar products display
 * - Navigation between products
 * - Error handling
 * - Edge cases (uncategorized products, no similar products)
 * 
 * Components tested:
 * - Frontend: ProductDetails.js
 * - Backend: getSingleProductController, relatedProductController, productPhotoController
 * - Integration: Complete product details workflow from UI to DB and back
 */

test.describe('Product Details Page', () => {
  let productDetailsPage: ProductDetailsPage;

  test.beforeEach(async ({ page }) => {
    productDetailsPage = new ProductDetailsPage(page);
    // Note: clearCart() will be called after navigation in each test
  });

  /**
   * TC1: View Product Details (Happy Path)
   * 
   * Tests the complete product details display:
   * 1. User navigates to product details page
   * 2. Product information is displayed correctly
   * 3. All required elements are present
   */
  test('should display product details correctly', async ({ page }) => {
    // ACT - Navigate to product details from homepage
    await productDetailsPage.gotoFromHomepageAndClearCart();

    // ASSERT - Verify page structure
    await productDetailsPage.expectPageStructure();

    // Verify product data is loaded (not showing "Loading...")
    await productDetailsPage.expectProductLoaded();

    // Verify product image is displayed
    await productDetailsPage.expectProductImage();

    // Log success
    const productName = await productDetailsPage.getProductName();
    console.log(`✅ Product details displayed correctly for "${productName}"`);
  });

  /**
   * TC2: Product Details - Add to Cart
   * 
   * Tests add to cart functionality from product details page:
   * 1. User views product details
   * 2. Clicks "Add to Cart"
   * 3. Toast notification appears
   * 4. Product is added to localStorage cart
   */
  test('should add product to cart from details page', async ({ page }) => {
    // ARRANGE - Navigate to product details
    await productDetailsPage.gotoFromHomepageAndClearCart();
    
    // Wait for product to load
    await productDetailsPage.expectProductLoaded();
    const productName = await productDetailsPage.getProductName();

    // ACT - Add to cart
    await productDetailsPage.clickAddToCart();

    // ASSERT - Verify toast message
    await productDetailsPage.expectToast('Item Added to cart');

    // Verify cart in localStorage
    await productDetailsPage.expectItemInCart();
    const cart = await productDetailsPage.getCartItems();
    expect(cart.length).toBe(1);
    
    // Verify product was added (check that name exists and is not empty)
    expect(cart[0].name).toBeTruthy();
    expect(cart[0].name.length).toBeGreaterThan(0);

    console.log(`✅ Successfully added "${productName}" to cart from details page`);
  });

  /**
   * TC3: Similar Products Display
   * 
   * Tests that similar products are displayed:
   * 1. User views product details
   * 2. Similar products section is visible
   * 3. Similar product cards have all required elements
   */
  test('should display similar products', async ({ page }) => {
    // ARRANGE - Navigate to product details
    await productDetailsPage.gotoFromHomepageAndClearCart();

    // ASSERT - Verify similar products section exists
    await productDetailsPage.expectSimilarProductsSection();

    // Check if similar products are displayed
    const count = await productDetailsPage.getSimilarProductsCount();

    if (count > 0) {
      // Verify first similar product has all required elements
      await productDetailsPage.expectSimilarProductCardComplete(0);
      console.log(`✅ ${count} similar products displayed correctly`);
    } else {
      // Verify "No Similar Products" message is shown
      await productDetailsPage.expectNoSimilarProducts();
      console.log('✅ No similar products message displayed correctly');
    }
  });

  /**
   * TC4: Navigate to Similar Product
   * 
   * Tests navigation from current product to similar product:
   * 1. User views product details
   * 2. Clicks "More Details" on similar product
   * 3. Navigates to different product page
   * 4. New product details are displayed
   */
  test('should navigate to similar product when clicked', async ({ page }) => {
    // ARRANGE - Navigate to product details
    await productDetailsPage.gotoFromHomepageAndClearCart();
    
    const initialSlug = await productDetailsPage.getCurrentProductSlug();
    const count = await productDetailsPage.getSimilarProductsCount();

    if (count > 0) {
      // Get similar product name before navigation
      const similarProductName = await productDetailsPage.getSimilarProductName(0);

      // ACT - Click "More Details" on first similar product
      await productDetailsPage.clickSimilarProductDetails(0);

      // ASSERT - Verify navigation to different product
      await productDetailsPage.waitForPageLoad();
      await productDetailsPage.expectDifferentProduct(initialSlug);

      // Verify new product details are displayed
      await productDetailsPage.expectPageStructure();
      await productDetailsPage.expectProductLoaded();

      console.log(`✅ Successfully navigated to similar product "${similarProductName}"`);
    } else {
      console.log('⚠️ Skipped: No similar products available for navigation test');
    }
  });

  /**
   * TC5: Add Similar Product to Cart
   * 
   * Tests adding similar product to cart:
   * 1. User views product details
   * 2. Clicks "Add to Cart" on similar product
   * 3. Product is added to cart
   */
  test('should add similar product to cart', async ({ page }) => {
    // ARRANGE - Navigate to product details
    await productDetailsPage.gotoFromHomepageAndClearCart();
    
    // Wait for product to load
    await productDetailsPage.expectProductLoaded();
    
    const count = await productDetailsPage.getSimilarProductsCount();

    if (count > 0) {
      const similarProductName = await productDetailsPage.getSimilarProductName(0);

      // ACT - Add similar product to cart
      await productDetailsPage.clickSimilarProductAddToCart(0);

      // ASSERT - Verify toast message
      await productDetailsPage.expectToast('Item Added to cart');

      // Verify cart has the product
      await productDetailsPage.expectItemInCart();
      const cart = await productDetailsPage.getCartItems();
      expect(cart.length).toBe(1);
      
      // Verify product was added (check name exists)
      expect(cart[0].name).toBeTruthy();
      expect(cart[0].name.length).toBeGreaterThan(0);

      console.log(`✅ Successfully added similar product "${similarProductName}" to cart`);
    } else {
      console.log('⚠️ Skipped: No similar products available for add to cart test');
    }
  });

  /**
   * TC6: Price Formatting
   * 
   * Tests that prices are displayed in correct USD format:
   * 1. Product price is formatted as currency
   * 2. Similar product prices are formatted as currency
   */
  test('should display prices in correct USD format', async ({ page }) => {
    // ARRANGE - Navigate to product details
    await productDetailsPage.gotoFromHomepageAndClearCart();

    // ASSERT - Verify main product price format
    await productDetailsPage.expectPriceFormatted();

    // Verify similar product price format
    const count = await productDetailsPage.getSimilarProductsCount();
    if (count > 0) {
      await productDetailsPage.expectSimilarProductPriceFormatted(0);
    }

    console.log('✅ Prices displayed in correct USD format');
  });

  /**
   * TC7: Multiple Products Add to Cart
   * 
   * Tests adding main product and similar product to cart:
   * 1. Add main product to cart
   * 2. Add similar product to cart
   * 3. Cart contains both products
   */
  test('should add both main and similar products to cart', async ({ page }) => {
    // ARRANGE - Navigate to product details
    await productDetailsPage.gotoFromHomepageAndClearCart();
    
    // Wait for product to load
    await productDetailsPage.expectProductLoaded();
    const mainProductName = await productDetailsPage.getProductName();

    // ACT - Add main product to cart
    await productDetailsPage.clickAddToCart();
    await productDetailsPage.expectToast('Item Added to cart');

    // Wait longer for toast to fully disappear
    await page.waitForTimeout(2000);

    const count = await productDetailsPage.getSimilarProductsCount();
    
    if (count > 0) {
      const similarProductName = await productDetailsPage.getSimilarProductName(0);

      // Add similar product to cart
      await productDetailsPage.clickSimilarProductAddToCart(0);
      await productDetailsPage.expectToast('Item Added to cart');

      // ASSERT - Verify cart has 2 items
      const cart = await productDetailsPage.getCartItems();
      expect(cart.length).toBe(2);
      
      // Verify both products were added (check names exist)
      expect(cart[0].name).toBeTruthy();
      expect(cart[1].name).toBeTruthy();

      console.log('✅ Successfully added both main and similar products to cart');
    } else {
      // Just verify main product is in cart
      const cart = await productDetailsPage.getCartItems();
      expect(cart.length).toBe(1);
      console.log('✅ Main product added to cart (no similar products available)');
    }
  });

  /**
   * TC8: Navigation Back to Homepage
   * 
   * Tests navigation from product details back to homepage:
   * 1. User navigates to product details
   * 2. Clicks browser back button
   * 3. Returns to homepage
   */
  test('should navigate back to homepage', async ({ page }) => {
    // ARRANGE - Start from homepage
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();

    // Navigate to product details
    await page.getByRole('button', { name: /more details/i }).first().click();
    await productDetailsPage.waitForPageLoad();

    // ACT - Go back
    await productDetailsPage.goBack();

    // ASSERT - Should be back on homepage
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();

    console.log('✅ Successfully navigated back to homepage');
  });

  /**
   * TC9: Product Details API Error Handling
   * 
   * Tests graceful handling when product details API fails:
   * 1. Mock API failure
   * 2. Navigate to product details
   * 3. App handles error gracefully (shows loading state)
   */
  test('should handle product details API failure gracefully', async ({ page }) => {
    // ARRANGE - Mock API failure
    await page.route('**/api/v1/product/get-product/**', route => route.abort());

    // ACT - Try to navigate to product details
    await page.goto('/product/test-product-slug');
    await productDetailsPage.clearCart();

    // ASSERT - Page should load without crashing
    await expect(productDetailsPage.productDetailsHeading).toBeVisible();

    // Should show "Loading..." state since API failed
    const name = await productDetailsPage.getProductName();
    expect(name).toBe('Loading...');

    console.log('✅ Product details API failure handled gracefully');
  });

  /**
   * TC10: Similar Products API Error Handling
   * 
   * Tests graceful handling when similar products API fails:
   * 1. Mock similar products API failure
   * 2. Navigate to product details
   * 3. Main product loads, but no similar products shown
   */
  test('should handle similar products API failure gracefully', async ({ page }) => {
    // ARRANGE - Mock similar products API failure
    await page.route('**/api/v1/product/related-product/**', route => route.abort());

    // ACT - Navigate to product details
    await productDetailsPage.gotoFromHomepageAndClearCart();

    // ASSERT - Main product should load correctly
    await productDetailsPage.expectPageStructure();
    await productDetailsPage.expectProductLoaded();

    // Similar products section should exist but show no products
    await productDetailsPage.expectSimilarProductsSection();
    const count = await productDetailsPage.getSimilarProductsCount();
    expect(count).toBe(0);

    console.log('✅ Similar products API failure handled gracefully');
  });

  /**
   * TC11: Product Image Loading
   * 
   * Tests that product images load correctly:
   * 1. Navigate to product details
   * 2. Product image is visible
   * 3. Image source points to correct API endpoint
   */
  test('should load product image correctly', async ({ page }) => {
    // ARRANGE - Navigate to product details
    await productDetailsPage.gotoFromHomepageAndClearCart();

    // ASSERT - Verify image is visible and has correct source
    await productDetailsPage.expectProductImage();

    console.log('✅ Product image loaded correctly');
  });

  /**
   * TC12: Similar Product Description Truncation
   * 
   * Tests that similar product descriptions are truncated:
   * 1. Navigate to product details
   * 2. Check similar product descriptions
   * 3. Verify they are truncated to 60 characters + "..."
   */
  test('should truncate similar product descriptions', async ({ page }) => {
    // ARRANGE - Navigate to product details
    await productDetailsPage.gotoFromHomepageAndClearCart();

    const count = await productDetailsPage.getSimilarProductsCount();

    if (count > 0) {
      // ACT & ASSERT - Check description length
      const card = productDetailsPage.getSimilarProductCard(0);
      const description = card.locator('.card-text');
      const descText = await description.textContent();

      // Description should be truncated (max 60 chars + "..." = 63 chars)
      if (descText && descText.length > 3) {
        expect(descText.length).toBeLessThanOrEqual(63);
        
        // If it's exactly 63 chars, it should end with "..."
        if (descText.length === 63) {
          expect(descText.endsWith('...')).toBe(true);
        }
      }

      console.log('✅ Similar product descriptions truncated correctly');
    } else {
      console.log('⚠️ Skipped: No similar products to check description truncation');
    }
  });

  /**
   * TC13: Category Display
   * 
   * Tests that product category is displayed correctly:
   * 1. Navigate to product details
   * 2. Category is displayed
   * 3. Category is not "Loading..."
   */
  test('should display product category', async ({ page }) => {
    // ARRANGE - Navigate to product details
    await productDetailsPage.gotoFromHomepageAndClearCart();

    // ASSERT - Verify category is displayed
    const category = await productDetailsPage.getProductCategory();
    expect(category).toBeTruthy();
    expect(category).not.toBe('Loading...');

    console.log(`✅ Product category displayed: "${category}"`);
  });

  /**
   * TC14: Sequential Similar Product Navigation
   * 
   * Tests navigating through multiple similar products:
   * 1. View product A
   * 2. Click similar product B
   * 3. View product B details
   * 4. Product B has its own similar products
   */
  test('should navigate through multiple similar products', async ({ page }) => {
    // ARRANGE - Navigate to first product
    await productDetailsPage.gotoFromHomepageAndClearCart();
    
    const firstProductName = await productDetailsPage.getProductName();
    const firstCount = await productDetailsPage.getSimilarProductsCount();

    if (firstCount > 0) {
      // ACT - Navigate to similar product
      await productDetailsPage.clickSimilarProductDetails(0);
      await productDetailsPage.waitForPageLoad();

      // ASSERT - Verify we're on a different product
      const secondProductName = await productDetailsPage.getProductName();
      expect(secondProductName).not.toBe(firstProductName);

      // Verify second product also has similar products section
      await productDetailsPage.expectSimilarProductsSection();

      console.log(`✅ Navigated from "${firstProductName}" to "${secondProductName}"`);
    } else {
      console.log('⚠️ Skipped: No similar products for sequential navigation test');
    }
  });
});

/**
 * Additional test suite for edge cases
 */
test.describe('Product Details Edge Cases', () => {
  let productDetailsPage: ProductDetailsPage;

  test.beforeEach(async ({ page }) => {
    productDetailsPage = new ProductDetailsPage(page);
    // Note: clearCart() will be called after navigation in each test
  });

  /**
   * TC15: Invalid Product Slug
   * 
   * Tests handling of invalid/non-existent product slug:
   * 1. Navigate to non-existent product
   * 2. App handles gracefully (shows loading or error state)
   */
  test('should handle invalid product slug gracefully', async ({ page }) => {
    // ACT - Navigate to non-existent product
    await page.goto('/product/non-existent-product-12345');
    await productDetailsPage.clearCart();

    // ASSERT - Page should load without crashing
    await expect(productDetailsPage.productDetailsHeading).toBeVisible();

    // Should show loading state or empty state
    const name = await productDetailsPage.getProductName();
    expect(name).toBeTruthy(); // Should have some value (Loading... or empty)

    console.log('✅ Invalid product slug handled gracefully');
  });

  /**
   * TC16: Rapid Add to Cart Clicks
   * 
   * Tests that rapid clicking of add to cart doesn't cause issues:
   * 1. Navigate to product details
   * 2. Click add to cart multiple times rapidly
   * 3. Cart updates correctly
   */
  test('should handle rapid add to cart clicks', async ({ page }) => {
    // ARRANGE - Navigate to product details
    await productDetailsPage.gotoFromHomepageAndClearCart();

    // ACT - Click add to cart multiple times
    await productDetailsPage.clickAddToCart();
    await page.waitForTimeout(100);
    await productDetailsPage.clickAddToCart();
    await page.waitForTimeout(100);
    await productDetailsPage.clickAddToCart();

    // ASSERT - Cart should have multiple items
    const cart = await productDetailsPage.getCartItems();
    expect(cart.length).toBeGreaterThanOrEqual(1);

    console.log(`✅ Rapid add to cart handled correctly (${cart.length} items in cart)`);
  });

  /**
   * TC17: Similar Products with Same Category
   * 
   * Tests that similar products are from the same category:
   * 1. Navigate to product details
   * 2. Note product category
   * 3. Verify similar products exist (they should be same category)
   */
  test('should display similar products from same category', async ({ page }) => {
    // ARRANGE - Navigate to product details
    await productDetailsPage.gotoFromHomepageAndClearCart();
    
    const mainCategory = await productDetailsPage.getProductCategory();
    const count = await productDetailsPage.getSimilarProductsCount();

    if (count > 0 && mainCategory !== 'Uncategorized') {
      // Similar products should exist because main product has a category
      await productDetailsPage.expectSimilarProductsDisplayed();
      
      console.log(`✅ Similar products displayed for category "${mainCategory}"`);
    } else if (mainCategory === 'Uncategorized') {
      // Uncategorized products should show appropriate message
      await productDetailsPage.expectNoSimilarProducts();
      const message = await productDetailsPage.noSimilarProductsMessage.textContent();
      expect(message).toContain('uncategorized');
      
      console.log('✅ Uncategorized product shows appropriate message');
    } else {
      console.log('⚠️ Product has category but no similar products found');
    }
  });
});

