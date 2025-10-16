import { Page, expect } from "@playwright/test";

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.page.getByPlaceholder("Enter Your Email").fill(email);
    await this.page.getByPlaceholder("Enter Your Password").fill(password);
    await this.page.getByRole("button", { name: "LOGIN" }).click();
  }

  async expectSuccessToast() {
    await expect(this.page.getByText("🙏Login Successful")).toBeVisible({
      timeout: 5000,
    });
  }

  async expectErrorToast(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }
}
