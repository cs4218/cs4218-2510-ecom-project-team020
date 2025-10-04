/**
 * Unit tests for Products.js
 * - Uses Jest & React Testing Library
 * - Mocks axios and react-hot-toast
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import Products from "./Products";

jest.mock("axios");

jest.mock("./../../components/Layout", () => {
  return {
    __esModule: true,
    default: ({ children }) => (
      <div>
        <div>LayoutMock</div>
        {children}
      </div>
    ),
  };
});

jest.mock("../../components/AdminMenu", () => {
  return {
    __esModule: true,
    default: () => <div>AdminMenuMock</div>,
  };
});

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { error: jest.fn() },
}));

describe("Products component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("calls axios.get once on mount and displays products", async () => {
    const mockProducts = [
      { _id: "1", name: "Rope", description: "Durable rope", slug: "rope" },
      { _id: "2", name: "Helmet", description: "Climbing helmet", slug: "helmet" },
    ];
    axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product");
      expect(screen.getByText("All Products List")).toBeInTheDocument();
      expect(screen.getByText("Rope")).toBeInTheDocument();
      expect(screen.getByText("Helmet")).toBeInTheDocument();
    });
  });

  test("renders correct product links and images", async () => {
    const mockProducts = [
      { _id: "99", name: "Carabiner", description: "Locking type", slug: "carabiner" },
    ];
    axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    const title = await screen.findByText("Carabiner");
    const link = title.closest("a");
    expect(link).toHaveAttribute("href", "/dashboard/admin/product/carabiner");

    const img = await screen.findByAltText("Carabiner");
    expect(img).toHaveAttribute("src", "/api/v1/product/product-photo/99");
  });

  test("shows toast on fetch failure", async () => {
    const mockError = new Error("Network error");
    axios.get.mockRejectedValueOnce(mockError);
    const toast = require("react-hot-toast");

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith("Someething Went Wrong");
    });

    // with failure, list should be empty
    const anyLinks = screen.queryAllByRole("link");
    expect(anyLinks.length).toBe(0);
  });

  test("renders empty state gracefully when no products returned", async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [] } });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("All Products List")).toBeInTheDocument();
      const cards = screen.queryAllByRole("link");
      expect(cards.length).toBe(0);
    });
  });
});
