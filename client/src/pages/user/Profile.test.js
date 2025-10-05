// This file contains unit tests generated with AI assistance but curated, validated and refined by me.
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Profile from "./Profile";
import axios from "axios";
import toast from "react-hot-toast";
import '@testing-library/jest-dom/extend-expect';

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [[], jest.fn()]),
}));

jest.mock("../../hooks/useCategory", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));

const mockUseAuth = jest.fn();
const mockSetAuth = jest.fn();
jest.mock('../../context/auth', () => ({
  useAuth: () => mockUseAuth()
}));

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

describe("Profile Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Static Rendering", () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    beforeEach(() => {
      jest.clearAllMocks();
      consoleSpy.mockClear();
      mockSetAuth.mockClear();
      localStorageMock.getItem.mockClear();
      localStorageMock.setItem.mockClear();
    });

    afterAll(() => {
      consoleSpy.mockRestore();
    });

    it("populates form fields when auth user data exists", () => {
      const mockAuth = {
        token: "valid-token",
        user: {
          name: "John",
          email: "john@test.com",
          phone: "1234567890",
          address: "123 St"
        }
      };
      mockUseAuth.mockReturnValue([mockAuth, mockSetAuth]);

      render(
        <MemoryRouter initialEntries={['/dashboard/user/profile']}>
          <Profile />
        </MemoryRouter>
      );

      expect(
        screen.getByRole("heading", { name: /user profile/i })
      ).toBeInTheDocument();

      expect(screen.getByLabelText(/name/i)).toHaveValue("John");
      expect(screen.getByLabelText(/email/i)).toHaveValue("john@test.com");
      expect(screen.getByLabelText(/phone/i)).toHaveValue("1234567890");
      expect(screen.getByLabelText(/address/i)).toHaveValue("123 St");
      expect(screen.getByLabelText(/password/i)).toHaveValue("");

      expect(
        screen.getByRole("button", { name: /update/i })
      ).toBeInTheDocument();
    });

    it("renders empty form fields when auth user is null", () => {
      mockUseAuth.mockReturnValue([{ token: "valid-token", user: null }, mockSetAuth]);

      render(
        <MemoryRouter initialEntries={['/dashboard/user/profile']}>
          <Profile />
        </MemoryRouter>
      );

      expect(
        screen.getByRole("heading", { name: /user profile/i })
      ).toBeInTheDocument();

      expect(screen.getByLabelText(/name/i)).toHaveValue("");
      expect(screen.getByLabelText(/email/i)).toHaveValue("");
      expect(screen.getByLabelText(/phone/i)).toHaveValue("");
      expect(screen.getByLabelText(/address/i)).toHaveValue("");
      expect(screen.getByLabelText(/password/i)).toHaveValue("");

      expect(
        screen.getByRole("button", { name: /update/i })
      ).toBeInTheDocument();
    });

    it("renders empty form fields when auth is undefined", () => {
      mockUseAuth.mockReturnValue([undefined, mockSetAuth]);

      render(
        <MemoryRouter initialEntries={['/dashboard/user/profile']}>
          <Profile />
        </MemoryRouter>
      );

      expect(
        screen.getByRole("heading", { name: /user profile/i })
      ).toBeInTheDocument();

      expect(screen.getByLabelText(/name/i)).toHaveValue("");
      expect(screen.getByLabelText(/email/i)).toHaveValue("");
      expect(screen.getByLabelText(/phone/i)).toHaveValue("");
      expect(screen.getByLabelText(/address/i)).toHaveValue("");
      expect(screen.getByLabelText(/password/i)).toHaveValue("");

      expect(
        screen.getByRole("button", { name: /update/i })
      ).toBeInTheDocument();
    });

    it("handles auth user with some undefined fields safely", () => {
      const mockAuth = { token: "valid-token", user: { name: "Jane" } };
      mockUseAuth.mockReturnValue([mockAuth, mockSetAuth]);

      render(
        <MemoryRouter initialEntries={['/dashboard/user/profile']}>
          <Profile />
        </MemoryRouter>
      );

      expect(screen.getByLabelText(/name/i)).toHaveValue("Jane");
      expect(screen.getByLabelText(/email/i)).toHaveValue("");
      expect(screen.getByLabelText(/phone/i)).toHaveValue("");
      expect(screen.getByLabelText(/address/i)).toHaveValue("");
      expect(screen.getByLabelText(/password/i)).toHaveValue("");
    });

    it("allows user to type in all form fields except email", () => {
      render(
        <MemoryRouter initialEntries={['/dashboard/user/profile']}>
          <Profile />
        </MemoryRouter>
      );

      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: "Bob" } });
      expect(nameInput).toHaveValue("Bob");

      const phoneInput = screen.getByLabelText(/phone/i);
      fireEvent.change(phoneInput, { target: { value: "9876543210" } });
      expect(phoneInput).toHaveValue("9876543210");

      const addressInput = screen.getByLabelText(/address/i);
      fireEvent.change(addressInput, { target: { value: "456 St" } });
      expect(addressInput).toHaveValue("456 St");

      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.change(passwordInput, { target: { value: "Newpass123@" } });
      expect(passwordInput).toHaveValue("Newpass123@");

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeDisabled();
    });

    it("submits form successfully, updates auth/localStorage and shows success toast", async () => {
      const mockUser = {
        name: "John",
        email: "john@test.com",
        phone: "1234567890",
        address: "123 St",
      };
      axios.put.mockResolvedValue({
        data: { updatedUser: { ...mockUser, name: "Bob" } },
      });

      render(
        <MemoryRouter initialEntries={['/dashboard/user/profile']}>
          <Profile />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Bob" } });
      fireEvent.click(screen.getByRole("button", { name: /update/i }));

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          "/api/v1/auth/profile",
          expect.objectContaining({ name: "Bob" })
        );
      });

      await waitFor(() => {
        expect(mockSetAuth).toHaveBeenCalledWith(
          expect.objectContaining({ user: expect.objectContaining({ name: "Bob" }) })
        );
      });

      await waitFor(() => {
        expect(localStorage.getItem("auth")).toContain("Bob");
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully");
      });
    });

    it("handles API error and shows generic error toast", async () => {
      const mockError = new Error("Network error");
      axios.put.mockRejectedValue(mockError);

      render(
        <MemoryRouter initialEntries={['/dashboard/user/profile']}>
          <Profile />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole("button", { name: /update/i }));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(mockError);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Something went wrong");
      });

      expect(mockSetAuth).not.toHaveBeenCalled();
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it("shows error toast if API returns error property", async () => {
      axios.put.mockResolvedValue({ data: { error: "Error" } });

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole("button", { name: /update/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Error");
      });
    });

    it("handles partial user data with missing fields", () => {
      const mockAuth = {
        token: "valid-token",
        user: {
          name: "John Doe",
          email: "john@example.com"
        }
      };
      mockUseAuth.mockReturnValue([mockAuth, mockSetAuth]);

      render(
        <MemoryRouter initialEntries={['/dashboard/user/profile']}>
          <Profile />
        </MemoryRouter>
      );

      expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
      expect(screen.getByDisplayValue("john@example.com")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter Your Phone")).toHaveValue("");
      expect(screen.getByPlaceholderText("Enter Your Address")).toHaveValue("");
    });

    it("handles completely empty user object", () => {
      const mockAuth = {
        token: "valid-token",
        user: {}
      };
      mockUseAuth.mockReturnValue([mockAuth, mockSetAuth]);

      render(
        <MemoryRouter initialEntries={['/dashboard/user/profile']}>
          <Profile />
        </MemoryRouter>
      );

      expect(screen.getByPlaceholderText("Enter Your Name")).toHaveValue("");
      expect(screen.getByPlaceholderText("Enter Your Phone")).toHaveValue("");
      expect(screen.getByPlaceholderText("Enter Your Address")).toHaveValue("");
    });

    it("submits form with only password updated", async () => {
      const mockAuth = {
        token: "valid-token",
        user: {
          name: "John",
          email: "john@test.com",
          phone: "1234567890",
          address: "123 St"
        }
      };
      mockUseAuth.mockReturnValue([mockAuth, mockSetAuth]);
      axios.put.mockResolvedValue({ data: { updatedUser: mockAuth.user } });
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockAuth));

      render(
        <MemoryRouter initialEntries={['/dashboard/user/profile']}>
          <Profile />
        </MemoryRouter>
      );

      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.change(passwordInput, { target: { value: "Newsecretpassword@" } });
      fireEvent.click(screen.getByRole("button", { name: /update/i }));

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
          name: "John",
          email: "john@test.com",
          password: "Newsecretpassword@",
          phone: "1234567890",
          address: "123 St"
        });
      });
    });
  });

  describe("Phone Number Validation Boundary Value Analysis", () => {
    it("shows error for phone number with less than 8 digits", async () => {
      mockUseAuth.mockReturnValue([{ user: {} }, mockSetAuth]);

      render(
        <MemoryRouter initialEntries={['/dashboard/user/profile']}>
          <Profile />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/phone/i), {
        target: { value: "1234567" }
      });
      fireEvent.click(screen.getByRole("button", { name: /update/i }));

      await waitFor(() => {
        expect(screen.getByText("Phone number must be 8–15 digits only")).toBeInTheDocument();
      });
      expect(toast.error).toHaveBeenCalledWith("Please fix the errors before submitting");
      expect(axios.put).not.toHaveBeenCalled();
    });

    it("shows error for phone number with more than 15 digits", async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard/user/profile']}>
          <Profile />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/phone/i), {
        target: { value: "1234567890123456" }
      });
      fireEvent.click(screen.getByRole("button", { name: /update/i }));

      await waitFor(() => {
        expect(screen.getByText("Phone number must be 8–15 digits only")).toBeInTheDocument();
      });
    });

    it("accepts phone number with exactly 8 digits", async () => {
      mockUseAuth.mockReturnValue([{ user: {} }, mockSetAuth]);
      axios.put.mockResolvedValue({ data: { updatedUser: {} } });

      render(
        <MemoryRouter initialEntries={['/dashboard/user/profile']}>
          <Profile />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/phone/i), {
        target: { value: "12345678" }
      });
      fireEvent.click(screen.getByRole("button", { name: /update/i }));

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalled();
      });
      expect(screen.queryByText("Phone number must be 8–15 digits only")).not.toBeInTheDocument();
    });

    it("accepts phone number with exactly 15 digits", async () => {
      mockUseAuth.mockReturnValue([{ user: {} }, mockSetAuth]);
      axios.put.mockResolvedValue({ data: { updatedUser: {} } });

      render(
        <MemoryRouter initialEntries={['/dashboard/user/profile']}>
          <Profile />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/phone/i), {
        target: { value: "123456789012345" }
      });
      fireEvent.click(screen.getByRole("button", { name: /update/i }));

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalled();
      });
      expect(screen.queryByText("Phone number must be 8–15 digits only")).not.toBeInTheDocument();
    });

    it("accepts phone number with 9 digits", async () => {
      mockUseAuth.mockReturnValue([{ user: {} }, mockSetAuth]);
      axios.put.mockResolvedValue({ data: { updatedUser: {} } });

      render(
        <MemoryRouter initialEntries={['/dashboard/user/profile']}>
          <Profile />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/phone/i), {
        target: { value: "123456789" }
      });
      fireEvent.click(screen.getByRole("button", { name: /update/i }));

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalled();
      });
      expect(screen.queryByText("Phone number must be 8–15 digits only")).not.toBeInTheDocument();
    });

    it("accepts phone number with 14 digits", async () => {
      mockUseAuth.mockReturnValue([{ user: {} }, mockSetAuth]);
      axios.put.mockResolvedValue({ data: { updatedUser: {} } });

      render(
        <MemoryRouter initialEntries={['/dashboard/user/profile']}>
          <Profile />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/phone/i), {
        target: { value: "12345678901234" }
      });
      fireEvent.click(screen.getByRole("button", { name: /update/i }));

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalled();
      });
      expect(screen.queryByText("Phone number must be 8–15 digits only")).not.toBeInTheDocument();
    });

    it("shows error for phone number with non-numeric characters", async () => {
      mockUseAuth.mockReturnValue([{ user: {} }, mockSetAuth]);

      render(
        <MemoryRouter initialEntries={['/dashboard/user/profile']}>
          <Profile />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/phone/i), {
        target: { value: "123abc7890" }
      });
      fireEvent.click(screen.getByRole("button", { name: /update/i }));

      await waitFor(() => {
        expect(screen.getByText("Phone number must be 8–15 digits only")).toBeInTheDocument();
      });
    });

    it("displays phone error with correct error message", async () => {
      mockUseAuth.mockReturnValue([{ user: {} }, mockSetAuth]);

      render(
        <MemoryRouter initialEntries={['/dashboard/user/profile']}>
          <Profile />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/phone/i), {
        target: { value: "123" }
      });
      fireEvent.click(screen.getByRole("button", { name: /update/i }));

      await waitFor(() => {
        const phoneInput = screen.getByLabelText(/phone/i);
        expect(phoneInput).toHaveClass("is-invalid");
      });
    });
  });

  describe("Password Validation Equivalence Partitioning", () => {
    it("shows error for password less than 8 characters", async () => {
      mockUseAuth.mockReturnValue([{ user: {} }, mockSetAuth]);

      render(
        <MemoryRouter initialEntries={['/dashboard/user/profile']}>
          <Profile />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: "Pass1!" }
      });
      fireEvent.click(screen.getByRole("button", { name: /update/i }));

      await waitFor(() => {
        expect(screen.getByText(/Must be at least 8 characters/)).toBeInTheDocument();
      });
    });

    it("shows error for password without uppercase letter", async () => {
      mockUseAuth.mockReturnValue([{ user: {} }, mockSetAuth]);

      render(
        <MemoryRouter initialEntries={['/dashboard/user/profile']}>
          <Profile />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: "password123!" }
      });
      fireEvent.click(screen.getByRole("button", { name: /update/i }));

      await waitFor(() => {
        expect(screen.getByText(/Must be at least 8 characters/)).toBeInTheDocument();
      });
    });

    it("shows error for password without special character", async () => {
      mockUseAuth.mockReturnValue([{ user: {} }, mockSetAuth]);

      render(
        <MemoryRouter initialEntries={['/dashboard/user/profile']}>
          <Profile />
        </MemoryRouter>
      );
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: "Password123" }
      });
      fireEvent.click(screen.getByRole("button", { name: /update/i }));

      await waitFor(() => {
        expect(screen.getByText(/Must be at least 8 characters/)).toBeInTheDocument();
      });
    });

    it("accepts valid password with >= 8 chars, uppercase, and special char", async () => {
      mockUseAuth.mockReturnValue([{ user: {} }, mockSetAuth]);
      axios.put.mockResolvedValue({ data: { updatedUser: {} } });

      render(
        <MemoryRouter initialEntries={['/dashboard/user/profile']}>
          <Profile />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: "ValidPass123!" }
      });
      fireEvent.click(screen.getByRole("button", { name: /update/i }));

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalled();
      });
      expect(screen.queryByText(/Must be at least 8 characters/)).not.toBeInTheDocument();
    });

    it("displays password error with correct error message", async () => {
      mockUseAuth.mockReturnValue([{ user: {} }, mockSetAuth]);

      render(
        <MemoryRouter initialEntries={['/dashboard/user/profile']}>
          <Profile />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: "weak" }
      });
      fireEvent.click(screen.getByRole("button", { name: /update/i }));

      await waitFor(() => {
        const passwordInput = screen.getByLabelText(/password/i);
        expect(passwordInput).toHaveClass("is-invalid");
      });
    });
  });
});