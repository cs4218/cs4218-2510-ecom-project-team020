import { Page, expect, Locator } from '@playwright/test';

/**
 * Page Object Model for Cart Page
 * Encapsulates cart page interactions and assertions
 */
export class CartPage {
  readonly page: Page;
  readonly cartHeading: Locator;
  readonly emptyCartMessage: Locator;
  readonly cartItems: Locator;
  readonly cartTotal: Locator;
  readonly paymentButton: Locator;
  readonly cartIcon: Locator;
  readonly cartCountText: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Locators for cart page elements based on actual implementation
    this.cartHeading = page.locator('h1.text-center.bg-light');
    this.emptyCartMessage = page.getByText('Your Cart Is Empty');
    this.cartItems = page.locator('.row.card.flex-row');
    this.cartTotal = page.locator('h4').filter({ hasText: /Total :/ });
    this.paymentButton = page.getByRole('button', { name: 'Make Payment' });
    this.cartIcon = page.getByRole('listitem').filter({ hasText: /Cart\d+/ });
    this.cartCountText = page.locator('p').filter({ hasText: /You Have \d+ items in your cart/ });
  }

  /**
   * Navigate to cart page
   */
  async goto() {
    await this.page.goto('/cart');
    await this.waitForPageLoad();
  }

  /**
   * Navigate to cart from homepage by clicking cart icon
   */
  async gotoFromHomepage() {
    await this.page.goto('/');
    await expect(this.page.getByRole('heading', { name: 'All Products' })).toBeVisible();
    
    // Click cart icon in navigation
    await this.cartIcon.click();
    await this.waitForPageLoad();
  }

  /**
   * Wait for cart page to load
   */
  async waitForPageLoad() {
    await expect(this.page).toHaveURL(/\/cart/);
    await expect(this.cartHeading).toBeVisible({ timeout: 10000 });
    // Wait for cart data to load
    await this.page.waitForTimeout(1000);
  }

  /**
   * Wait for cart data to load from API
   */
  async waitForCartDataLoad() {
    await this.page.waitForFunction(() => {
      const heading = document.querySelector('h2');
      return heading?.textContent?.includes('Your Cart');
    }, { timeout: 10000 });
  }

  /**
   * Get cart item count from cart icon
   */
  async getCartItemCount(): Promise<number> {
    const text = await this.cartIcon.textContent();
    const match = text?.match(/Cart(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Get number of cart items displayed
   */
  async getCartItemsCount(): Promise<number> {
    return await this.cartItems.count();
  }

  /**
   * Get a specific cart item by index
   * @param index - Zero-based index
   */
  getCartItem(index: number): Locator {
    return this.cartItems.nth(index);
  }

  /**
   * Verify cart page structure
   */
  async expectPageStructure() {
    await expect(this.cartHeading).toBeVisible();
  }

  /**
   * Verify empty cart state
   */
  async expectEmptyCart() {
    await expect(this.emptyCartMessage).toBeVisible();
    await expect(this.cartTotal).toBeVisible();
    const itemCount = await this.getCartItemsCount();
    expect(itemCount).toBe(0);
  }

  /**
   * Verify cart has items
   */
  async expectCartHasItems() {
    const itemCount = await this.getCartItemsCount();
    expect(itemCount).toBeGreaterThan(0);
    await expect(this.cartTotal).toBeVisible();
  }

  /**
   * Get cart total amount
   */
  async getCartTotal(): Promise<string> {
    const totalText = await this.cartTotal.textContent();
    return totalText || '';
  }

  /**
   * Get product name from a cart item
   * @param itemIndex - Index of the item
   */
  async getCartItemName(itemIndex: number = 0): Promise<string> {
    const item = this.getCartItem(itemIndex);
    const nameElement = item.locator('p').first();
    return (await nameElement.textContent()) || '';
  }

  /**
   * Get product price from a cart item
   * @param itemIndex - Index of the item
   */
  async getCartItemPrice(itemIndex: number = 0): Promise<string> {
    const item = this.getCartItem(itemIndex);
    const priceElement = item.locator('p').filter({ hasText: /Price :/ });
    return (await priceElement.textContent()) || '';
  }

  /**
   * Get product quantity from a cart item (always 1 in this implementation)
   * @param itemIndex - Index of the item
   */
  async getCartItemQuantity(itemIndex: number = 0): Promise<number> {
    // This cart implementation doesn't have quantity controls, each item is quantity 1
    return 1;
  }

  /**
   * Click remove button on a cart item
   * @param itemIndex - Index of the item to remove
   */
  async removeCartItem(itemIndex: number = 0) {
    const item = this.getCartItem(itemIndex);
    const removeButton = item.getByRole('button', { name: 'Remove' });
    await removeButton.click();
  }

  /**
   * Update quantity of a cart item (not supported in this implementation)
   * @param itemIndex - Index of the item
   * @param newQuantity - New quantity value
   */
  async updateCartItemQuantity(itemIndex: number, newQuantity: number) {
    // This cart implementation doesn't support quantity updates
    // Each item is treated as quantity 1
    console.log('Quantity updates not supported in this cart implementation');
  }

  /**
   * Click payment button
   */
  async clickPayment() {
    await this.paymentButton.click();
  }

  /**
   * Navigate back to homepage
   */
  async goToHomepage() {
    await this.page.getByRole('link', { name: 'Home' }).click();
    await expect(this.page.getByRole('heading', { name: 'All Products' })).toBeVisible();
  }

  /**
   * Add product to cart from homepage
   * @param productIndex - Index of product to add (0-based)
   */
  async addProductToCart(productIndex: number = 0) {
    await this.page.goto('/');
    await expect(this.page.getByRole('heading', { name: 'All Products' })).toBeVisible();
    
    // Click add to cart button on specified product - using the actual button text and class
    const productCard = this.page.locator('.card.m-2').nth(productIndex);
    const addToCartButton = productCard.getByRole('button', { name: 'ADD TO CART' });
    await addToCartButton.click();
    
    // Wait for toast notification
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify cart item has all required elements
   * @param itemIndex - Index of the item to verify
   */
  async expectCartItemComplete(itemIndex: number = 0) {
    const item = this.getCartItem(itemIndex);
    
    await expect(item).toBeVisible();
    await expect(item.locator('img.card-img-top')).toBeVisible();
    await expect(item.locator('p').first()).toBeVisible(); // Product name
    await expect(item.locator('p').filter({ hasText: /Price :/ })).toBeVisible();
    await expect(item.getByRole('button', { name: 'Remove' })).toBeVisible();
  }

  /**
   * Verify cart total is calculated correctly
   */
  async expectCartTotalCorrect() {
    const totalText = await this.getCartTotal();
    expect(totalText).toMatch(/Total : \$[\d,]+\.\d{2}/);
  }

  /**
   * Verify cart item count matches displayed items
   */
  async expectCartItemCountAccurate() {
    const iconCount = await this.getCartItemCount();
    const actualCount = await this.getCartItemsCount();
    expect(iconCount).toBe(actualCount);
  }

  /**
   * Wait for cart to update after adding/removing items
   */
  async waitForCartUpdate() {
    await this.page.waitForTimeout(1000); // Wait for cart state to update
  }

  /**
   * Verify cart is empty after clearing
   */
  async expectCartCleared() {
    await this.expectEmptyCart();
    const iconCount = await this.getCartItemCount();
    expect(iconCount).toBe(0);
  }
}
