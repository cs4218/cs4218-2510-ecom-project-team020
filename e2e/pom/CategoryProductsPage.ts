import { Page, expect, Locator } from '@playwright/test';

/**
 * Page Object Model for Category Products Page
 * Encapsulates category products page interactions and assertions
 */
export class CategoryProductsPage {
  readonly page: Page;
  readonly categoryHeading: Locator;
  readonly resultCountText: Locator;
  readonly productCards: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Locators for category page elements
    this.categoryHeading = page.locator('h4.text-center').filter({ hasText: 'Category -' });
    this.resultCountText = page.locator('h6.text-center').filter({ hasText: /result found/ });
    this.productCards = page.locator('.category .card.m-2');
  }

  /**
   * Navigate to a category page by slug
   * @param slug - Category slug
   */
  async goto(slug: string) {
    await this.page.goto(`/category/${slug}`);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to category from homepage by clicking category link
   * @param categoryName - Name of the category to click (e.g., "Electronics", "Books")
   */
  async gotoFromHomepage(categoryName: string) {
    await this.page.goto('/');
    await expect(this.page.getByRole('heading', { name: 'All Products' })).toBeVisible();
    
    // Click on Categories dropdown
    await this.page.getByRole('link', { name: 'Categories' }).click();
    
    // Click on specific category
    await this.page.getByRole('link', { name: categoryName }).click();
    
    await this.waitForPageLoad();
  }

  /**
   * Navigate to first available category from homepage
   */
  async gotoFirstCategoryFromHomepage() {
    await this.page.goto('/');
    await expect(this.page.getByRole('heading', { name: 'All Products' })).toBeVisible();
    
    // Click on Categories dropdown
    await this.page.getByRole('link', { name: 'Categories' }).click();
    
    // Wait a bit for dropdown to open
    await this.page.waitForTimeout(500);
    
    // Click on first category in dropdown (skip "All Categories" link)
    const categoryLinks = this.page.locator('.dropdown-menu .dropdown-item');
    const count = await categoryLinks.count();
    
    if (count > 1) {
      // Click second item (first is "All Categories")
      await categoryLinks.nth(1).click();
    } else {
      // Fallback: click first item
      await categoryLinks.first().click();
    }
    
    await this.waitForPageLoad();
  }

  /**
   * Wait for category page to load
   */
  async waitForPageLoad() {
    await expect(this.page).toHaveURL(/\/category\//);
    await expect(this.categoryHeading).toBeVisible({ timeout: 10000 });
    // Wait for category data to load from API
    await this.waitForCategoryDataLoad();
  }

  /**
   * Wait for category data to load from API
   */
  async waitForCategoryDataLoad() {
    await this.page.waitForFunction(() => {
      const heading = document.querySelector('h4.text-center');
      const text = heading?.textContent || '';
      // Category name should be present (not just "Category -")
      return text.includes('Category -') && text.replace('Category -', '').trim().length > 0;
    }, { timeout: 10000 });
  }

  /**
   * Get category name from heading
   */
  async getCategoryName(): Promise<string> {
    const text = await this.categoryHeading.textContent();
    return text?.replace('Category -', '').trim() || '';
  }

  /**
   * Get result count from the page
   */
  async getResultCount(): Promise<number> {
    const text = await this.resultCountText.textContent();
    const match = text?.match(/(\d+)\s+result found/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Get number of product cards displayed
   */
  async getProductCardsCount(): Promise<number> {
    return await this.productCards.count();
  }

  /**
   * Get a specific product card by index
   * @param index - Zero-based index
   */
  getProductCard(index: number): Locator {
    return this.productCards.nth(index);
  }

  /**
   * Verify category page structure
   */
  async expectPageStructure() {
    await expect(this.categoryHeading).toBeVisible();
    await expect(this.resultCountText).toBeVisible();
  }

  /**
   * Verify products are displayed
   */
  async expectProductsDisplayed() {
    const count = await this.getProductCardsCount();
    expect(count).toBeGreaterThan(0);
  }

  /**
   * Verify no products are displayed
   */
  async expectNoProducts() {
    const count = await this.getProductCardsCount();
    expect(count).toBe(0);
  }

  /**
   * Verify result count matches actual product cards
   */
  async expectResultCountAccurate() {
    const displayedCount = await this.getResultCount();
    const actualCount = await this.getProductCardsCount();
    expect(displayedCount).toBe(actualCount);
  }

  /**
   * Verify product card has all required elements
   * @param cardIndex - Index of the card to verify
   */
  async expectProductCardComplete(cardIndex: number = 0) {
    const card = this.getProductCard(cardIndex);
    
    await expect(card).toBeVisible();
    await expect(card.locator('.card-img-top')).toBeVisible();
    await expect(card.locator('.card-title').first()).toBeVisible();
    await expect(card.locator('.card-price')).toBeVisible();
    await expect(card.locator('.card-text')).toBeVisible();
    await expect(card.getByRole('button', { name: 'More Details' })).toBeVisible();
  }

  /**
   * Get product name from a card
   * @param cardIndex - Index of the card
   */
  async getProductName(cardIndex: number = 0): Promise<string> {
    const card = this.getProductCard(cardIndex);
    const title = card.locator('.card-title').first();
    return (await title.textContent()) || '';
  }

  /**
   * Get product price from a card
   * @param cardIndex - Index of the card
   */
  async getProductPrice(cardIndex: number = 0): Promise<string> {
    const card = this.getProductCard(cardIndex);
    const price = card.locator('.card-price');
    return (await price.textContent()) || '';
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
   * Click "More Details" on a product card
   * @param cardIndex - Index of the card to click
   */
  async clickMoreDetails(cardIndex: number = 0) {
    const card = this.getProductCard(cardIndex);
    await card.getByRole('button', { name: 'More Details' }).click();
  }

  /**
   * Verify price is formatted correctly (USD currency)
   * @param cardIndex - Index of the card
   */
  async expectPriceFormatted(cardIndex: number = 0) {
    const price = await this.getProductPrice(cardIndex);
    // Should be in format like "$99.99" or "$1,234.56"
    expect(price).toMatch(/^\$[\d,]+\.\d{2}$/);
  }

  /**
   * Verify description is truncated (max 60 chars + "...")
   * @param cardIndex - Index of the card
   */
  async expectDescriptionTruncated(cardIndex: number = 0) {
    const description = await this.getProductDescription(cardIndex);
    
    if (description && description !== 'No description available') {
      // Description should be truncated (max 60 chars + "..." = 63 chars)
      expect(description.length).toBeLessThanOrEqual(63);
      
      // If it's exactly 63 chars, it should end with "..."
      if (description.length === 63) {
        expect(description.endsWith('...')).toBe(true);
      }
    }
  }

  /**
   * Verify product image is displayed
   * @param cardIndex - Index of the card
   */
  async expectProductImage(cardIndex: number = 0) {
    const card = this.getProductCard(cardIndex);
    const image = card.locator('.card-img-top');
    await expect(image).toBeVisible();
    
    const src = await image.getAttribute('src');
    expect(src).toContain('/api/v1/product/product-photo/');
  }

  /**
   * Navigate back to previous page
   */
  async goBack() {
    await this.page.goBack();
  }

  /**
   * Get current category slug from URL
   */
  async getCurrentCategorySlug(): Promise<string> {
    const url = this.page.url();
    const match = url.match(/\/category\/([^/]+)/);
    return match ? match[1] : '';
  }

  /**
   * Verify we're on a different category page
   * @param previousSlug - Previous category slug to compare against
   */
  async expectDifferentCategory(previousSlug: string) {
    const currentSlug = await this.getCurrentCategorySlug();
    expect(currentSlug).not.toBe(previousSlug);
    expect(currentSlug.length).toBeGreaterThan(0);
  }

  /**
   * Wait for products to load (not empty state)
   * Useful when navigating between categories
   */
  async waitForProductsToLoad() {
    // Wait for at least one product card or result count to update
    await this.page.waitForFunction(() => {
      const resultText = document.querySelector('h6.text-center')?.textContent || '';
      return resultText.includes('result found');
    }, { timeout: 10000 });
  }
}

