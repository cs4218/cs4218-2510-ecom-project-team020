import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Register from "./Register";
import axios from "axios";
import toast from "react-hot-toast";

jest.mock("axios", () => ({
  post: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  Toaster: () => null,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()])
}));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()])
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));

jest.mock('../../components/Header', () => {
  return function MockedHeader() {
    return <div data-testid="mocked-header">Header</div>;
  };
});

describe("Register Component Integration", () => {
  const fillForm = () => {
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '12345678' } });
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Street' } });
    fireEvent.change(screen.getByLabelText(/dob/i), { target: { value: '2000-01-01' } });
    fireEvent.change(screen.getByLabelText(/answer/i), { target: { value: 'Football' } });
  };

  const setup = () =>
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("successfully registers the user and navigates to /login", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    setup();

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/register", {
        name: "John Doe",
        email: "test@example.com",
        password: "Password123!",
        phone: "12345678",
        address: "123 Street",
        DOB: "2000-01-01",
        answer: "Football",
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Registered Successfully, Please Login");
    });

    await waitFor(() => {
      expect(screen.getByText("Login Page")).toBeInTheDocument();
    });
  });

  it("shows API error toast when registration fails", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: false, message: "User already exists" } });
    setup();

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("User already exists");
    });

    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("shows network/server error toast on axios failure", async () => {
    axios.post.mockRejectedValueOnce(new Error("Network Error"));
    setup();

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });

    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("does not call API when form validation fails", async () => {
    setup();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "invalid-email" } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(toast.success).not.toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(toast.error).not.toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it("clears validation errors after correcting inputs", async () => {
    setup();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "invalid-email" } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
    fillForm();

    axios.post.mockResolvedValueOnce({ data: { success: true } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Registered Successfully, Please Login");
    });

    await waitFor(() => {
      expect(screen.getByText("Login Page")).toBeInTheDocument();
    });
  });

  it("handles boundary phone numbers correctly", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    setup();

    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: "12345678" } });
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/auth/register",
        expect.objectContaining({ phone: "12345678" })
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });

  });
});
