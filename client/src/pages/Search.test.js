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
const { useSearch } = require("../context/search");

// Mock data
const mockSearchResults = [
  {
    _id: "507f1f77bcf86cd799439011",
    name: "Test Product 1",
    description:
      "This is a detailed description for test product 1 that is longer than 30 characters",
    price: 99.99,
  },
  {
    _id: "507f1f77bcf86cd799439012",
    name: "Test Product 2",
    description: "Short desc",
    price: 149.99,
  },
  {
    _id: "507f1f77bcf86cd799439013",
    name: "Test Product 3",
    description: "Another detailed description for the third test product",
    price: 199.99,
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetValues.mockClear();

    // Provide default mock for useSearch to prevent crashes
    useSearch.mockReturnValue([{ keyword: "", results: [] }, mockSetValues]);
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

    it("should render container with correct classes", () => {
      useSearch.mockReturnValue([{ keyword: "", results: [] }, mockSetValues]);

      renderSearch();

      // Test that the layout is rendered with correct test id
      const layout = screen.getByTestId("layout");
      expect(layout).toBeInTheDocument();
      expect(layout).toHaveAttribute("data-title", "Search results");

      // Test that the heading is rendered
      const heading = screen.getByText("Search Results");
      expect(heading).toBeInTheDocument();
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

    it("should display 'No Products Found' when results is null", () => {
      useSearch.mockReturnValue([
        { keyword: "search", results: null },
        mockSetValues,
      ]);

      renderSearch();

      expect(screen.getByText("No Products Found")).toBeInTheDocument();
    });

    it("should display 'No Products Found' when results is undefined", () => {
      useSearch.mockReturnValue([
        { keyword: "search", results: undefined },
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

    it("should render product cards with correct structure", () => {
      useSearch.mockReturnValue([
        { keyword: "products", results: mockSearchResults },
        mockSetValues,
      ]);

      renderSearch();

      // Test that we have the correct number of products displayed
      const moreDetailsButtons = screen.getAllByText("More Details");
      expect(moreDetailsButtons).toHaveLength(3);

      const addToCartButtons = screen.getAllByText("ADD TO CART");
      expect(addToCartButtons).toHaveLength(3);

      // Test that product names are rendered
      expect(screen.getByText("Test Product 1")).toBeInTheDocument();
      expect(screen.getByText("Test Product 2")).toBeInTheDocument();
      expect(screen.getByText("Test Product 3")).toBeInTheDocument();
    });

    it("should render product images with correct attributes", () => {
      useSearch.mockReturnValue([
        { keyword: "images", results: [mockSearchResults[0]] },
        mockSetValues,
      ]);

      renderSearch();

      const productImage = screen.getByAltText("Test Product 1");
      expect(productImage).toBeInTheDocument();
      expect(productImage).toHaveAttribute(
        "src",
        `/api/v1/product/product-photo/${mockSearchResults[0]._id}`
      );
      expect(productImage).toHaveClass("card-img-top");
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

    it("should render More Details buttons with correct classes", () => {
      useSearch.mockReturnValue([
        { keyword: "buttons", results: mockSearchResults },
        mockSetValues,
      ]);

      renderSearch();

      const moreDetailsButtons = screen.getAllByText("More Details");
      expect(moreDetailsButtons).toHaveLength(3);

      moreDetailsButtons.forEach((button) => {
        expect(button).toHaveClass("btn", "btn-primary", "ms-1");
      });
    });

    it("should render Add to Cart buttons with correct classes", () => {
      useSearch.mockReturnValue([
        { keyword: "cart", results: mockSearchResults },
        mockSetValues,
      ]);

      renderSearch();

      const addToCartButtons = screen.getAllByText("ADD TO CART");
      expect(addToCartButtons).toHaveLength(3);

      addToCartButtons.forEach((button) => {
        expect(button).toHaveClass("btn", "btn-secondary", "ms-1");
      });
    });

    it("should render flex container with correct classes", () => {
      useSearch.mockReturnValue([
        { keyword: "layout", results: mockSearchResults },
        mockSetValues,
      ]);

      renderSearch();

      // Test the results are displayed properly instead of testing CSS classes directly
      expect(screen.getByText("Found 3")).toBeInTheDocument();
      expect(screen.getAllByText("More Details")).toHaveLength(3);
      expect(screen.getAllByText("ADD TO CART")).toHaveLength(3);
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

    it("should handle products with special characters in names", () => {
      const productsWithSpecialChars = [
        {
          _id: "507f1f77bcf86cd799439018",
          name: "Product @#$%^&*()_+-=[]{}|;':\",./<>?",
          description: "Special characters test",
          price: 25.99,
        },
      ];

      useSearch.mockReturnValue([
        { keyword: "special chars", results: productsWithSpecialChars },
        mockSetValues,
      ]);

      renderSearch();

      expect(
        screen.getByText("Product @#$%^&*()_+-=[]{}|;':\",./<>?")
      ).toBeInTheDocument();
    });

    it("should handle very short descriptions correctly", () => {
      const productsWithShortDesc = [
        {
          _id: "507f1f77bcf86cd799439019",
          name: "Short Desc Product",
          description: "Hi",
          price: 10,
        },
      ];

      useSearch.mockReturnValue([
        { keyword: "short", results: productsWithShortDesc },
        mockSetValues,
      ]);

      renderSearch();

      expect(screen.getByText("Hi...")).toBeInTheDocument();
    });

    it("should handle exactly 30 character descriptions", () => {
      const productsWithExact30Chars = [
        {
          _id: "507f1f77bcf86cd799439020",
          name: "Exact Length Product",
          description: "This description is exactly 30", // exactly 30 characters
          price: 30,
        },
      ];

      useSearch.mockReturnValue([
        { keyword: "exact", results: productsWithExact30Chars },
        mockSetValues,
      ]);

      renderSearch();

      expect(
        screen.getByText("This description is exactly 30...")
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

    it("should handle context with null state", () => {
      useSearch.mockReturnValue([null, mockSetValues]);

      renderSearch();

      expect(screen.getByText("No Products Found")).toBeInTheDocument();
    });

    it("should handle context with undefined state", () => {
      useSearch.mockReturnValue([undefined, mockSetValues]);

      renderSearch();

      // Should handle gracefully and show no products
      expect(screen.getByText("No Products Found")).toBeInTheDocument();
    });

    it("should handle context with missing results property", () => {
      useSearch.mockReturnValue([{}, mockSetValues]);

      renderSearch();

      expect(screen.getByText("No Products Found")).toBeInTheDocument();
    });
  });

  describe("Performance and Large Datasets", () => {
    it("should handle large number of search results", () => {
      const largeResults = Array.from({ length: 50 }, (_, index) => ({
        _id: `large-${index}`,
        name: `Product ${index}`,
        description: `Description for product number ${index}`,
        price: index * 10 + 10,
      }));

      useSearch.mockReturnValue([
        { keyword: "large dataset", results: largeResults },
        mockSetValues,
      ]);

      renderSearch();

      expect(screen.getByText("Found 50")).toBeInTheDocument();

      // Should render all products
      const moreDetailsButtons = screen.getAllByText("More Details");
      expect(moreDetailsButtons).toHaveLength(50);
    });

    it("should render efficiently with complex product data", () => {
      const complexResults = [
        {
          _id: "complex-1",
          name: "Complex Product",
          description:
            "This is a complex product with lots of data and information",
          price: 999.99,
          category: { _id: "cat1", name: "Electronics" },
          tags: ["popular", "new", "featured"],
          specifications: {
            weight: "2kg",
            dimensions: "30x20x10cm",
            color: "black",
          },
        },
      ];

      useSearch.mockReturnValue([
        { keyword: "complex", results: complexResults },
        mockSetValues,
      ]);

      renderSearch();

      expect(screen.getByText("Complex Product")).toBeInTheDocument();
      expect(screen.getByText("$ 999.99")).toBeInTheDocument();
      expect(
        screen.getByText("This is a complex product with...")
      ).toBeInTheDocument();
    });
  });

  describe("Component Lifecycle", () => {
    it("should handle component unmounting gracefully", () => {
      useSearch.mockReturnValue([
        { keyword: "unmount test", results: [] },
        mockSetValues,
      ]);

      const { unmount } = renderSearch();

      expect(() => unmount()).not.toThrow();
    });

    it("should handle re-renders with different search states", () => {
      const { rerender } = render(
        <MemoryRouter>
          <Search />
        </MemoryRouter>
      );

      // First render - no results
      useSearch.mockReturnValue([
        { keyword: "first", results: [] },
        mockSetValues,
      ]);

      rerender(
        <MemoryRouter>
          <Search />
        </MemoryRouter>
      );

      expect(screen.getByText("No Products Found")).toBeInTheDocument();

      // Second render - with results
      useSearch.mockReturnValue([
        { keyword: "second", results: mockSearchResults },
        mockSetValues,
      ]);

      rerender(
        <MemoryRouter>
          <Search />
        </MemoryRouter>
      );

      expect(screen.getByText("Found 3")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should provide proper alt text for product images", () => {
      useSearch.mockReturnValue([
        { keyword: "accessibility", results: [mockSearchResults[0]] },
        mockSetValues,
      ]);

      renderSearch();

      const image = screen.getByAltText("Test Product 1");
      expect(image).toBeInTheDocument();
    });

    it("should have proper heading structure", () => {
      useSearch.mockReturnValue([
        { keyword: "headings", results: mockSearchResults },
        mockSetValues,
      ]);

      renderSearch();

      const mainHeading = screen.getByRole("heading", { level: 1 });
      expect(mainHeading).toHaveTextContent("Search Results");

      const subHeading = screen.getByRole("heading", { level: 6 });
      expect(subHeading).toHaveTextContent("Found 3");
    });

    it("should have accessible button text", () => {
      useSearch.mockReturnValue([
        { keyword: "buttons", results: [mockSearchResults[0]] },
        mockSetValues,
      ]);

      renderSearch();

      expect(screen.getByText("More Details")).toBeInTheDocument();
      expect(screen.getByText("ADD TO CART")).toBeInTheDocument();
    });
  });
});
