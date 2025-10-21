import { test, expect } from "@playwright/test";

const BASE = process.env.APP_URL || "http://localhost:3000";
const USERS_API = "**/api/v1/auth/all-users";
const ADMIN_AUTH_API = "**/api/v1/auth/admin-auth";
const CATEGORY_API = "**/api/v1/category/get-category";

test.use({ testIdAttribute: "data-test" });

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
  await page.route(ADMIN_AUTH_API, r => r.fulfill({ json: { ok: true } }));
  await page.route(CATEGORY_API, r => r.fulfill({ json: { success: true, category: [] } }));
}

const demoUsers = [
  { _id: "u1", name: "Daniel", email: "Daniel@gmail.com" },
  { _id: "u2", name: "Test 3", email: "hello@test.com" },
  { _id: "u3", name: "Very Long Name That Should Truncate Nicely", email: "reallylongemailaddress_for_testing_purposes@example.com" },
];

const truncate = (text, len) => (text.length > len ? text.slice(0, len) + "..." : text);


test.describe("Admin Users page", () => {
  test.beforeEach(async ({ page }) => {
    await bootstrapAdminAuth(page);
    await stubShellApis(page);
  });

  test("renders heading and empty state when API returns empty list", async ({ page }) => {
    await page.route(USERS_API, r => r.fulfill({ json: { success: true, users: [] } }));

    await page.goto(`${BASE}/dashboard/admin/users`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("users-heading")).toHaveText("All Users");
    await expect(page.getByTestId("users-empty")).toHaveText("No users found.");
    await expect(page.getByTestId("users-list").locator("li")).toHaveCount(0);
  });

  test("renders users from API payload (including truncation)", async ({ page }) => {
    
    await page.route(USERS_API, r => r.fulfill({ json: { success: true, users: demoUsers } }));

    await page.goto(`${BASE}/dashboard/admin/users`, { waitUntil: "domcontentloaded" });

    const rows = page.getByTestId("users-list").locator("li");
    await expect(rows).toHaveCount(3);

    const longRow = rows.nth(2);
    const expectedName = truncate("Very Long Name That Should Truncate Nicely", 25);
    const expectedEmail = truncate("reallylongemailaddress_for_testing_purposes@example.com", 40);

    await expect(longRow).toContainText(expectedName);
    await expect(longRow).toContainText(expectedEmail);

    await expect(longRow).toHaveAttribute(
    "title",
    /Very Long Name That Should Truncate Nicely — reallylongemailaddress_for_testing_purposes@example\.com/
    );

  });

  test("shows toast + empty state on network error", async ({ page }) => {
    await page.route(USERS_API, r => r.abort());

    await page.goto(`${BASE}/dashboard/admin/users`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(50);

    await expect(page.getByTestId("users-empty")).toHaveText("No users found.");
    await expect(page.locator("text=Failed to fetch users")).toBeVisible();
  });

  test("coerces malformed payloads (users: null) to empty state", async ({ page }) => {
    await page.route(USERS_API, r => r.fulfill({ json: { success: true, users: null } }));

    await page.goto(`${BASE}/dashboard/admin/users`, { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("users-empty")).toHaveText("No users found.");
    await expect(page.getByTestId("users-list").locator("li")).toHaveCount(0);
  });

  test("uses index as key fallback when _id is missing (still renders stable DOM)", async ({ page }) => {
    const withoutIds = [
      { name: "NoID One", email: "one@example.com" },
      { name: "NoID Two", email: "two@example.com" },
    ];
    await page.route(USERS_API, r => r.fulfill({ json: { success: true, users: withoutIds } }));

    await page.goto(`${BASE}/dashboard/admin/users`, { waitUntil: "domcontentloaded" });

    const rows = page.getByTestId("users-list").locator("li");
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText("NoID One — one@example.com");
    await expect(rows.nth(1)).toContainText("NoID Two — two@example.com");
  });
});
