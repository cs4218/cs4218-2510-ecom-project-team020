import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HomePage from "./HomePage";
import axios from "axios";
import { useCart } from "../context/cart";
import { MemoryRouter } from "react-router-dom";
import toast from "react-hot-toast";

jest.mock('react-hot-toast', () => ({
    success: jest.fn(),
    error: jest.fn(),
}));

jest.mock("axios", () => ({
    post: jest.fn(),
    put: jest.fn(),
    get: jest.fn(),
}));

jest.mock('../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()])
}));

jest.mock('../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()])
}));

jest.mock('../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));

jest.mock('../components/Header', () => {
    return function MockedHeader() {
        return <div data-testid="mocked-header">Header</div>;
    };
});

jest.mock('../components/UserMenu', () => () => <div>UserMenuMock</div>);
jest.mock('../components/Layout', () => ({ children }) => <div>{children}</div>);

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
}));


describe("HomePage Integration Tests", () => {
    const mockCartState = [[], jest.fn()];

    beforeEach(() => {
        jest.clearAllMocks();
        useCart.mockReturnValue(mockCartState);
    });

    it("fetches categories and products and renders them", async () => {
        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/category/get-category") {
                return Promise.resolve({ data: { success: true, categories: [{ _id: "c1", name: "Electronics" }] } });
            }
            if (url.startsWith("/api/v1/product/product-list")) {
                return Promise.resolve({ data: { products: [{ _id: "p1", name: "Laptop", description: "Gaming Laptop", price: 1000, slug: "laptop" }] } });
            }
            if (url === "/api/v1/product/product-count") {
                return Promise.resolve({ data: { total: 1 } });
            }
            return Promise.resolve({ data: {} });
        });

        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        );

        expect(await screen.findByText("Electronics")).toBeInTheDocument();

        expect(await screen.findByText("Laptop")).toBeInTheDocument();
        expect(screen.getByText(/\$1,000.00/)).toBeInTheDocument();
        expect(screen.getByText("Gaming Laptop...")).toBeInTheDocument();
    });

    it("renders correctly when category list and products are empty", async () => {
        axios.get.mockResolvedValue({ data: { success: true, categories: [] } });
        axios.get.mockResolvedValue({ data: { products: [] } });
        axios.get.mockResolvedValue({ data: { total: 0 } });

        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        );

        expect(await screen.findByText(/Filter By Category/i)).toBeInTheDocument();

        expect(screen.getByText(/All Products/i)).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /add to cart/i })).not.toBeInTheDocument();
    });

    it("adds a product to the cart", async () => {
        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/category/get-category") {
                return Promise.resolve({ data: { success: true, categories: [{ _id: "c1", name: "Electronics" }] } });
            }
            if (url.startsWith("/api/v1/product/product-list")) {
                return Promise.resolve({ data: { products: [{ _id: "p1", name: "Laptop", description: "Gaming Laptop", price: 1000, slug: "laptop" }] } });
            }
            if (url === "/api/v1/product/product-count") {
                return Promise.resolve({ data: { total: 1 } });
            }
            return Promise.resolve({ data: {} });
        });

        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        );

        const addToCartButton = await screen.findByRole("button", { name: /add to cart/i });
        fireEvent.click(addToCartButton);

        expect(mockCartState[1]).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
    });

    it("navigates to product details page when 'More Details' clicked", async () => {
        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/category/get-category") {
                return Promise.resolve({ data: { success: true, categories: [{ _id: "c1", name: "Electronics" }] } });
            }
            if (url.startsWith("/api/v1/product/product-list")) {
                return Promise.resolve({ data: { products: [{ _id: "p1", name: "Laptop", description: "Gaming Laptop", price: 1000, slug: "laptop" }] } });
            }
            if (url === "/api/v1/product/product-count") {
                return Promise.resolve({ data: { total: 1 } });
            }
            return Promise.resolve({ data: {} });
        });

        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        );

        const moreDetailsButton = await screen.findByRole("button", { name: /more details/i });
        fireEvent.click(moreDetailsButton);

        expect(mockNavigate).toHaveBeenCalledWith("/product/laptop");
    });

    it("loads more products when 'Load More' button clicked", async () => {
        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/category/get-category") return Promise.resolve({ data: { success: true, categories: [] } });
            if (url === "/api/v1/product/product-count") return Promise.resolve({ data: { total: 2 } });
            if (url === "/api/v1/product/product-list/1") return Promise.resolve({ data: { products: [{ _id: "p1", name: "Laptop", description: "Gaming Laptop", price: 1000, slug: "laptop" }] } });
            if (url === "/api/v1/product/product-list/2") return Promise.resolve({ data: { products: [{ _id: "p2", name: "Mouse", description: "Wireless Mouse", price: 50, slug: "mouse" }] } });
            return Promise.resolve({ data: {} });
        });

        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        );

        expect(await screen.findByText("Laptop")).toBeInTheDocument();

        const loadMoreButton = screen.getByText(/Load More/i);
        fireEvent.click(loadMoreButton);

        expect(await screen.findByText("Mouse")).toBeInTheDocument();
    });

    it("filters products when category and price filters are applied together", async () => {
        const products = [
            { _id: "p1", name: "Laptop", description: "Gaming Laptop", price: 1000, slug: "laptop", category: "c1" },
            { _id: "p2", name: "Book", description: "Learn JS", price: 30, slug: "book", category: "c2" },
        ];

        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/category/get-category") {
                return Promise.resolve({
                    data: { success: true, categories: [{ _id: "c1", name: "Electronics" }, { _id: "c2", name: "Books" }] },
                });
            }
            if (url.startsWith("/api/v1/product/product-list")) {
                return Promise.resolve({ data: { products } });
            }
            if (url === "/api/v1/product/product-count") {
                return Promise.resolve({ data: { total: 2 } });
            }
            return Promise.resolve({ data: {} });
        });

        axios.post.mockResolvedValue({
            data: { products: [products[0]] },
        });

        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        );

        expect(await screen.findByText("Laptop")).toBeInTheDocument();
        expect(screen.getByText("Book")).toBeInTheDocument();

        const electronicsCheckbox = screen.getByRole("checkbox", { name: /Electronics/i });
        fireEvent.click(electronicsCheckbox);

        const priceRadio = screen.getByRole("radio", { name: /\$100 or more/i });
        fireEvent.click(priceRadio);

        expect(await screen.findByText("Laptop")).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.queryByText("Book")).not.toBeInTheDocument();
        });
    });

    it("handles API failure gracefully", async () => {
        axios.get.mockRejectedValue(new Error("Network Error"));

        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        );

        expect(await screen.findByText(/Filter By Category/i)).toBeInTheDocument();
        expect(screen.getByText(/All Products/i)).toBeInTheDocument();

        const consoleSpy = jest.spyOn(console, "log");
        expect(consoleSpy).not.toHaveBeenCalled();
    });
});
