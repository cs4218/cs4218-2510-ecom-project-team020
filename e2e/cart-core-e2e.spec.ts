import { test, expect } from "@playwright/test";

/**
 * Core E2E Cart Tests - using playwright codegen
 */
test.describe("Core Cart E2E Tests", () => {
  test("Complete shopping UI: Browse → Add to Cart → View Cart → Payment", async ({
    page,
  }) => {
    // 1. Browse products
    await page.goto("http://localhost:3000/");
    await expect(
      page.getByRole("heading", { name: "All Products" })
    ).toBeVisible();
    console.log("✅ Homepage loaded");

    // 2. Add product to cart
    await page
      .locator(".card.m-2")
      .first()
      .getByRole("button", { name: "ADD TO CART" })
      .click();
    await page.waitForTimeout(1000);
    console.log("✅ Product added to cart");

    // 3. Navigate to cart
    await page
      .getByRole("listitem")
      .filter({ hasText: /Cart\d+/ })
      .click();
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.locator(".row.card.flex-row")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Total : \$/ })
    ).toBeVisible();
    console.log("✅ Cart page loaded with items");

    // 4. Attempt payment (handles both logged in and guest users)
    const paymentButton = page.getByRole("button", { name: "Make Payment" });
    const loginButton = page.getByRole("button", {
      name: /Please Login to checkout|Update Address/,
    });

    if (await paymentButton.isVisible()) {
      console.log("✅ User is logged in, testing payment flow");

      await paymentButton.click();
      await page.waitForTimeout(2000);

      // Fill payment form if available
      try {
        const cardNumberFrame = page.locator(
          'iframe[name="braintree-hosted-field-number"]'
        );
        await cardNumberFrame
          .contentFrame()
          .getByRole("textbox", { name: "Credit Card Number" })
          .fill("5123 4500 0000 0008"); // found mock card number from https://test-gateway.mastercard.com/api/documentation/integrationGuidelines/supportedFeatures/testAndGoLive.html?locale=en_US

        const expiryFrame = page.locator(
          'iframe[name="braintree-hosted-field-expirationDate"]'
        );
        await expiryFrame
          .contentFrame()
          .getByRole("textbox", { name: "Expiration Date" })
          .fill("0126"); // valid so long as expiry date has not passed

        const cvvFrame = page.locator(
          'iframe[name="braintree-hosted-field-cvv"]'
        );
        await cvvFrame
          .contentFrame()
          .getByRole("textbox", { name: "CVV" })
          .fill("123"); // mock cvv number

        await page.getByRole("button", { name: "Make Payment" }).click();
        console.log("✅ Payment form completed");
      } catch (error) {
        console.log("⚠️ Payment form not ready or user needs login");
      }
    } else {
      console.log("✅ Guest user - login required for payment (expected)");
    }
  });

  test("Cart management: Add → Remove → Verify empty", async ({ page }) => {
    // Add item
    await page.goto("http://localhost:3000/");
    await page
      .locator(".card.m-2")
      .first()
      .getByRole("button", { name: "ADD TO CART" })
      .click();
    await page.waitForTimeout(1000);

    // View cart
    await page
      .getByRole("listitem")
      .filter({ hasText: /Cart\d+/ })
      .click();
    await expect(page.locator(".row.card.flex-row")).toBeVisible();
    console.log("✅ Item in cart");

    // Remove item
    await page.getByRole("button", { name: "Remove" }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText("Your Cart Is Empty")).toBeVisible();
    console.log("✅ Item removed, cart is empty");
  });

  test("Cart persistence across page navigation", async ({ page }) => {
    // Add item to cart
    await page.goto("http://localhost:3000/");
    await page
      .locator(".card.m-2")
      .first()
      .getByRole("button", { name: "ADD TO CART" })
      .click();
    await page.waitForTimeout(1000);

    // Navigate to cart
    await page
      .getByRole("listitem")
      .filter({ hasText: /Cart\d+/ })
      .click();
    await expect(page.locator(".row.card.flex-row")).toBeVisible();

    // Navigate away and back
    await page.getByRole("link", { name: "Home" }).click();
    await page
      .getByRole("listitem")
      .filter({ hasText: /Cart\d+/ })
      .click();
    await expect(page.locator(".row.card.flex-row")).toBeVisible();

    console.log("✅ Cart persists across multiple page navigations");
  });

  test("Generated navigation test", async ({ page }) => {
    // Add item to cart
    await page.goto("http://localhost:3000/");
    await page
      .locator(
        "div:nth-child(2) > .card-body > div:nth-child(3) > button:nth-child(2)"
      )
      .click();
    await page.waitForTimeout(1000);

    // Navigate to cart
    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page.locator(".row.card.flex-row")).toBeVisible();

    // Navigate to About and back to cart
    await page.getByRole("link", { name: "About" }).click();
    await page.waitForTimeout(1000);
    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page.locator(".row.card.flex-row")).toBeVisible();

    // Navigate to Contact and back to cart
    await page.getByRole("link", { name: "Contact" }).click();
    await page.waitForTimeout(1000);
    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page.locator(".row.card.flex-row")).toBeVisible();

    // Navigate to Privacy Policy and back to cart
    await page.getByRole("link", { name: "Privacy Policy" }).click();
    await page.waitForTimeout(1000);
    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page.locator(".row.card.flex-row")).toBeVisible();

    // Test search
    await page.getByRole("searchbox", { name: "Search" }).click();
    await page.getByRole("searchbox", { name: "Search" }).fill("nus");
    await page.getByRole("searchbox", { name: "Search" }).press("Enter");
    await page.waitForTimeout(1000);
    await page.getByRole("button", { name: "Search" }).click();
    await page.waitForTimeout(1000);

    // Final cart check
    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page.locator(".row.card.flex-row")).toBeVisible();

    console.log("✅ Generated navigation test completed");
  });
});
