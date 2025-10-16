import { test, expect } from '@playwright/test';
import { RegisterPage } from './pom/RegisterPage';
import { LoginPage } from './pom/LoginPage';

test.describe('Register Form Management', () => {
    test('should validate registration form fields', async ({ page }) => {
        const registerPage = new RegisterPage(page);
        await registerPage.goto();

        // Try to submit empty form
        await page.getByRole('button', { name: 'REGISTER' }).click();

        await expect(page.getByText('Name is required')).toBeVisible();
        await expect(page.getByText('Email is required')).toBeVisible();
        await expect(page.getByText('Password is required')).toBeVisible();
        await expect(page.getByText('Phone number is required')).toBeVisible();
        await expect(page.getByText('Address is required')).toBeVisible();
        await expect(page.getByText('Date of Birth is required')).toBeVisible();
        await expect(page.getByText('Security answer is required')).toBeVisible();
    });

    test('should validate password strength', async ({ page }) => {
        const registerPage = new RegisterPage(page);
        await registerPage.goto();
        await registerPage.register({
            name: "John",
            email: "test@test.com",
            password: "123456",
            phone: "98765432",
            address: "123 Street",
            dob: "2000-01-01",
            answer: "Soccer",
        });

        await expect(page.getByText("Password must be at least 8 characters, include 1 uppercase and 1 special character")).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
        const registerPage = new RegisterPage(page);
        await registerPage.goto();
        await registerPage.register({
            name: "John",
            email: "test",
            password: "Password123!",
            phone: "98765432",
            address: "123 Street",
            dob: "2000-01-01",
            answer: "Soccer",
        });

        await expect(page.getByText("Invalid email format")).toBeVisible();
    });

    test('should validate phone number', async ({ page }) => {
        const registerPage = new RegisterPage(page);
        await registerPage.goto();
        await registerPage.register({
            name: "John",
            email: "test",
            password: "Password123!",
            phone: "98762",
            address: "123 Street",
            dob: "2000-01-01",
            answer: "Soccer",
        });

        await expect(page.getByText("Phone number must be 8–15 digits only")).toBeVisible();
    });
})

test.describe('Registration Flow Test', () => {
    test('should allow successful registration, login and logout', async ({ page }) => {
        const email = `jonnie+${Date.now()}@test.com`;

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

        await expect(page.getByRole('button', { name: /john/i })).toBeVisible();

        await page.getByRole('button', { name: /john/i }).click();
        await page.getByRole('link', { name: 'Logout' }).click();
        await expect(page.getByText('Logout Successfully')).toBeVisible();
    });

    test('should fail registration - user already exists', async ({ page }) => {
        // Create the user first
        const email = `jonnie+${Date.now()}@test.com`;

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

        // Try to register the user with same email again
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
        await expect(page.getByText('Already Registered Please Login')).toBeVisible();
    });

    test('should fail login - different password', async ({ page }) => {
        const email = `jonnie+${Date.now()}@test.com`;

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
        await loginPage.login(email, "DifferentPassword123!");

        await expect(page.getByText('Invalid Password')).toBeVisible();
    });

    test('should fail login - different email', async ({ page }) => {
        const email = `jonnie+${Date.now()}@test.com`;

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
        await loginPage.login('wrong@test.com', "Password123!");

        await expect(page.getByText('Something went wrong')).toBeVisible();
    });

    test('should fail registration due to API error and cannot login with same details', async ({ page }) => {
        const email = `jonnie+${Date.now()}@test.com`;

        await page.route('**/api/v1/auth/register', route => {
            if (route.request().method() === 'POST') {
                return route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: false, message: 'Internal Server Error' })
                });
            }
            return route.continue();
        });

        const registerPage = new RegisterPage(page);
        await registerPage.goto();
        await registerPage.register({
            name: 'John',
            email,
            password: 'Password123!',
            phone: '98765432',
            address: '123 Street',
            dob: '2000-01-01',
            answer: 'Soccer',
        });

        await expect(page.getByText('Something went wrong')).toBeVisible();

        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(email, 'Password123!');

        await expect(page.getByText('Something went wrong')).toBeVisible();
    });
})
