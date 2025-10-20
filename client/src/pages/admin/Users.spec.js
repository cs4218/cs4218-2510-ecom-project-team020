// client/src/pages/admin/Users.spec.js
import { test, expect } from "@playwright/test";

const BASE = process.env.APP_URL || "http://localhost:3000";
const USERS_API = "**/api/v1/auth/all-users";
const ADMIN_AUTH_API = "**/api/v1/auth/admin-auth";
const CATEGORY_API = "**/api/v1/category/get-category";

// Make getByTestId('x') map to [data-test="x"]
test.use({ testIdAttribute: "data-test" });

// --- helpers ---------------------------------------------------------------
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
  // Admin route guard ping
  await page.route(ADMIN_AUTH_API, r => r.fulfill({ json: { ok: true } }));
  // Layout/menu might fetch categories; safe to stub empty
  await page.route(CATEGORY_API, r => r.fulfill({ json: { success: true, category: [] } }));
  // Let other requests pass through unless overridden in each test
}

// --- fixtures --------------------------------------------------------------
const demoUsers = [
  { _id: "u1", name: "Daniel", email: "Daniel@gmail.com" },
  { _id: "u2", name: "Test 3", email: "hello@test.com" },
  { _id: "u3", name: "Very Long Name That Should Truncate Nicely", email: "reallylongemailaddress_for_testing_purposes@example.com" },
];

const truncate = (text, len) => (text.length > len ? text.slice(0, len) + "..." : text);


// --- tests -----------------------------------------------------------------
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

    // keep the tooltip check as-is
    await expect(longRow).toHaveAttribute(
    "title",
    /Very Long Name That Should Truncate Nicely — reallylongemailaddress_for_testing_purposes@example\.com/
    );

  });

  test("shows toast + empty state on network error", async ({ page }) => {
    await page.route(USERS_API, r => r.abort()); // simulate failure

    await page.goto(`${BASE}/dashboard/admin/users`, { waitUntil: "domcontentloaded" });
    // give React a tick to set users = []
    await page.waitForTimeout(50);

    await expect(page.getByTestId("users-empty")).toHaveText("No users found.");
    // If your toast renders into a portal, generic text match is usually fine:
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
