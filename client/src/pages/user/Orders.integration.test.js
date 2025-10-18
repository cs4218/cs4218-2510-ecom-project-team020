import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import Orders from "./Orders";
import axios from "axios";
import { useAuth } from "../../context/auth";
import moment from "moment";

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

describe("Orders Component Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("fetches and renders orders successfully", async () => {
        useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
        const mockOrders = [
            {
                _id: "order1",
                status: "Not Processed",
                buyer: { name: "John" },
                createdAt: new Date().toISOString(),
                payment: { success: true },
                products: [
                    {
                        _id: "prod1",
                        name: "Laptop",
                        description: "description",
                        price: 25.99
                    },
                    {
                        _id: "prod2",
                        name: "Mouse",
                        description: "description",
                        price: 10.00
                    }
                ]
            }
        ];

        axios.get.mockResolvedValue({
            data: mockOrders
        });

        render(<Orders />);

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
        });

        expect(await screen.findByText("All Orders")).toBeInTheDocument();
        expect(await screen.findByText("John")).toBeInTheDocument();
        expect(await screen.findByText("Not Processed")).toBeInTheDocument();
        expect(await screen.findByText("Laptop")).toBeInTheDocument();
        expect(await screen.findByText("Mouse")).toBeInTheDocument();

        expect(
            screen.getByText(moment(mockOrders[0].createdAt).fromNow())
        ).toBeInTheDocument();
    });

    it("renders multiple orders correctly", async () => {
        useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);

        const mockOrders = [
            {
                _id: "order1",
                status: "Delivered",
                buyer: { name: "John" },
                createdAt: new Date().toISOString(),
                payment: { success: true },
                products: [
                    {
                        _id: "p1",
                        name: "Laptop",
                        description: "description",
                        price: 1200
                    }
                ],
            },
            {
                _id: "order2",
                status: "Not Processed",
                buyer: { name: "John" },
                createdAt: new Date().toISOString(),
                payment: { success: false },
                products: [
                    {
                        _id: "p2",
                        name: "Mouse",
                        description: "description",
                        price: 20,
                    }
                ],
            },
        ];

        axios.get.mockResolvedValue({ data: mockOrders });

        render(<Orders />);

        expect(await screen.findAllByText("John")).toHaveLength(2);
        expect(await screen.findByText("Delivered")).toBeInTheDocument();
        expect(await screen.findByText("Not Processed")).toBeInTheDocument();
        expect(await screen.findByText("Laptop")).toBeInTheDocument();
        expect(await screen.findByText("Mouse")).toBeInTheDocument();
    });

    it("renders without crashing when no orders are returned", async () => {
        useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
        axios.get.mockResolvedValue({ data: [] });

        render(<Orders />);

        await waitFor(() => {
            expect(screen.getByText("All Orders")).toBeInTheDocument();
        });

        expect(screen.queryByText(/status/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/buyer/i)).not.toBeInTheDocument();
    });

    it("does not call API if user is not authenticated", async () => {
        useAuth.mockReturnValue([{ token: null }]);

        render(<Orders />);

        await waitFor(() => {
            expect(axios.get).not.toHaveBeenCalled();
        });

        expect(screen.getByText("All Orders")).toBeInTheDocument();
    });

    it("handles API errors gracefully", async () => {
        useAuth.mockReturnValue([{ token: "mock-token" }]);
        axios.get.mockRejectedValueOnce(new Error("Network Error"));

        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => { });

        render(<Orders />);

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledTimes(1);
        });

        // Should still render the base layout without crashing
        expect(screen.getByText("All Orders")).toBeInTheDocument();
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

        consoleSpy.mockRestore();
    });
});
