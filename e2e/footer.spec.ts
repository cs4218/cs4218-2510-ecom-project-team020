import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./utils/utils";

const FOOTER_SNAPSHOT = `
- contentinfo:
  - heading "All Rights Reserved © TestingComp" [level=4]
  - paragraph:
    - link "About"
    - text: "|"
    - link "Contact"
    - text: "|"
    - link "Privacy Policy"
`;

async function assertFooterVisible(page) {
  await expect(page.getByRole("contentinfo")).toMatchAriaSnapshot(FOOTER_SNAPSHOT);
}

async function navigateFooterLinks(page) {
  await test.step("Navigate to About page", async () => {
    await page.getByRole("link", { name: "About" }).click();
    await expect(page.getByRole("heading", { name: /About/i })).toBeVisible();
    await assertFooterVisible(page);
  });

  await test.step("Navigate to Contact page", async () => {
    await page.getByRole("link", { name: "Contact" }).click();
    await expect(page.getByRole("heading", { name: /Contact/i })).toBeVisible();
    await assertFooterVisible(page);
  });

  await test.step("Navigate to Privacy Policy page", async () => {
    await page.getByRole("link", { name: "Privacy Policy" }).click();
    await expect(page.getByRole("main")).toContainText(/your privacy is important/i);
    await assertFooterVisible(page);
  });
}

test.describe("Footer Navigation", () => {
  test("logged out user can navigate About → Contact → Privacy Policy", async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await assertFooterVisible(page);
    await navigateFooterLinks(page);
  });

  test("logged in user can navigate About → Contact → Privacy Policy", async ({ page }) => {
    const email = `footeruser+${Date.now()}@test.com`;
    await registerAndLogin(page, { email });

    await page.goto("/");
    await assertFooterVisible(page);
    await navigateFooterLinks(page);
  });

  test("should respect browser back button", async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await assertFooterVisible(page);

    await test.step("Navigate sequentially", async () => {
      await page.getByRole("link", { name: "About" }).click();
      await page.getByRole("link", { name: "Contact" }).click();
      await page.getByRole("link", { name: "Privacy Policy" }).click();
    });

    await expect(page.getByRole("main")).toContainText(/privacy/i);

    await page.goBack();
    await expect(page.getByRole("heading", { name: /Contact/i })).toBeVisible();

    await page.goBack();
    await expect(page.getByRole("heading", { name: /About/i })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL("/");
  });
});
