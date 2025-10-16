import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import toast from 'react-hot-toast';
import Profile from '../../pages/user/Profile';
import { useAuth } from '../../context/auth';
import axios from "axios";

jest.mock('react-hot-toast', () => ({
    success: jest.fn(),
    error: jest.fn(),
}));

jest.mock("axios", () => ({
    post: jest.fn(),
    put: jest.fn(),
    get: jest.fn(),
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

jest.mock('../../components/UserMenu', () => () => <div>UserMenuMock</div>);
jest.mock('../../components/Layout', () => ({ children }) => <div>{children}</div>);

describe("Profile Component Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockSetAuth = jest.fn();

    const mockAuth = {
        token: "abc123",
        user: {
            name: "Jane",
            email: "jane@example.com",
            phone: "98765432",
            address: "Old Address",
        },
    };

    const setup = () => {
        useAuth.mockReturnValue([mockAuth, mockSetAuth]);
        localStorage.setItem("auth", JSON.stringify(mockAuth));

        render(<Profile />);
    };

    afterEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    it("loads and displays user info from auth context", async () => {
        setup();

        expect(screen.getByDisplayValue("Jane")).toBeInTheDocument();
        expect(screen.getByDisplayValue("jane@example.com")).toBeInTheDocument();
        expect(screen.getByDisplayValue("98765432")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Old Address")).toBeInTheDocument();
    });

    it("updates profile successfully and updates localStorage + context", async () => {
        setup();

        const updatedUser = {
            name: "Jane",
            email: "jane@example.com",
            phone: "91234567",
            address: "New Address",
        };

        axios.put.mockResolvedValueOnce({ data: { updatedUser } });

        fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Jane" } });
        fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: "91234567" } });
        fireEvent.change(screen.getByLabelText(/address/i), { target: { value: "New Address" } });

        fireEvent.click(screen.getByText(/update/i));

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
                name: "Jane",
                email: "jane@example.com",
                password: "",
                phone: "91234567",
                address: "New Address",
            });
        });

        expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully");
        expect(mockSetAuth).toHaveBeenCalledWith(expect.objectContaining({
            user: updatedUser,
        }));

        const saved = JSON.parse(localStorage.getItem("auth"));
        expect(saved.user).toEqual(updatedUser);
    });

    it("accepts boundary 15-digit phone as valid", async () => {
        setup();

        const boundaryPhone = "123456789012345";

        axios.put.mockResolvedValueOnce({
            data: { updatedUser: { ...mockAuth.user, name: "Jane" } },
        });

        fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: boundaryPhone } });
        fireEvent.click(screen.getByText(/update/i));

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
                name: "Jane",
                email: "jane@example.com",
                password: "",
                phone: boundaryPhone,
                address: "Old Address",
            });
        });

        expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully");
    });

    it("accepts boundary 8-digit phone as valid", async () => {
        setup();

        const boundaryPhone = "12345678";

        axios.put.mockResolvedValueOnce({
            data: { updatedUser: { ...mockAuth.user, name: "Jane" } },
        });

        fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: boundaryPhone } });
        fireEvent.click(screen.getByText(/update/i));

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
                name: "Jane",
                email: "jane@example.com",
                password: "",
                phone: boundaryPhone,
                address: "Old Address",
            });
        });

        expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully");
    });

    it("shows toast error when server responds with an error", async () => {
        setup();
        axios.put.mockResolvedValueOnce({ data: { error: "Email already taken" } });

        fireEvent.click(screen.getByText(/update/i));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Email already taken");
        });
    });

    it("shows toast error when request fails", async () => {
        setup();
        axios.put.mockRejectedValueOnce(new Error("Network error"));
        
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => { });

        fireEvent.click(screen.getByText(/update/i));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Something went wrong");
        });
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
        
        consoleSpy.mockRestore();
    });

    it("blocks submission and shows validation error for weak password", async () => {
        setup();

        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "weakpass" } });
        fireEvent.click(screen.getByText(/update/i));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Please fix the errors before submitting");
        });

        await waitFor(() => {
            expect(screen.getByText(/must be at least 8 characters/i)).toBeInTheDocument();
        });


        expect(axios.put).not.toHaveBeenCalled();
    });

    it("blocks submission and shows validation error for invalid phone", async () => {
        setup();

        fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: "abcd" } });
        fireEvent.click(screen.getByText(/update/i));

        await waitFor(() => {
            expect(screen.getByText(/phone number must be 8–15 digits only/i)).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Please fix the errors before submitting");
        });

        expect(axios.put).not.toHaveBeenCalled();
    });

    it("clears validation errors when corrected and submits successfully", async () => {
        setup();

        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "weakpass" } });
        fireEvent.click(screen.getByText(/update/i));

        await waitFor(() => {
            expect(screen.getByText(/must be at least 8 characters/i)).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "Password123!" } });

        axios.put.mockResolvedValueOnce({ data: { updatedUser: { ...mockAuth.user, name: "Updated Jane" } } });
        fireEvent.click(screen.getByText(/update/i));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully");
        });
    });
});
