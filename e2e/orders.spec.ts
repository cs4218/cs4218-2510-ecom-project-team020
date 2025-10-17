import { test, expect, Page } from "@playwright/test";
import { OrdersPage } from "./pom/OrdersPage";
import { registerAndLogin } from "./utils/utils";

export async function makePaymentForProduct(page: Page, productName: string) {
  const productCard = page
    .locator(".card.m-2")
    .filter({ has: page.getByRole("heading", { name: productName }) })
    .first();

  await productCard.getByRole("button", { name: "ADD TO CART" }).click();

  await page.getByRole("link", { name: "Cart" }).click();
  await expect(page.getByRole("heading", { name: /Cart Summary/i })).toBeVisible();

  await page.getByRole("button", { name: "Paying with Card" }).click();

  await page
    .frameLocator('iframe[name="braintree-hosted-field-number"]')
    .getByRole("textbox", { name: "Credit Card Number" })
    .fill("4111 1111 1111 1111");

  await page
    .frameLocator('iframe[name="braintree-hosted-field-expirationDate"]')
    .getByRole("textbox", { name: "Expiration Date" })
    .fill("09/29");

  await page
    .frameLocator('iframe[name="braintree-hosted-field-cvv"]')
    .getByRole("textbox", { name: "CVV" })
    .fill("123");

  await page.getByRole("button", { name: "Make Payment" }).click();
}

test.describe('Order Management', () => {
  test("should correctly show table and product", async ({ page }) => {
    const email = `johnnie+${Date.now()}@test.com`;
    await registerAndLogin(page, { email });

    await makePaymentForProduct(page, "Novel");

    const ordersContainer = page.locator(".border.shadow");
    await expect(ordersContainer).toHaveCount(1);
    const firstOrder = ordersContainer.first();
    const expectedHeaders = ["#", "Status", "Buyer", "Date", "Payment", "Quantity"];
    for (const header of expectedHeaders) {
      await expect(firstOrder.getByRole("columnheader", { name: header })).toBeVisible();
    }

    const rows = firstOrder.locator("tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    const expectedOrderMetadata = ["Not Processed", "John", "Success"]
    for (const metadata of expectedOrderMetadata) {
      await expect(firstOrder.getByRole("cell", { name: metadata })).toBeVisible();
    }

    await expect(firstOrder.getByText(/^Name:\s*Novel$/)).toBeVisible();
    await expect(firstOrder.getByText(/^Description:\s*A bestselling novel$/)).toBeVisible();
    await expect(firstOrder.getByText(/^Price:\s*\$14\.99$/)).toBeVisible();
    await expect(firstOrder.locator("img")).toBeVisible();
  });

  test("should navigate to Orders page from Dashboard and Profile", async ({ page }) => {
    const email = `johnnie+${Date.now()}@test.com`;
    await registerAndLogin(page, { email });

    await page.getByRole('button', { name: 'John' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();

    await page.getByRole("link", { name: "Profile" }).click();
    await expect(page.getByRole("heading", { name: /User Profile/i })).toBeVisible();

    await page.getByRole("link", { name: "Orders" }).click();
    await expect(page.getByRole("heading", { name: "All Orders" })).toBeVisible();
  });

  test("should display empty orders page for new user", async ({ page }) => {
    const email = `johnnie+${Date.now()}@test.com`;
    await registerAndLogin(page, { email });

    const orders = new OrdersPage(page);
    await orders.manualNavigationToOrders();
    await orders.expectNoOrders();
  });

  test("should show order when a user makes a purchase", async ({ page }) => {
    const email = `johnnie+${Date.now()}@test.com`;
    await registerAndLogin(page, { email });

    await makePaymentForProduct(page, "Novel");
    // assert order details are correct
    await expect(page.getByRole('heading', { name: 'All Orders' })).toBeVisible();
    const ordersContainer = page.locator('.border.shadow');
    await expect(ordersContainer).toHaveCount(1);
    const firstOrder = ordersContainer.first();

    await expect(firstOrder.getByText(/^Name:\s*Novel$/)).toBeVisible();
    await expect(firstOrder.getByText(/^Description:\s*A bestselling novel$/)).toBeVisible();
    await expect(firstOrder.getByText(/^Price:\s*\$14\.99$/)).toBeVisible();
  });

  test("should gracefully handle error in retrievng orders", async ({ page }) => {
    const email = `johnnie+${Date.now()}@test.com`;
    await registerAndLogin(page, { email });

    await makePaymentForProduct(page, "Novel");

    await page.goto("/");
    await page.route("http://localhost:6060/api/v1/auth/orders", (route) =>
      route.fulfill({
        status: 500,
        body: JSON.stringify({
          success: false,
          message: "Internal Server Error",
        }),
      })
    );

    const orders = new OrdersPage(page);
    await orders.goto()
    await orders.expectNoOrders();
  });

  test("should redirect unauthenticated user trying to access orders url to home page", async ({ page }) => {
    const orders = new OrdersPage(page);

    await orders.goto();
    // redirect page should be rendered
    for (const second of [3, 2, 1]) {
      await expect(
        page.getByRole("heading", { name: new RegExp(`redirecting to you in ${second}`, "i") })
      ).toBeVisible();
    }
    await expect(page).toHaveURL("http://localhost:3000");
  });
})
