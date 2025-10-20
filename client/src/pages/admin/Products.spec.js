// client/src/pages/admin/Products.spec.js
// at the top of client/src/pages/admin/Products.spec.js
import { test, expect } from "@playwright/test";

// Make getByTestId('x') map to [data-test="x"]
test.use({ testIdAttribute: "data-test" });

const BASE = process.env.APP_URL || "http://localhost:3000";
const PRODUCTS_API = "**/api/v1/product/get-product";

async function bootstrapAdminAuth(page) {
  await page.addInitScript(() => {
    const auth = {
      token: "playwright-test-token",
      user: { _id: "admin1", name: "Test Admin", email: "admin@test.dev", role: 1 },
    };
    localStorage.setItem("auth", JSON.stringify(auth));
    sessionStorage.setItem("auth", JSON.stringify(auth));
  });
}

async function stubShellApis(page) {
  await page.route("**/api/v1/auth/*", r => r.fulfill({ json: { ok: true } }));
  await page.route("**/api/v1/category/get-category", r =>
    r.fulfill({ json: { success: true, category: [] } })
  );
  // let everything else pass through unless explicitly stubbed
}

const demoProducts = [
  { _id: "p1", name: "Alpine Harness", slug: "alpine-harness", description: "Lightweight, all-around alpine harness." },
  { _id: "p2", name: "Cobra II Half Rope", slug: "beal-cobra-ii", description: "8.6mm half rope built for long routes." },
];

test.describe("Admin Products page", () => {
  test.beforeEach(async ({ page }) => {
    await bootstrapAdminAuth(page);
    await stubShellApis(page);
  });

  test("shows heading, empty state when API returns empty list", async ({ page }) => {
    await page.route(PRODUCTS_API, r => r.fulfill({ json: { products: [] } }));

    await page.goto(`${BASE}/dashboard/admin/products`, { waitUntil: "domcontentloaded" });
    await page.waitForResponse(resp => resp.url().includes("/api/v1/product/get-product"));

    await expect(page.getByTestId("products-heading")).toHaveText("All Products List");
    await expect(page.getByTestId("products-empty")).toHaveText("No products found.");
    await expect(page.getByTestId("products-grid").locator('[data-test="product-card"]')).toHaveCount(0);
  });

  test("renders product cards from API payload", async ({ page }) => {
    await page.route(PRODUCTS_API, r => r.fulfill({ json: { products: demoProducts } }));

    await page.goto(`${BASE}/dashboard/admin/products`, { waitUntil: "domcontentloaded" });
    await page.waitForResponse(resp => resp.url().includes("/api/v1/product/get-product"));

    await expect(page.getByTestId("products-page")).toBeVisible();

    const cards = page.getByTestId("products-grid").locator('[data-test="product-card"]');
    await expect(cards).toHaveCount(2);

    const first = cards.nth(0);
    await expect(first).toHaveAttribute("data-product-id", "p1");
    await expect(first.getByTestId("product-name")).toHaveText("Alpine Harness");
    await expect(first.getByTestId("product-description")).toContainText("Lightweight");
    await expect(first.locator("img")).toHaveAttribute("src", "/api/v1/product/product-photo/p1");

    const second = cards.nth(1);
    await expect(second).toHaveAttribute("data-product-id", "p2");
    await expect(second.getByTestId("product-name")).toHaveText("Cobra II Half Rope");
    await expect(second.getByTestId("product-description")).toContainText("8.6mm");
    await expect(second.locator("img")).toHaveAttribute("src", "/api/v1/product/product-photo/p2");
  });

  test("links go to the product admin detail route using slug", async ({ page }) => {
    await page.route(PRODUCTS_API, r => r.fulfill({ json: { products: demoProducts } }));
    await page.goto(`${BASE}/dashboard/admin/products`, { waitUntil: "domcontentloaded" });
    await page.waitForResponse(r => r.url().includes("/api/v1/product/get-product"));

    const links = page.locator('[data-test="product-link"]');
    await expect(links).toHaveCount(2);
    await expect(links.nth(0)).toHaveAttribute("href", "/dashboard/admin/product/alpine-harness");
    await expect(links.nth(1)).toHaveAttribute("href", "/dashboard/admin/product/beal-cobra-ii");
  });

  test("handles network error gracefully: shows toast + empty state", async ({ page }) => {
    await page.route(PRODUCTS_API, r => r.abort());

    await page.goto(`${BASE}/dashboard/admin/products`, { waitUntil: "domcontentloaded" });
    // give React a tick to set products = []
    await page.waitForTimeout(50);

    await expect(page.getByTestId("products-empty")).toHaveText("No products found.");
    await expect(page.locator("text=Failed to fetch products")).toBeVisible();
  });

  test("tolerates malformed payloads by coercing to empty array", async ({ page }) => {
    await page.route(PRODUCTS_API, r => r.fulfill({ json: { products: null } }));

    await page.goto(`${BASE}/dashboard/admin/products`, { waitUntil: "domcontentloaded" });
    await page.waitForResponse(r => r.url().includes("/api/v1/product/get-product"));

    await expect(page.getByTestId("products-empty")).toHaveText("No products found.");
    await expect(page.getByTestId("products-grid").locator('[data-test="product-card"]')).toHaveCount(0);
  });

  test("uses index as key fallback when _id is missing (still renders stable DOM)", async ({ page }) => {
    const withoutIds = [
      { name: "NoID One", slug: "noid-one", description: "First item without id" },
      { name: "NoID Two", slug: "noid-two", description: "Second item without id" },
    ];
    await page.route(PRODUCTS_API, r => r.fulfill({ json: { products: withoutIds } }));

    await page.goto(`${BASE}/dashboard/admin/products`, { waitUntil: "domcontentloaded" });
    await page.waitForResponse(r => r.url().includes("/api/v1/product/get-product"));

    const cards = page.getByTestId("products-grid").locator('[data-test="product-card"]');
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0).getByTestId("product-name")).toHaveText("NoID One");
    await expect(cards.nth(1).getByTestId("product-name")).toHaveText("NoID Two");
  });
});
