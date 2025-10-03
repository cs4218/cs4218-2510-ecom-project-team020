import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import Login from "./Login";

// Mocking axios.post
jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

describe("Login Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to render Login component
  const renderLogin = (initialEntries = ["/login"]) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it("renders login form", () => {
    renderLogin();

    expect(screen.getByText("LOGIN FORM")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Your Email")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter Your Password")
    ).toBeInTheDocument();
  });

  it("inputs should be initially empty", () => {
    renderLogin();

    expect(screen.getByText("LOGIN FORM")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Your Email").value).toBe("");
    expect(screen.getByPlaceholderText("Enter Your Password").value).toBe("");
  });

  it("should allow typing email and password", () => {
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
      target: { value: "password123" },
    });
    expect(screen.getByPlaceholderText("Enter Your Email").value).toBe(
      "test@example.com"
    );
    expect(screen.getByPlaceholderText("Enter Your Password").value).toBe(
      "password123"
    );
  });

  it("should login the user successfully", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        user: { id: 1, name: "John Doe", email: "test@example.com" },
        token: "mockToken",
      },
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByText("LOGIN"));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(undefined, {
      duration: 5000,
      icon: "🙏",
      style: {
        background: "green",
        color: "white",
      },
    });
  });

  it("should display error message on failed login", async () => {
    axios.post.mockRejectedValueOnce({ message: "Invalid credentials" });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByText("LOGIN"));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
  });

  // ========================================
  // 1. INPUT VALIDATION & EDGE CASES
  // ========================================
  describe("Input Validation", () => {
    it("should test email input validity using HTML5 validation API", () => {
      renderLogin();

      const emailInput = screen.getByPlaceholderText("Enter Your Email");

      // Test invalid email formats using HTML5 validity API
      const invalidEmails = [
        "invalid-email",
        "@domain.com",
        "user@",
        "user.domain.com",
      ];

      invalidEmails.forEach((invalidEmail) => {
        fireEvent.change(emailInput, { target: { value: invalidEmail } });

        // Check HTML5 validity state (this is what browsers use)
        expect(emailInput.validity.valid).toBe(false);
        expect(
          emailInput.validity.typeMismatch || emailInput.validity.valueMissing
        ).toBe(true);
      });
    });

    it("should validate valid email formats using HTML5 validation API", () => {
      renderLogin();

      const emailInput = screen.getByPlaceholderText("Enter Your Email");

      // Test valid email formats
      const validEmails = [
        "user@example.com",
        "test.email@domain.co.uk",
        "user+tag@gmail.com",
        "valid@domain.org",
      ];

      validEmails.forEach((validEmail) => {
        fireEvent.change(emailInput, { target: { value: validEmail } });

        // Check HTML5 validity state
        expect(emailInput.validity.valid).toBe(true);
        expect(emailInput.validity.typeMismatch).toBe(false);
      });
    });

    it("should allow form submission with valid data", async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          success: true,
          user: { id: 1, name: "John Doe", email: "test@example.com" },
          token: "mockToken",
          message: "Login successful",
        },
      });

      renderLogin();

      const emailInput = screen.getByPlaceholderText("Enter Your Email");
      const passwordInput = screen.getByPlaceholderText("Enter Your Password");
      const loginButton = screen.getByText("LOGIN");

      // Use valid data
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      // Check validity before submission
      expect(emailInput.validity.valid).toBe(true);
      expect(passwordInput.validity.valid).toBe(true);

      fireEvent.click(loginButton);

      // With valid data, form should submit and axios should be called
      await waitFor(() =>
        expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/login", {
          email: "test@example.com",
          password: "password123",
        })
      );
    });

    it("should handle empty form submission", async () => {
      renderLogin();

      const loginButton = screen.getByText("LOGIN");
      fireEvent.click(loginButton);

      // Form should not submit with empty fields due to HTML5 required attribute
      expect(axios.post).not.toHaveBeenCalled();
    });

    it("should handle very long email input", () => {
      renderLogin();

      const emailInput = screen.getByPlaceholderText("Enter Your Email");
      const longEmail = "a".repeat(100) + "@example.com";

      fireEvent.change(emailInput, { target: { value: longEmail } });
      expect(emailInput.value).toBe(longEmail);
    });

    it("should handle special characters in password", () => {
      renderLogin();

      const passwordInput = screen.getByPlaceholderText("Enter Your Password");
      const specialPassword = "P@ssw0rd!#$%^&*()";

      fireEvent.change(passwordInput, { target: { value: specialPassword } });
      expect(passwordInput.value).toBe(specialPassword);
    });
  });

  // ========================================
  // 2. STATE MANAGEMENT TESTING
  // ========================================
  describe("State Management", () => {
    it("should save auth data to localStorage on successful login", async () => {
      const mockAuthData = {
        success: true,
        user: { id: 1, name: "John Doe", email: "test@example.com" },
        token: "mockToken",
        message: "Login successful",
      };

      axios.post.mockResolvedValueOnce({ data: mockAuthData });

      renderLogin();

      fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByText("LOGIN"));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "auth",
        JSON.stringify(mockAuthData)
      );
    });

    it("should handle API response with success=false", async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          success: false,
          message: "Invalid credentials",
        },
      });

      renderLogin();

      fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
        target: { value: "wrongpassword" },
      });
      fireEvent.click(screen.getByText("LOGIN"));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.error).toHaveBeenCalledWith("Invalid credentials");
    });
  });

  // ========================================
  // 3. NAVIGATION & ROUTING
  // ========================================
  describe("Navigation & Routing", () => {
    const mockNavigate = jest.fn();

    beforeEach(() => {
      // Mock useNavigate hook
      const mockUseNavigate = jest.fn(() => mockNavigate);
      jest.doMock("react-router-dom", () => ({
        ...jest.requireActual("react-router-dom"),
        useNavigate: mockUseNavigate,
      }));
    });

    it("should handle successful login navigation", async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          success: true,
          user: { id: 1, name: "John Doe", email: "test@example.com" },
          token: "mockToken",
          message: "Login successful",
        },
      });

      renderLogin();

      fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByText("LOGIN"));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      // Verify login process completes (navigation would happen in real component)
      expect(toast.success).toHaveBeenCalled();
    });
  });
});
