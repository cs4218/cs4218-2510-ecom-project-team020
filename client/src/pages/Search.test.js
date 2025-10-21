import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import Search from "./Search";

// Mock dependencies
jest.mock("../components/Layout", () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout" data-title={title}>
        {children}
      </div>
    );
  };
});

// Mock search context
jest.mock("../context/search", () => ({
  useSearch: jest.fn(),
}));

// Mock cart context
jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  MemoryRouter: jest.requireActual("react-router-dom").MemoryRouter,
}));

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
}));

const { useSearch } = require("../context/search");
const { useCart } = require("../context/cart");
const toast = require("react-hot-toast");

// Mock data
const mockSearchResults = [
  {
    _id: "507f1f77bcf86cd799439011",
    name: "Test Product 1",
    description:
      "This is a detailed description for test product 1 that is longer than 30 characters",
    price: 99.99,
    slug: "test-product-1",
  },
  {
    _id: "507f1f77bcf86cd799439012",
    name: "Test Product 2",
    description: "Short desc",
    price: 149.99,
    slug: "test-product-2",
  },
  {
    _id: "507f1f77bcf86cd799439013",
    name: "Test Product 3",
    description: "Another detailed description for the third test product",
    price: 199.99,
    slug: "test-product-3",
  },
];

const renderSearch = () => {
  return render(
    <MemoryRouter>
      <Search />
    </MemoryRouter>
  );
};

describe("Search Component", () => {
  const mockSetValues = jest.fn();
  const mockCart = [];
  const mockSetCart = jest.fn();

  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn(),
  };
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetValues.mockClear();
    mockSetCart.mockClear();
    mockNavigate.mockClear();
    toast.success.mockClear();
    localStorageMock.setItem.mockClear();

    // Provide default mocks to prevent crashes
    useSearch.mockReturnValue([{ keyword: "", results: [] }, mockSetValues]);
    useCart.mockReturnValue([mockCart, mockSetCart]);
  });

  describe("Component Rendering", () => {
    it("should render layout with correct title", () => {
      useSearch.mockReturnValue([{ keyword: "", results: [] }, mockSetValues]);

      renderSearch();

      const layout = screen.getByTestId("layout");
      expect(layout).toBeInTheDocument();
      expect(layout).toHaveAttribute("data-title", "Search results");
    });

    it("should render search results heading", () => {
      useSearch.mockReturnValue([{ keyword: "", results: [] }, mockSetValues]);

      renderSearch();

      expect(screen.getByText("Search Results")).toBeInTheDocument();
    });
  });

  describe("No Results State", () => {
    it("should display 'No Products Found' when results array is empty", () => {
      useSearch.mockReturnValue([
        { keyword: "empty search", results: [] },
        mockSetValues,
      ]);

      renderSearch();

      expect(screen.getByText("No Products Found")).toBeInTheDocument();
    });

    it("should not render product cards when no results", () => {
      useSearch.mockReturnValue([
        { keyword: "no results", results: [] },
        mockSetValues,
      ]);

      renderSearch();

      const cards = screen.queryAllByText("More Details");
      expect(cards).toHaveLength(0);
    });
  });

  describe("Results Display", () => {
    it("should display correct count for single result", () => {
      useSearch.mockReturnValue([
        { keyword: "single", results: [mockSearchResults[0]] },
        mockSetValues,
      ]);

      renderSearch();

      expect(screen.getByText("Found 1")).toBeInTheDocument();
    });

    it("should display correct count for multiple results", () => {
      useSearch.mockReturnValue([
        { keyword: "multiple", results: mockSearchResults },
        mockSetValues,
      ]);

      renderSearch();

      expect(screen.getByText("Found 3")).toBeInTheDocument();
    });

    it("should render product names correctly", () => {
      useSearch.mockReturnValue([
        { keyword: "names", results: mockSearchResults },
        mockSetValues,
      ]);

      renderSearch();

      expect(screen.getByText("Test Product 1")).toBeInTheDocument();
      expect(screen.getByText("Test Product 2")).toBeInTheDocument();
      expect(screen.getByText("Test Product 3")).toBeInTheDocument();
    });

    it("should render product prices correctly", () => {
      useSearch.mockReturnValue([
        { keyword: "prices", results: mockSearchResults },
        mockSetValues,
      ]);

      renderSearch();

      expect(screen.getByText("$ 99.99")).toBeInTheDocument();
      expect(screen.getByText("$ 149.99")).toBeInTheDocument();
      expect(screen.getByText("$ 199.99")).toBeInTheDocument();
    });

    it("should truncate long descriptions to 30 characters", () => {
      useSearch.mockReturnValue([
        { keyword: "descriptions", results: mockSearchResults },
        mockSetValues,
      ]);

      renderSearch();

      // First product has long description
      expect(
        screen.getByText("This is a detailed description...")
      ).toBeInTheDocument();

      // Second product has short description
      expect(screen.getByText("Short desc...")).toBeInTheDocument();

      // Third product has long description
      expect(
        screen.getByText("Another detailed description f...")
      ).toBeInTheDocument();
    });
  });

  describe("Edge Cases and Data Handling", () => {
    it("should handle products with missing names gracefully", () => {
      const productsWithMissingNames = [
        {
          _id: "507f1f77bcf86cd799439014",
          // name is missing
          description: "Product without name",
          price: 50.0,
        },
      ];

      useSearch.mockReturnValue([
        { keyword: "missing names", results: productsWithMissingNames },
        mockSetValues,
      ]);

      renderSearch();

      expect(screen.getByText("Found 1")).toBeInTheDocument();
      // Should show default text for missing name
      expect(screen.getByText("Unnamed Product")).toBeInTheDocument();
      // Should still render the card structure
      expect(screen.getByText("More Details")).toBeInTheDocument();
    });

    it("should handle products with missing descriptions gracefully", () => {
      const productsWithMissingDesc = [
        {
          _id: "507f1f77bcf86cd799439015",
          name: "Product Without Description",
          // description is missing
          price: 75.0,
        },
      ];

      useSearch.mockReturnValue([
        { keyword: "missing desc", results: productsWithMissingDesc },
        mockSetValues,
      ]);

      renderSearch();

      expect(
        screen.getByText("Product Without Description")
      ).toBeInTheDocument();
      expect(screen.getByText("$ 75")).toBeInTheDocument();
      // Should show default text for missing description
      expect(screen.getByText("No description available")).toBeInTheDocument();
    });

    it("should handle products with zero price", () => {
      const productsWithZeroPrice = [
        {
          _id: "507f1f77bcf86cd799439016",
          name: "Free Product",
          description: "This product is free",
          price: 0,
        },
      ];

      useSearch.mockReturnValue([
        { keyword: "free", results: productsWithZeroPrice },
        mockSetValues,
      ]);

      renderSearch();

      expect(screen.getByText("Free Product")).toBeInTheDocument();
      expect(screen.getByText("$ 0")).toBeInTheDocument();
    });

    it("should handle products with very long names", () => {
      const productsWithLongNames = [
        {
          _id: "507f1f77bcf86cd799439017",
          name: "This is a very long product name that might cause layout issues if not handled properly",
          description: "Long name product",
          price: 100,
        },
      ];

      useSearch.mockReturnValue([
        { keyword: "long name", results: productsWithLongNames },
        mockSetValues,
      ]);

      renderSearch();

      expect(
        screen.getByText(
          "This is a very long product name that might cause layout issues if not handled properly"
        )
      ).toBeInTheDocument();
    });
  });

  describe("Context Integration", () => {
    it("should use search context values correctly", () => {
      useSearch.mockReturnValue([
        { keyword: "context test", results: mockSearchResults },
        mockSetValues,
      ]);

      renderSearch();

      expect(useSearch).toHaveBeenCalled();
      expect(screen.getByText("Found 3")).toBeInTheDocument();
    });

    it("should handle context with missing results property", () => {
      useSearch.mockReturnValue([{}, mockSetValues]);

      renderSearch();

      expect(screen.getByText("No Products Found")).toBeInTheDocument();
    });
  });
});
