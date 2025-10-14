import { Page, expect } from "@playwright/test";

export class RegisterPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/register");
  }

  async register({
    name,
    email,
    password,
    phone,
    address,
    dob,
    answer,
  }: {
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    dob: string;
    answer: string;
  }) {
    await this.page.getByPlaceholder("Enter Your Name").fill(name);
    await this.page.getByPlaceholder("Enter Your Email").fill(email);
    await this.page.getByPlaceholder("Enter Your Password").fill(password);
    await this.page.getByPlaceholder("Enter Your Phone").fill(phone);
    await this.page.getByPlaceholder("Enter Your Address").fill(address);
    await this.page.getByPlaceholder("Enter Your DOB").fill(dob);
    await this.page
      .getByPlaceholder("What is Your Favorite sports")
      .fill(answer);
    await this.page.getByRole("button", { name: "REGISTER" }).click();
  }

  async expectSuccessToast() {
    await expect(
      this.page.getByText("Registered Successfully, Please Login")
    ).toBeVisible();
  }

  async expectValidationError(field: string, message: string) {
    await expect(this.page.locator(`.invalid-feedback:has-text("${message}")`))
      .toBeVisible();
  }
}
