import { Page, expect, Locator } from '@playwright/test';

/**
 * Page Object Model for Search functionality
 * Encapsulates search-related interactions and assertions
 */
export class SearchPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly searchResultsHeading: Locator;
  readonly resultCountText: Locator;
  readonly productCards: Locator;
  readonly noResultsMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Locators for search form (in header)
    this.searchInput = page.getByPlaceholder('Search');
    this.searchButton = page.getByRole('button', { name: 'Search' });
    
    // Locators for search results page
    this.searchResultsHeading = page.getByRole('heading', { name: 'Search Results' });
    this.resultCountText = page.locator('h6').filter({ hasText: /Found|No Products Found/ });
    this.productCards = page.locator('.card.m-2');
    this.noResultsMessage = page.getByText('No Products Found');
  }

  /**
   * Navigate to homepage
   */
  async goto() {
    await this.page.goto('/');
    await expect(this.page.getByRole('heading', { name: 'All Products' })).toBeVisible();
  }

  /**
   * Perform a search
   * @param keyword - Search term
   */
  async search(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.searchButton.click();
  }

  /**
   * Wait for search results page to load
   */
  async waitForSearchResults() {
    await expect(this.page).toHaveURL(/\/search/);
    await expect(this.searchResultsHeading).toBeVisible();
  }

  /**
   * Get the number of product cards displayed
   */
  async getProductCount(): Promise<number> {
    return await this.productCards.count();
  }

  /**
   * Get a specific product card by index
   * @param index - Zero-based index of the product card
   */
  getProductCard(index: number): Locator {
    return this.productCards.nth(index);
  }

  /**
   * Verify search results are displayed
   */
  async expectResultsDisplayed() {
    await expect(this.searchResultsHeading).toBeVisible();
    const count = await this.getProductCount();
    expect(count).toBeGreaterThan(0);
  }

  /**
   * Verify no results message is displayed
   */
  async expectNoResults() {
    await expect(this.noResultsMessage).toBeVisible();
    const count = await this.getProductCount();
    expect(count).toBe(0);
  }

  /**
   * Verify result count text is displayed
   * @param expectedCount - Expected number of results (optional)
   */
  async expectResultCount(expectedCount?: number) {
    await expect(this.resultCountText).toBeVisible();
    
    if (expectedCount !== undefined) {
      await expect(this.resultCountText).toHaveText(`Found ${expectedCount}`);
    } else {
      await expect(this.resultCountText).toContainText(/Found \d+/);
    }
  }

  /**
   * Verify product card has all required elements
   * @param cardIndex - Index of the card to verify
   */
  async expectProductCardComplete(cardIndex: number = 0) {
    const card = this.getProductCard(cardIndex);
    
    await expect(card).toBeVisible();
    await expect(card.locator('.card-img-top')).toBeVisible();
    await expect(card.locator('.card-title')).toBeVisible();
    // Check that at least one .card-text element exists (description or price)
    await expect(card.locator('.card-text').first()).toBeVisible();
    await expect(card.getByRole('button', { name: 'More Details' })).toBeVisible();
    await expect(card.getByRole('button', { name: 'ADD TO CART' })).toBeVisible();
  }

  /**
   * Click "More Details" on a product card
   * @param cardIndex - Index of the card to click
   */
  async clickMoreDetails(cardIndex: number = 0) {
    const card = this.getProductCard(cardIndex);
    await card.getByRole('button', { name: 'More Details' }).click();
  }

  /**
   * Click "Add to Cart" on a product card
   * @param cardIndex - Index of the card to click
   */
  async clickAddToCart(cardIndex: number = 0) {
    const card = this.getProductCard(cardIndex);
    await card.getByRole('button', { name: 'ADD TO CART' }).click();
  }

  /**
   * Verify toast message is displayed
   * @param message - Expected toast message
   */
  async expectToast(message: string) {
    await expect(this.page.getByText(message)).toBeVisible({ timeout: 5000 });
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
   */
  async clearCart() {
    await this.page.evaluate(() => {
      localStorage.removeItem('cart');
    });
  }

  /**
   * Get product name from a card
   * @param cardIndex - Index of the card
   */
  async getProductName(cardIndex: number = 0): Promise<string> {
    const card = this.getProductCard(cardIndex);
    const title = card.locator('.card-title');
    return (await title.textContent()) || '';
  }

  /**
   * Get product description from a card
   * @param cardIndex - Index of the card
   */
  async getProductDescription(cardIndex: number = 0): Promise<string> {
    const card = this.getProductCard(cardIndex);
    const description = card.locator('.card-text');
    return (await description.textContent()) || '';
  }

  /**
   * Get product price from a card
   * @param cardIndex - Index of the card
   */
  async getProductPrice(cardIndex: number = 0): Promise<string> {
    const card = this.getProductCard(cardIndex);
    const price = card.locator('.card-text').filter({ hasText: '$' });
    return (await price.textContent()) || '';
  }

  /**
   * Verify product card contains keyword in name or description
   * @param cardIndex - Index of the card
   * @param keyword - Search keyword to verify
   */
  async expectProductContainsKeyword(cardIndex: number, keyword: string) {
    const name = await this.getProductName(cardIndex);
    const description = await this.getProductDescription(cardIndex);
    
    const nameMatch = name.toLowerCase().includes(keyword.toLowerCase());
    const descriptionMatch = description.toLowerCase().includes(keyword.toLowerCase());
    
    expect(nameMatch || descriptionMatch).toBe(true);
  }
}

