import { Page, expect, Locator } from '@playwright/test';

/**
 * Page Object Model for Product Details Page
 * Encapsulates product details page interactions and assertions
 */
export class ProductDetailsPage {
  readonly page: Page;
  readonly productDetailsHeading: Locator;
  readonly productImage: Locator;
  readonly noImageMessage: Locator;
  readonly productName: Locator;
  readonly productDescription: Locator;
  readonly productPrice: Locator;
  readonly productCategory: Locator;
  readonly addToCartButton: Locator;
  readonly similarProductsHeading: Locator;
  readonly similarProductCards: Locator;
  readonly noSimilarProductsMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Main product details locators
    this.productDetailsHeading = page.getByRole('heading', { name: 'Product Details' });
    this.productImage = page.locator('.product-details .card-img-top');
    this.noImageMessage = page.getByText('No Image Available');
    this.productName = page.locator('.product-details-info h6').filter({ hasText: 'Name :' });
    this.productDescription = page.locator('.product-details-info h6').filter({ hasText: 'Description :' });
    this.productPrice = page.locator('.product-details-info h6').filter({ hasText: 'Price :' });
    this.productCategory = page.locator('.product-details-info h6').filter({ hasText: 'Category :' });
    this.addToCartButton = page.locator('.product-details-info').getByRole('button', { name: 'ADD TO CART' });
    
    // Similar products locators
    this.similarProductsHeading = page.getByRole('heading', { name: /Similar Products/i });
    this.similarProductCards = page.locator('.similar-products .card');
    this.noSimilarProductsMessage = page.locator('.similar-products p.text-center');
  }

  /**
   * Navigate to a product details page by slug
   * @param slug - Product slug
   */
  async goto(slug: string) {
    await this.page.goto(`/product/${slug}`);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to product details from homepage
   * Clicks the first "More Details" button on homepage
   */
  async gotoFromHomepage() {
    await this.page.goto('/');
    await expect(this.page.getByRole('heading', { name: 'All Products' })).toBeVisible();
    await this.page.getByRole('button', { name: /more details/i }).first().click();
    await this.waitForPageLoad();
  }

  /**
   * Navigate to product details from homepage and clear cart
   * Convenience method for tests
   */
  async gotoFromHomepageAndClearCart() {
    await this.gotoFromHomepage();
    await this.clearCart();
  }

  /**
   * Wait for product details page to load
   */
  async waitForPageLoad() {
    await expect(this.page).toHaveURL(/\/product\//);
    await expect(this.productDetailsHeading).toBeVisible();
  }

  /**
   * Verify product details page structure
   */
  async expectPageStructure() {
    await expect(this.productDetailsHeading).toBeVisible();
    await expect(this.productName).toBeVisible();
    await expect(this.productDescription).toBeVisible();
    await expect(this.productPrice).toBeVisible();
    await expect(this.productCategory).toBeVisible();
    await expect(this.addToCartButton).toBeVisible();
    await expect(this.similarProductsHeading).toBeVisible();
  }

  /**
   * Verify product image is displayed
   */
  async expectProductImage() {
    await expect(this.productImage).toBeVisible();
    const src = await this.productImage.getAttribute('src');
    expect(src).toContain('/api/v1/product/product-photo/');
  }

  /**
   * Verify "No Image Available" message is shown
   */
  async expectNoImage() {
    await expect(this.noImageMessage).toBeVisible();
  }

  /**
   * Get product name text
   */
  async getProductName(): Promise<string> {
    const text = await this.productName.textContent();
    return text?.replace('Name :', '').trim() || '';
  }

  /**
   * Get product description text
   */
  async getProductDescription(): Promise<string> {
    const text = await this.productDescription.textContent();
    return text?.replace('Description :', '').trim() || '';
  }

  /**
   * Get product price text
   */
  async getProductPrice(): Promise<string> {
    const text = await this.productPrice.textContent();
    return text?.replace('Price :', '').trim() || '';
  }

  /**
   * Get product category text
   */
  async getProductCategory(): Promise<string> {
    const text = await this.productCategory.textContent();
    return text?.replace('Category :', '').trim() || '';
  }

  /**
   * Verify product is not loading (has actual data)
   * Waits for the product data to load from API
   */
  async expectProductLoaded() {
    // Wait for the product name to NOT be "Loading..." (with retry)
    await this.page.waitForFunction(() => {
      const nameElement = document.querySelector('.product-details-info h6');
      const text = nameElement?.textContent || '';
      return text.includes('Name :') && !text.includes('Loading...');
    }, { timeout: 10000 });
    
    // Additional verification that other fields are also loaded
    const name = await this.getProductName();
    const description = await this.getProductDescription();
    const price = await this.getProductPrice();
    
    expect(name).not.toBe('Loading...');
    expect(name.length).toBeGreaterThan(0);
    expect(description).not.toBe('Loading...');
    expect(price).not.toContain('Loading...');
  }

  /**
   * Verify product category is "Uncategorized"
   */
  async expectUncategorized() {
    const category = await this.getProductCategory();
    expect(category).toBe('Uncategorized');
  }

  /**
   * Click "Add to Cart" button
   */
  async clickAddToCart() {
    await this.addToCartButton.click();
  }

  /**
   * Verify toast message is displayed
   * @param message - Expected toast message
   */
  async expectToast(message: string) {
    // Use .first() to handle multiple toasts that might appear
    await expect(this.page.getByText(message).first()).toBeVisible({ timeout: 5000 });
  }

  /**
   * Get cart items from localStorage
   */
  async getCartItems(): Promise<any[]> {
    return await this.page.evaluate(() => {
      const cart = localStorage.getItem('cart');
      return cart ? JSON.parse(cart) : [];
    });
  }

  /**
   * Verify item was added to cart
   */
  async expectItemInCart() {
    const cart = await this.getCartItems();
    expect(cart.length).toBeGreaterThan(0);
  }

  /**
   * Clear cart (for test cleanup)
   * Must be called after navigating to a page
   */
  async clearCart() {
    try {
      await this.page.evaluate(() => {
        localStorage.removeItem('cart');
      });
    } catch (error) {
      // Ignore localStorage errors if page hasn't loaded yet
      // This can happen if called before navigation
    }
  }

  /**
   * Get number of similar product cards
   */
  async getSimilarProductsCount(): Promise<number> {
    return await this.similarProductCards.count();
  }

  /**
   * Get a specific similar product card by index
   * @param index - Zero-based index
   */
  getSimilarProductCard(index: number): Locator {
    return this.similarProductCards.nth(index);
  }

  /**
   * Verify similar products section is displayed
   */
  async expectSimilarProductsSection() {
    await expect(this.similarProductsHeading).toBeVisible();
  }

  /**
   * Verify similar products are displayed
   */
  async expectSimilarProductsDisplayed() {
    await this.expectSimilarProductsSection();
    const count = await this.getSimilarProductsCount();
    expect(count).toBeGreaterThan(0);
  }

  /**
   * Verify no similar products message is displayed
   */
  async expectNoSimilarProducts() {
    await this.expectSimilarProductsSection();
    await expect(this.noSimilarProductsMessage).toBeVisible();
    const count = await this.getSimilarProductsCount();
    expect(count).toBe(0);
  }

  /**
   * Verify similar product card has all required elements
   * @param cardIndex - Index of the card to verify
   */
  async expectSimilarProductCardComplete(cardIndex: number = 0) {
    const card = this.getSimilarProductCard(cardIndex);
    
    await expect(card).toBeVisible();
    await expect(card.locator('.card-img-top')).toBeVisible();
    await expect(card.locator('.card-title').first()).toBeVisible();
    await expect(card.locator('.card-price')).toBeVisible();
    await expect(card.locator('.card-text')).toBeVisible();
    await expect(card.getByRole('button', { name: 'More Details' })).toBeVisible();
    await expect(card.getByRole('button', { name: 'ADD TO CART' })).toBeVisible();
  }

  /**
   * Click "More Details" on a similar product
   * @param cardIndex - Index of the card to click
   */
  async clickSimilarProductDetails(cardIndex: number = 0) {
    const card = this.getSimilarProductCard(cardIndex);
    await card.getByRole('button', { name: 'More Details' }).click();
  }

  /**
   * Click "Add to Cart" on a similar product
   * @param cardIndex - Index of the card to click
   */
  async clickSimilarProductAddToCart(cardIndex: number = 0) {
    const card = this.getSimilarProductCard(cardIndex);
    await card.getByRole('button', { name: 'ADD TO CART' }).click();
  }

  /**
   * Get similar product name
   * @param cardIndex - Index of the card
   */
  async getSimilarProductName(cardIndex: number = 0): Promise<string> {
    const card = this.getSimilarProductCard(cardIndex);
    const title = card.locator('.card-title').first();
    return (await title.textContent()) || '';
  }

  /**
   * Verify price is formatted correctly (USD currency)
   */
  async expectPriceFormatted() {
    const price = await this.getProductPrice();
    // Should be in format like "$99.99" or "$1,234.56"
    expect(price).toMatch(/^\$[\d,]+\.\d{2}$/);
  }

  /**
   * Verify similar product price is formatted correctly
   * @param cardIndex - Index of the card
   */
  async expectSimilarProductPriceFormatted(cardIndex: number = 0) {
    const card = this.getSimilarProductCard(cardIndex);
    const priceElement = card.locator('.card-price');
    const priceText = await priceElement.textContent();
    expect(priceText).toMatch(/^\$[\d,]+\.\d{2}$/);
  }

  /**
   * Navigate back to previous page
   */
  async goBack() {
    await this.page.goBack();
  }

  /**
   * Get current product slug from URL
   */
  async getCurrentProductSlug(): Promise<string> {
    const url = this.page.url();
    const match = url.match(/\/product\/([^/]+)/);
    return match ? match[1] : '';
  }

  /**
   * Verify we're on a different product page
   * @param previousSlug - Previous product slug to compare against
   */
  async expectDifferentProduct(previousSlug: string) {
    const currentSlug = await this.getCurrentProductSlug();
    expect(currentSlug).not.toBe(previousSlug);
    expect(currentSlug.length).toBeGreaterThan(0);
  }
}

