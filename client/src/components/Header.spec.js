import { test, expect } from "@playwright/test";

const BASE = process.env.APP_URL || "http://localhost:3000";
const CATEGORY_API   = "**/api/v1/category/get-category";
const USER_AUTH_API  = "**/api/v1/auth/user-auth";
const ADMIN_AUTH_API = "**/api/v1/auth/admin-auth";

test.setTimeout(60_000);

const demoCategories = [
  { _id: "c1", name: "Climbing", slug: "climbing" },
  { _id: "c2", name: "Ropes", slug: "ropes" },
];

async function stubHeaderApis(page, { categories = demoCategories } = {}) {
  await page.route(CATEGORY_API, r => r.fulfill({ json: { success: true, categories } }));
  await page.route(USER_AUTH_API,  r => r.fulfill({ json: { ok: true } }));
  await page.route(ADMIN_AUTH_API, r => r.fulfill({ json: { ok: true } }));
}

async function bootstrapAuth(page, { role = 0, name = "Test User" } = {}) {
  await page.addInitScript(({ role, name }) => {
    const auth = { token: "pw-token", user: { _id: "u1", name, email: "u@test.dev", role } };
    localStorage.setItem("auth", JSON.stringify(auth));
    sessionStorage.setItem("auth", JSON.stringify(auth));
  }, { role, name });
}

async function bootstrapCart(page, count = 0) {
  await page.addInitScript(count => {
    const items = Array.from({ length: count }, (_, i) => ({ id: `p${i}`, qty: 1 }));
    localStorage.setItem("cart", JSON.stringify(items));
  }, count);
}

async function gotoHeader(page, path = "/") {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForResponse(r => r.url().includes("/api/v1/category/get-category"));
  await expect(page.getByRole("link", { name: "🛒 Virtual Vault" })).toBeVisible();
}

async function waitForCategoriesRendered(page, expectedAtLeast = 2) {
  await page.waitForFunction((n) => {
    const menu = document.querySelector('.nav-item.dropdown .dropdown-menu');
    return !!menu && menu.querySelectorAll('.dropdown-item').length >= n;
  }, expectedAtLeast, { timeout: 10_000 });
}

async function openCategoriesDropdown(page) {
  await page.evaluate(() => {
    const root = document.querySelector('.nav-item.dropdown');
    if (!root) return;
    const toggle = root.querySelector('.nav-link.dropdown-toggle');
    const menu   = root.querySelector('.dropdown-menu');
    if (toggle && menu) {
      toggle.classList.add('show');
      menu.classList.add('show');
      menu.style.display = 'block';
    }
  });
}

async function forceOpenUserDropdown(page) {
  await page.evaluate(() => {
    const dropdowns = document.querySelectorAll('.nav-item.dropdown');
    const userDd = dropdowns[1]; // categories is [0], user menu is [1]
    if (!userDd) return;
    const toggle = userDd.querySelector('.nav-link.dropdown-toggle');
    const menu   = userDd.querySelector('.dropdown-menu');
    if (toggle && menu) {
      toggle.classList.add('show');
      menu.classList.add('show');
      menu.style.display = 'block';
    }
  });
}

test.describe("Header (UI)", () => {
  test("logged OUT: brand, Home, Categories list, Register/Login, Cart(0)", async ({ page }) => {
    await stubHeaderApis(page);
    await bootstrapCart(page, 0);
    await gotoHeader(page, "/");

    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();

    await waitForCategoriesRendered(page, 2);
    await openCategoriesDropdown(page);

    await expect(page.getByRole("link", { name: "All Categories", includeHidden: true }))
      .toHaveAttribute("href", "/categories");
    await expect(page.getByRole("link", { name: "Climbing", includeHidden: true }))
      .toHaveAttribute("href", "/category/climbing");
    await expect(page.getByRole("link", { name: "Ropes", includeHidden: true }))
      .toHaveAttribute("href", "/category/ropes");

    await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();

    const cartLink = page.getByRole("link", { name: /Cart/i });
    await expect(cartLink).toBeVisible();
    await expect(cartLink.locator("..").locator(".ant-badge-count")).toHaveText("0");
  });

  test("logged IN (role=0): user dropdown, Dashboard→/dashboard/user, Cart(2), Logout works", async ({ page }) => {
    await stubHeaderApis(page);
    await bootstrapAuth(page, { role: 0, name: "Alicia" });
    await bootstrapCart(page, 2);
    await gotoHeader(page, "/");

    await page.waitForSelector('.nav-item.dropdown .nav-link.dropdown-toggle', { timeout: 10000 });

    await forceOpenUserDropdown(page);

    await expect(page.locator('a.dropdown-item[href="/dashboard/user"]')).toBeVisible();

    const cartLink = page.getByRole("link", { name: /Cart/i });
    await expect(cartLink.locator("..").locator(".ant-badge-count")).toHaveText("2");

    // Logout
    await page.locator('a.dropdown-item[href="/login"]').click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator("text=Logout Successfully")).toBeVisible();
  });

  test("logged IN (role=1): Dashboard→/dashboard/admin", async ({ page }) => {
    await stubHeaderApis(page);
    await bootstrapAuth(page, { role: 1, name: "Admin" });
    await gotoHeader(page, "/");

    await page.waitForSelector('.nav-item.dropdown .nav-link.dropdown-toggle', { timeout: 10000 });

    await forceOpenUserDropdown(page);

    await expect(page.locator('a.dropdown-item[href="/dashboard/admin"]')).toBeVisible();
  });

  test("Categories are present on inner routes too", async ({ page }) => {
    await stubHeaderApis(page);
    await gotoHeader(page, "/cart");

    await waitForCategoriesRendered(page, 2);
    await openCategoriesDropdown(page);

    await expect(page.getByRole("link", { name: "Climbing", includeHidden: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ropes", includeHidden: true })).toBeVisible();
  });
});
