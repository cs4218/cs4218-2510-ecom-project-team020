import { test, expect } from "@playwright/test";

const BASE = process.env.APP_URL || "http://localhost:3000";

const USER_AUTH_API   = "**/api/v1/auth/user-auth";
const CATEGORY_API    = "**/api/v1/category/get-category";

async function bootstrapSignedInUser(page) {
  await page.addInitScript(() => {
    const auth = {
      token: "playwright-test-user-token",
      user: { _id: "user1", name: "Test User", email: "user@test.dev", role: 0 },
    };
    localStorage.setItem("auth", JSON.stringify(auth));
    sessionStorage.setItem("auth", JSON.stringify(auth));
  });
}

async function stubShellApis(page) {
  await page.route(USER_AUTH_API, r => r.fulfill({ json: { ok: true } }));
  await page.route(CATEGORY_API, r => r.fulfill({ json: { success: true, category: [] } }));
}

test.describe("UserMenu (user dashboard sidebar)", () => {
  test.beforeEach(async ({ page }) => {
    await bootstrapSignedInUser(page);
    await stubShellApis(page);
  });

  test("renders links with correct hrefs", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/user/profile`, { waitUntil: "domcontentloaded" });

    const profileLink = page.getByRole("link", { name: "Profile" });
    const ordersLink  = page.getByRole("link", { name: "Orders" });

    await expect(profileLink).toHaveAttribute("href", "/dashboard/user/profile");
    await expect(ordersLink).toHaveAttribute("href", "/dashboard/user/orders");
  });

  test("highlights Profile as active on /dashboard/user/profile", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/user/profile`, { waitUntil: "domcontentloaded" });

    const profileLink = page.getByRole("link", { name: "Profile" });
    const ordersLink  = page.getByRole("link", { name: "Orders" });

    await expect(profileLink).toHaveAttribute("aria-current", "page");
    await expect(ordersLink).not.toHaveAttribute("aria-current", "page");
  });

  test("highlights Orders as active on /dashboard/user/orders", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/user/orders`, { waitUntil: "domcontentloaded" });

    const profileLink = page.getByRole("link", { name: "Profile" });
    const ordersLink  = page.getByRole("link", { name: "Orders" });

    await expect(ordersLink).toHaveAttribute("aria-current", "page");
    await expect(profileLink).not.toHaveAttribute("aria-current", "page");
  });

  test("navigates between Profile and Orders via clicks", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/user/profile`, { waitUntil: "domcontentloaded" });

    await page.getByRole("link", { name: "Orders" }).click();
    await expect(page).toHaveURL(/\/dashboard\/user\/orders/);
    await expect(page.getByRole("link", { name: "Orders" })).toHaveAttribute("aria-current", "page");

    await page.getByRole("link", { name: "Profile" }).click();
    await expect(page).toHaveURL(/\/dashboard\/user\/profile/);
    await expect(page.getByRole("link", { name: "Profile" })).toHaveAttribute("aria-current", "page");
  });
});
