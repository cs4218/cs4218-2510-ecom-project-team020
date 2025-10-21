import { test, expect } from "@playwright/test";

/**
 * E2E Tests for Policy Page Navigation
 *
 * Tests cover:
 * - Policy page display and content
 * - Navigation to/from policy page
 * - Footer navigation
 * - Browser back/forward navigation
 * - Policy page accessibility
 *
 * Components tested:
 * - Frontend: Policy.js
 * - Navigation: Footer.js, Layout.js
 * - Routing: App.js
 */

test.describe("Policy Page Navigation", () => {
  /**
   * TC1: Policy Page Content Display
   *
   * Tests that policy page is accessible:
   * 1. Page loads with correct title
   * 2. Privacy policy content is visible
   * 3. Contact image is displayed
   * 4. Footer is present
   */
  test("should display policy page content correctly", async ({ page }) => {
    await page.goto("/policy");

    await expect(
      page.getByRole("heading", { name: "Privacy Policy" })
    ).toBeVisible();
    await expect(page.getByAltText("contactus")).toBeVisible();

    await expect(page.getByRole("link", { name: "About" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Contact" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Privacy Policy" })
    ).toBeVisible();

    await expect(
      page.getByText(/your privacy is important to us/i)
    ).toBeVisible();
    await expect(
      page.getByText(/by continuing to browse or use our services/i)
    ).toBeVisible();

    console.log("✅ Policy page accessibility verified");
  });

  /**
   * TC2: Footer Navigation to Policy Page
   *
   * Tests navigation from footer to policy page from different pages:
   * 1. User clicks "Privacy Policy" in footer from homepage
   * 2. User clicks "Privacy Policy" in footer from about page
   * 3. User clicks "Privacy Policy" in footer from contact page
   * 4. Policy content is displayed each time
   */
  test("should be able to navigate to policy page from footer from any page", async ({
    page,
  }) => {
    // Test from homepage
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "All Products" })
    ).toBeVisible();
    await page.getByRole("link", { name: "Privacy Policy" }).click();
    await expect(page).toHaveURL("/policy");
    await expect(
      page.getByRole("heading", { name: "Privacy Policy" })
    ).toBeVisible();
    console.log("✅ Navigated to policy page from homepage footer");

    // Test from about page
    await page.getByRole("link", { name: "About" }).click();
    await expect(page.getByRole("heading", { name: /About/i })).toBeVisible();
    await page.getByRole("link", { name: "Privacy Policy" }).click();
    await expect(page).toHaveURL("/policy");
    await expect(
      page.getByRole("heading", { name: "Privacy Policy" })
    ).toBeVisible();

    // Test from contact page
    await page.getByRole("link", { name: "Contact" }).click();
    await expect(page.getByRole("heading", { name: /Contact/i })).toBeVisible();
    await page.getByRole("link", { name: "Privacy Policy" }).click();
    await expect(page).toHaveURL("/policy");
    await expect(
      page.getByRole("heading", { name: "Privacy Policy" })
    ).toBeVisible();

    // Test from cart page
    await page.getByRole("link", { name: "Cart" }).click();
    await expect(
      page.getByRole("heading", { name: "Cart Summary" })
    ).toBeVisible();
    await page.getByRole("link", { name: "Privacy Policy" }).click();
    await expect(page).toHaveURL("/policy");
    await expect(
      page.getByRole("heading", { name: "Privacy Policy" })
    ).toBeVisible();
  });

  /**
   * TC3: Navigation from Policy to Other Pages
   *
   * Tests navigation from policy page to other pages:
   * 1. User is on policy page
   * 2. Navigates to About page
   * 3. Navigates to Contact page
   * 4. Returns to homepage
   */
  test("should navigate from policy page to other pages", async ({ page }) => {
    await page.goto("/policy");
    await expect(
      page.getByRole("heading", { name: "Privacy Policy" })
    ).toBeVisible();

    await page.getByRole("link", { name: "About" }).click();
    await expect(page.getByRole("heading", { name: /About/i })).toBeVisible();

    await page.getByRole("link", { name: "Contact" }).click();
    await expect(page.getByRole("heading", { name: /Contact/i })).toBeVisible();

    await page.getByRole("link", { name: "Home" }).click();
    await expect(
      page.getByRole("heading", { name: "All Products" })
    ).toBeVisible();
  });

  /**
   * TC4: Browser Back/Forward Navigation
   *
   * Tests browser navigation with policy page:
   * 1. Navigate to policy page
   * 2. Use browser back button
   * 3. Use browser forward button
   * 4. Verify correct page content
   */
  test("should handle browser back/forward navigation", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "All Products" })
    ).toBeVisible();

    await page.getByRole("link", { name: "Privacy Policy" }).click();
    await expect(
      page.getByRole("heading", { name: "Privacy Policy" })
    ).toBeVisible();

    await page.goBack();
    await expect(
      page.getByRole("heading", { name: "All Products" })
    ).toBeVisible();

    await page.goForward();
    await expect(
      page.getByRole("heading", { name: "Privacy Policy" })
    ).toBeVisible();
  });

  /**
   * TC5: Direct URL Navigation to Policy
   *
   * Tests navigating directly to policy page via URL:
   * 1. User enters policy URL directly
   * 2. Page loads correctly
   * 3. All content is displayed
   */
  test("should handle direct URL navigation to policy page", async ({
    page,
  }) => {
    await page.goto("/policy");

    await expect(
      page.getByRole("heading", { name: "Privacy Policy" })
    ).toBeVisible();
    await expect(
      page.getByText(/your privacy is important to us/i)
    ).toBeVisible();
    await expect(
      page.getByText(/by continuing to browse or use our services/i)
    ).toBeVisible();
    await expect(page.getByAltText("contactus")).toBeVisible();

  });
});
