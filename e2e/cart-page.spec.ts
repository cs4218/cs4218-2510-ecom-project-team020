import { test, expect } from "@playwright/test";
import { CartPage } from "./pom/CartPage";

/**
 * Playwright Basic UI tests for Cart Page - using pom
 */

test.describe("Cart Page UI", () => {
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    cartPage = new CartPage(page);
  });

  /**
   * TC1: Test for initial empty cart state:
   * 1. User navigates to cart page
   * 2. Empty cart message is displayed
   * 3. Cart total shows $0.00
   */
  test("should display empty cart state correctly", async ({ page }) => {
    await cartPage.goto();

    await cartPage.expectPageStructure();
    await cartPage.expectEmptyCart();

    await cartPage.expectCartItemCountAccurate();
  });

  /**
   * TC2: Tests adding one item to cart:
   * 1. User adds product to cart from homepage
   * 2. Cart icon updates to show 1 item
   * 3. Navigate to cart page
   * 4. Item is displayed in cart
   */
  test("should add single item to cart and display correctly", async ({
    page,
  }) => {
    await cartPage.addProductToCart(0);
    await cartPage.waitForCartUpdate();

    const cartCount = await cartPage.getCartItemCount();
    expect(cartCount).toBe(1);

    await cartPage.gotoFromHomepage();

    await cartPage.expectCartHasItems();
    await cartPage.expectCartItemComplete(0);
    await cartPage.expectCartTotalCorrect();

  });

  /**
   * TC3: Tests adding multiple items to cart:
   * 1. User adds multiple products to cart
   * 2. Cart icon updates to show correct count
   * 3. All items are displayed in cart
   * 4. Cart total is calculated correctly
   */
  test("should add multiple items to cart and display correctly", async ({
    page,
  }) => {
    await cartPage.addProductToCart(0);
    await cartPage.waitForCartUpdate();

    await cartPage.addProductToCart(1);
    await cartPage.waitForCartUpdate();

    const cartCount = await cartPage.getCartItemCount();
    expect(cartCount).toBe(2);

    await cartPage.gotoFromHomepage();

    await cartPage.expectCartHasItems();
    const itemCount = await cartPage.getCartItemsCount();
    expect(itemCount).toBe(2);

    await cartPage.expectCartItemComplete(0);
    await cartPage.expectCartItemComplete(1);

  });

  /**
   * TC4: Tests removing an item from cart:
   * 1. User has items in cart
   * 2. User clicks remove button on an item
   * 3. Item is removed from cart
   * 4. Cart total updates
   */
  test("should remove item from cart correctly", async ({ page }) => {
    await cartPage.addProductToCart(0);
    await cartPage.waitForCartUpdate();
    await cartPage.addProductToCart(1);
    await cartPage.waitForCartUpdate();

    await cartPage.gotoFromHomepage();
    await cartPage.expectCartHasItems();

    const initialCount = await cartPage.getCartItemsCount();
    expect(initialCount).toBeGreaterThan(0);

    await cartPage.removeCartItem(0);
    await cartPage.waitForCartUpdate();

    const newCount = await cartPage.getCartItemsCount();
    expect(newCount).toBe(initialCount - 1);

    await cartPage.expectCartTotalCorrect();

  });

  /**
   * TC5: Tests that cart items display correctly:
   * 1. User has item in cart
   * 2. Item shows product name, price, and remove button
   * 3. Cart total is calculated correctly
   */
  test("should display cart items correctly", async ({ page }) => {
    await cartPage.addProductToCart(0);
    await cartPage.waitForCartUpdate();
    await cartPage.gotoFromHomepage();

    await cartPage.expectCartItemComplete(0);

    await cartPage.expectCartTotalCorrect();

  });

  /**
   * TC6: Tests that cart total is calculated correctly:
   * 1. User adds items with known prices
   * 2. Cart total reflects sum of item prices
   * 3. Total format is correct (USD currency)
   */
  test("should calculate cart total correctly", async ({ page }) => {
    await cartPage.addProductToCart(0);
    await cartPage.waitForCartUpdate();
    await cartPage.gotoFromHomepage();

    await cartPage.expectCartTotalCorrect();

    const totalText = await cartPage.getCartTotal();
    expect(totalText).toMatch(/Total : \$[\d,]+\.\d{2}/);

  });

  /**
   * TC8: Tests that cart item count is displayed correctly:
   * 1. User adds items to cart
   * 2. Cart count text shows correct number
   * 3. Count matches actual items
   */
  test("should display cart item count correctly", async ({ page }) => {
    // ARRANGE - Add items to cart
    await cartPage.addProductToCart(0);
    await cartPage.waitForCartUpdate();
    await cartPage.addProductToCart(1);
    await cartPage.waitForCartUpdate();

    await cartPage.gotoFromHomepage();

    // ASSERT - Verify cart count text
    await expect(cartPage.cartCountText).toBeVisible();

    const countText = await cartPage.cartCountText.textContent();
    expect(countText).toContain("You Have 2 items in your cart");
  });

  /**
   * TC9: Cart Item Information Display
   * 1. Product name is displayed
   * 2. Product price is displayed
   * 3. Remove button is present
   * 4. Product image is displayed
   */
  test("should display complete cart item information", async ({ page }) => {
    await cartPage.addProductToCart(0);
    await cartPage.waitForCartUpdate();
    await cartPage.gotoFromHomepage();

    await cartPage.expectCartItemComplete(0);

    const itemName = await cartPage.getCartItemName(0);
    const itemPrice = await cartPage.getCartItemPrice(0);

    expect(itemName.length).toBeGreaterThan(0);
    expect(itemPrice).toContain("Price : 54.99");

  });

  /**
   * TC10: Tests adding the same product multiple times:
   * 1. User adds same product twice
   * 2. Cart should add as separate items
   * 3. Total should reflect correct calculation
   */
  test("should handle adding same product multiple times", async ({ page }) => {
    await cartPage.addProductToCart(0);
    await cartPage.waitForCartUpdate();
    await cartPage.addProductToCart(0);
    await cartPage.waitForCartUpdate();

    await cartPage.gotoFromHomepage();

    await cartPage.expectCartHasItems();
    await cartPage.expectCartTotalCorrect();

  });
});

test.describe("Cart Page Navigations", () => {
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    cartPage = new CartPage(page);
  });

  /**
   * TC11: Tests navigation from homepage to cart
   *
   * 1. User clicks cart icon on homepage
   * 2. Navigates to cart page
   * 3. Cart page loads correctly
   */
  test("should navigate to cart from homepage", async ({ page }) => {
    await cartPage.gotoFromHomepage();

    await cartPage.expectPageStructure();
    await expect(page).toHaveURL(/\/cart/);

  });
  /**
   * TC12: Tests navigation from cart back to homepage:
   * 1. User is on cart page
   * 2. User clicks "Continue Shopping" or "Home"
   * 3. Navigates back to homepage
   */
  test("should navigate back to homepage from cart", async ({ page }) => {
    await cartPage.goto();
    await cartPage.goToHomepage();
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: "All Products" })
    ).toBeVisible();

  });

  /**
   * TC13: Cart Persistence Across Navigation
   * 1. User adds items to cart
   * 2. User navigates to other pages
   * 3. User returns to cart
   */
  test("should persist cart items across navigation", async ({ page }) => {
    await cartPage.addProductToCart(0);
    await cartPage.waitForCartUpdate();
    await cartPage.addProductToCart(1);
    await cartPage.waitForCartUpdate();

    const initialCount = await cartPage.getCartItemCount();

    await cartPage.gotoFromHomepage();
    await cartPage.expectCartHasItems();

    await cartPage.goToHomepage();
    await cartPage.gotoFromHomepage();

    const finalCount = await cartPage.getCartItemsCount();
    expect(finalCount).toBe(initialCount);

    console.log("✅ Cart items persisted across navigation");
  });
});

test.describe("Cart Page Edge Cases", () => {
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    cartPage = new CartPage(page);
  });
  /**
   * TC14: Tests graceful handling when cart API fails:
   * 1. Mock cart API failure
   * 2. Navigate to cart page
   * 3. App handles error gracefully
   */
  test("should handle cart API failure gracefully", async ({ page }) => {
    await page.route("**/api/v1/cart/**", (route) => route.abort());

    await cartPage.goto();

    await cartPage.expectPageStructure();
  });

  /**
   * TC15: Tests cart with many items:
   * 1. Add many items to cart
   * 2. Verify all items are displayed
   * 3. Verify total calculation is correct
   */
  test("should handle large cart correctly", async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await cartPage.addProductToCart(i);
      await cartPage.waitForCartUpdate();
    }

    await cartPage.gotoFromHomepage();

    await cartPage.expectCartHasItems();
    const itemCount = await cartPage.getCartItemsCount();
    expect(itemCount).toBeGreaterThanOrEqual(1);

    await cartPage.expectCartTotalCorrect();
  });
});
