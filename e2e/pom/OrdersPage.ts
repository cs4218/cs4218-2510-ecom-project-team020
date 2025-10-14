import { Page, expect } from "@playwright/test";

export class OrdersPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/dashboard/user/orders");
  }

  async manualNavigationToOrders() {
    await this.page.getByRole('button', { name: 'John' }).click();
    await this.page.getByRole('link', { name: 'Dashboard' }).click();
    await this.page.getByRole('link', { name: 'Orders' }).click();
  }

  async expectNoOrders() {
    await expect(this.page.getByText("All Orders")).toBeVisible();
    await expect(this.page.locator("table")).toHaveCount(0);
  }

  async expectOrdersPopulated() {
    await expect(this.page.locator("table")).toHaveCount(1);
  }
}
