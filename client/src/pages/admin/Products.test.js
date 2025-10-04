/**
 * Unit tests for Products.js
 * - Communication-based: axios + toast calls
 * - Output-based: DOM rendering of products, links, images
 * - State-based: render after async fetch resolution
 *
 * Notes:
 *  - Mock paths MUST match the component's import paths exactly.
 *  - No userEvent.setup() (keeps compatibility with older user-event).
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";

// ---- Mocks (test doubles) ----
jest.mock("axios");

// Matches: import Layout from "./../../components/Layout";
jest.mock("./../../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => (
    <div data-testid="LayoutMock">
      <div>LayoutMock</div>
      {children}
    </div>
  ),
}));

// Matches: import AdminMenu from "../../components/AdminMenu";
jest.mock("../../components/AdminMenu", () => ({
  __esModule: true,
  default: () => <div>AdminMenuMock</div>,
}));

// Matches: import toast from "react-hot-toast"; and uses toast.error(...)
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { error: jest.fn() },
}));

// Import the component under test AFTER mocks are set
import Products from "./Products";

const mockProducts = [
  { _id: "p1", name: "Rope", description: "Durable rope", slug: "rope" },
  { _id: "p2", name: "Helmet", description: "Climbing helmet", slug: "helmet" },
  { _id: "p3", name: "Carabiner", description: "Locking type", slug: "carabiner" },
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <Products />
    </MemoryRouter>
  );

describe("Products.js", () => {
  const toast = require("react-hot-toast").default;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Silence React act/warning noise in the console for cleaner test output.
  let consoleErrorSpy;
  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  test("calls backend once on mount (communication-based) and renders header (output-based)", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

    // Act
    renderPage();

    // Assert
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product");
      expect(screen.getByText("All Products List")).toBeInTheDocument();
    });
  });

  test("renders N product cards with correct text (output-based)", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

    // Act
    renderPage();

    // Assert
    await waitFor(() => {
      // Cards are wrapped in <Link>, so count links
      const links = screen.getAllByRole("link");
      expect(links.length).toBe(mockProducts.length);

      // Verify product text
      mockProducts.forEach((p) => {
        expect(screen.getByText(p.name)).toBeInTheDocument();
        expect(screen.getByText(p.description)).toBeInTheDocument();
      });
    });
  });

  test("each image uses correct src & alt; each card link targets product slug (output-based)", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

    // Act
    renderPage();

    // Assert
    await waitFor(() => {
      mockProducts.forEach((p) => {
        // Image checks
        const img = screen.getByAltText(p.name);
        expect(img).toHaveAttribute(
          "src",
          `/api/v1/product/product-photo/${p._id}`
        );

        // Link wraps the card; find closest anchor from product title
        const title = screen.getByText(p.name);
        const link = title.closest("a");
        expect(link).toBeTruthy();
        expect(link).toHaveAttribute(
          "href",
          `/dashboard/admin/product/${p.slug}`
        );
      });
    });
  });

  test("shows toast error on fetch failure and renders empty state (communication + output)", async () => {
    // Arrange
    axios.get.mockRejectedValueOnce(new Error("Network error"));

    // Act
    renderPage();

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Someething Went Wrong");
      // empty: no product links
      const links = screen.queryAllByRole("link");
      expect(links.length).toBe(0);
      // header still visible
      expect(screen.getByText("All Products List")).toBeInTheDocument();
    });
  });

  test("renders empty state gracefully when API returns [] (output-based)", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({ data: { products: [] } });

    // Act
    renderPage();

    // Assert
    await waitFor(() => {
      expect(screen.getByText("All Products List")).toBeInTheDocument();
      const links = screen.queryAllByRole("link");
      expect(links.length).toBe(0);
    });
  });

  test("state updates after fetch (state observed via DOM)", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

    // Act
    renderPage();

    // Assert: titles appear only after async resolves
    const rope = await screen.findByText("Rope");
    expect(rope).toBeInTheDocument();
  });

  test("missing optional fields (empty description) does not crash (robustness)", async () => {
    // Arrange
    const edgeProducts = [{ _id: "x1", name: "Ascender", description: "", slug: "ascender" }];
    axios.get.mockResolvedValueOnce({ data: { products: edgeProducts } });

    // Act
    renderPage();

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Ascender")).toBeInTheDocument();
      // description is empty -> ensure we still render the card without throwing
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/dashboard/admin/product/ascender");
      const img = screen.getByAltText("Ascender");
      expect(img).toHaveAttribute("src", "/api/v1/product/product-photo/x1");
    });
  });

  test("does not refetch after initial mount (no extra fetches)", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

    // Act
    renderPage();

    // Assert
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
  });
});
