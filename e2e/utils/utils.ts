import { Page } from "@playwright/test";
import { RegisterPage } from "../pom/RegisterPage";
import { LoginPage } from "../pom/LoginPage";

export async function registerAndLogin(page: Page, { email }) {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.register({
        name: "John",
        email: email,
        password: "Password123!",
        phone: "98765432",
        address: "123 Street",
        dob: "2000-01-01",
        answer: "Soccer",
    });
    await registerPage.expectSuccessToast();

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(email, "Password123!");
    await loginPage.expectSuccessToast();
}