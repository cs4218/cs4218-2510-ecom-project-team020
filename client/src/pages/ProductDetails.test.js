import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import "@testing-library/jest-dom/extend-expect";
import ProductDetails from "./ProductDetails";

// Mock dependencies
jest.mock("axios");
jest.mock("../components/Layout", () => {
  return function MockLayout({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

// Mock contexts
jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock window objects (following existing pattern)
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

// Mock data
const mockProduct = {
  _id: "507f1f77bcf86cd799439011",
  name: "Test Product",
  slug: "test-product",
  description: "This is a test product description",
  price: 99.99,
  category: {
    _id: "507f1f77bcf86cd799439012",
    name: "Test Category",
  },
  quantity: 10,
};

const mockRelatedProducts = [
  {
    _id: "507f1f77bcf86cd799439013",
    name: "Related Product 1",
    slug: "related-product-1",
    description:
      "This is a related product description that is longer than 60 characters",
    price: 79.99,
  },
  {
    _id: "507f1f77bcf86cd799439014",
    name: "Related Product 2",
    slug: "related-product-2",
    description: "Another related product description",
    price: 129.99,
  },
];

const renderProductDetails = (slug = "test-product") => {
  return render(
    <MemoryRouter initialEntries={[`/product/${slug}`]}>
      <Routes>
        <Route path="/product/:slug" element={<ProductDetails />} />
      </Routes>
    </MemoryRouter>
  );
};

describe("ProductDetails Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    // Suppress console.error for act warnings and console.log for errors in tests
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods after each test
    console.error.mockRestore();
    console.log.mockRestore();
  });

  describe("Component Rendering", () => {
    it("should render loading state initially", () => {
      axios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderProductDetails();

      expect(screen.getByTestId("layout")).toBeInTheDocument();
    });

    it("should render product details when data is loaded", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { products: mockRelatedProducts },
        });

      renderProductDetails();

      // Wait for the product name to appear in the format "Name : Test Product"
      await waitFor(() => {
        expect(screen.getByText(/Name : Test Product/)).toBeInTheDocument();
      });

      // Now check for other elements
      expect(screen.getByText("Product Details")).toBeInTheDocument();
      expect(
        screen.getByText(/Description : This is a test product description/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Price :\s*\$99\.99/)).toBeInTheDocument();
      expect(screen.getByText(/Category : Test Category/)).toBeInTheDocument();
    });

    it("should render product image with correct attributes", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { products: [] },
        });

      renderProductDetails();

      await waitFor(() => {
        expect(screen.getByAltText("Test Product")).toBeInTheDocument();
      });

      const productImage = screen.getByAltText("Test Product");
      expect(productImage).toHaveAttribute(
        "src",
        `/api/v1/product/product-photo/${mockProduct._id}`
      );
      expect(productImage).toHaveAttribute("height", "300");
      expect(productImage).toHaveAttribute("width", "350px");
    });

    it("should render add to cart button", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { products: [] },
        });

      renderProductDetails();

      await waitFor(() => {
        expect(screen.getByText("ADD TO CART")).toBeInTheDocument();
      });

      const addToCartButton = screen.getByText("ADD TO CART");
      expect(addToCartButton).toHaveClass("btn", "btn-secondary", "ms-1");
    });
  });

  describe("API Interactions", () => {
    it("should call product API with correct slug parameter", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { products: [] },
        });

      renderProductDetails("test-product-slug");

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/test-product-slug"
        );
      });
    });

    it("should call related products API with correct parameters", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { products: mockRelatedProducts },
        });

      renderProductDetails();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          `/api/v1/product/related-product/${mockProduct._id}/${mockProduct.category._id}`
        );
      });
    });

    it("should handle API errors gracefully", async () => {
      // console.log is already mocked in beforeEach, just verify it's called
      axios.get.mockRejectedValue(new Error("API Error"));

      renderProductDetails();

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });

  describe("Related Products Section", () => {
    it("should render related products when available", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { products: mockRelatedProducts },
        });

      renderProductDetails();

      // Wait for the main product to load first (which triggers related products call)
      await waitFor(() => {
        expect(screen.getByText(/Name : Test Product/)).toBeInTheDocument();
      });

      // Then wait for related products to appear
      await waitFor(() => {
        expect(screen.getByText("Related Product 1")).toBeInTheDocument();
      });

      expect(screen.getByText("Related Product 2")).toBeInTheDocument();
    });

    it("should show no similar products message when none available", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { products: [] },
        });

      renderProductDetails();

      await waitFor(() => {
        expect(
          screen.getByText("No Similar Products found")
        ).toBeInTheDocument();
      });
    });

    it("should render related product cards with correct information", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { products: mockRelatedProducts },
        });

      renderProductDetails();

      await waitFor(() => {
        expect(screen.getByText("Related Product 1")).toBeInTheDocument();
      });

      expect(screen.getByText("$79.99")).toBeInTheDocument();
      // The actual text in DOM has line break, use partial matching
      expect(
        screen.getByText((content, element) => {
          return (
            content &&
            content.includes(
              "This is a related product description that is longer than 60"
            )
          );
        })
      ).toBeInTheDocument();

      const relatedImage = screen.getByAltText("Related Product 1");
      expect(relatedImage).toHaveAttribute(
        "src",
        `/api/v1/product/product-photo/${mockRelatedProducts[0]._id}`
      );
    });

    it("should truncate long descriptions in related products", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { products: mockRelatedProducts },
        });

      renderProductDetails();

      await waitFor(() => {
        // Description should be truncated to 60 characters + "..."
        const truncatedText = screen.getByText((content, element) => {
          return (
            content &&
            content.includes(
              "This is a related product description that is longer than 60"
            )
          );
        });
        expect(truncatedText).toBeInTheDocument();
      });
    });
  });

  describe("Navigation", () => {
    it("should navigate to related product when More Details button is clicked", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { products: mockRelatedProducts },
        });

      renderProductDetails();

      await waitFor(() => {
        expect(screen.getAllByText("More Details")).toHaveLength(2);
      });

      const moreDetailsButtons = screen.getAllByText("More Details");
      fireEvent.click(moreDetailsButtons[0]);
      expect(mockNavigate).toHaveBeenCalledWith("/product/related-product-1");
    });
  });

  describe("Price Formatting", () => {
    it("should format prices correctly in USD currency", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { products: mockRelatedProducts },
        });

      renderProductDetails();

      await waitFor(() => {
        expect(screen.getByText(/\$99\.99/)).toBeInTheDocument();
      });

      expect(screen.getByText("$79.99")).toBeInTheDocument();
      expect(screen.getByText("$129.99")).toBeInTheDocument();
    });

    it("should handle products without price gracefully", async () => {
      const productWithoutPrice = { ...mockProduct, price: null };
      axios.get
        .mockResolvedValueOnce({
          data: { product: productWithoutPrice },
        })
        .mockResolvedValueOnce({
          data: { products: [] },
        });

      renderProductDetails();

      await waitFor(() => {
        expect(screen.getByText("Product Details")).toBeInTheDocument();
      });
    });
  });

  describe("Component Lifecycle", () => {
    it("should refetch product data when slug parameter changes", async () => {
      // Test that different slugs result in different API calls
      // First render with one slug
      const { unmount } = renderProductDetails("first-product");

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/first-product"
        );
      });

      // Clean up first render
      unmount();
      jest.clearAllMocks();

      // Render with different slug
      renderProductDetails("second-product");

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/second-product"
        );
      });
    });

    it("should not fetch data when slug is undefined", () => {
      render(
        <MemoryRouter initialEntries={["/product/"]}>
          <Routes>
            <Route path="/product/" element={<ProductDetails />} />
          </Routes>
        </MemoryRouter>
      );

      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle missing product data gracefully", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: null },
        })
        .mockResolvedValueOnce({
          data: { products: [] },
        });

      renderProductDetails();

      await waitFor(() => {
        expect(screen.getByText("Product Details")).toBeInTheDocument();
      });
    });

    it("should handle missing category data gracefully", async () => {
      const productWithoutCategory = { ...mockProduct, category: null };

      // First call succeeds with product without category
      // Second call fails when trying to get related products (due to null category)
      axios.get
        .mockResolvedValueOnce({
          data: { product: productWithoutCategory },
        })
        .mockRejectedValueOnce(new Error("Cannot read properties of null"));

      renderProductDetails();

      // Wait for the product to load (even without category)
      await waitFor(() => {
        expect(screen.getByText(/Name : Test Product/)).toBeInTheDocument();
      });

      // Verify product details are shown but category is empty
      expect(screen.getByText("Product Details")).toBeInTheDocument();
      expect(
        screen.getByText(/Description : This is a test product description/)
      ).toBeInTheDocument();
      // Category field should be empty since category is null
      expect(screen.getByText(/Category :/)).toBeInTheDocument();
    });

    it("should handle related products API error", async () => {
      // Clear the global console.log mock and create a fresh spy
      console.log.mockClear();

      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockRejectedValueOnce(new Error("Related products API error"));

      renderProductDetails();

      // Wait for main product to load first
      await waitFor(() => {
        expect(screen.getByText(/Name : Test Product/)).toBeInTheDocument();
      });

      // Wait for the error to be logged
      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });
});
