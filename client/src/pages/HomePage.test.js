import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HomePage from "../pages/HomePage";
import axios from "axios";
import { MemoryRouter, useNavigate, Routes, Route } from "react-router-dom";

jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()])
}));

jest.mock('../context/cart', () => ({
  useCart: jest.fn(() => [[], jest.fn()]),
  CartProvider: ({ children }) => children
}));

jest.mock('../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

const mockCategories = [{ _id: "1", name: "Books" }];
const mockProductsPage1 = [
  { _id: "p1", name: "Book A", price: 10, description: "desc", slug: "book-a" },
];
const mockProductsPage2 = [
  { _id: "p2", name: "Book B", price: 20, description: "desc", slug: "book-b" },
];
const mockFilteredProducts = [
  { _id: "fp1", name: "Filtered Book", price: 15, description: "desc", slug: "filtered" },
];

const renderHomePage = () => render(
  <MemoryRouter initialEntries={['/']}>
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  </MemoryRouter>
);

describe("HomePage Component Render Tests", () => {
  let mockNavigate;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.getItem.mockReturnValue(null);
    localStorage.setItem.mockImplementation(() => { });
    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
  });

  it("renders categories and initial products", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("category"))
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      if (url.includes("product-count"))
        return Promise.resolve({ data: { total: 1 } });
      if (url.includes("product-list/1"))
        return Promise.resolve({ data: { products: mockProductsPage1 } });
      return Promise.resolve({ data: {} });
    });

    renderHomePage();

    expect(await screen.findByText("All Products")).toBeInTheDocument();
    expect(await screen.findByText("Book A")).toBeInTheDocument();
    expect(await screen.findByLabelText("Books")).toBeInTheDocument();
  });

  it("handles API error gracefully when retrieving products", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("category"))
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      if (url.includes("product-count"))
        return Promise.resolve({ data: { total: 1 } });
      if (url.includes("product-list/1"))
        return Promise.reject(new Error("API fail"));
      return Promise.resolve({ data: {} });
    });

    renderHomePage();

    expect(await screen.findByText("All Products")).toBeInTheDocument();
  });

  it("handles API error gracefully when retrieving total product count", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("category"))
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      if (url.includes("product-count"))
        return Promise.reject(new Error("API fail"));
      if (url.includes("product-list/1"))
        return Promise.resolve({ data: { products: mockProductsPage1 } });
      return Promise.resolve({ data: {} });
    });

    renderHomePage();

    expect(await screen.findByText("Book A")).toBeInTheDocument();
  });

  it("paginates products correctly with 'Load More' button rendered", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("product-list/1"))
        return Promise.resolve({ data: { products: mockProductsPage1 } });
      if (url.includes("product-list/2"))
        return Promise.resolve({ data: { products: mockProductsPage2 } });
      if (url.includes("product-count"))
        return Promise.resolve({ data: { total: 2 } });
      if (url.includes("category"))
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      return Promise.resolve({ data: {} });
    });

    renderHomePage();

    fireEvent.click(await screen.findByText(/Loadmore/i));
    expect(await screen.findByText("Book B")).toBeInTheDocument();
  });

  it("does not render 'Load More' button when products length >= total", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("category"))
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      if (url.includes("product-count"))
        return Promise.resolve({ data: { total: 1 } });
      if (url.includes("product-list/1"))
        return Promise.resolve({
          data: {
            products:
              [...mockProductsPage1, ...mockProductsPage2]
          }
        });
      return Promise.resolve({ data: {} });
    });

    renderHomePage();

    expect(screen.queryByText(/Loadmore/i)).not.toBeInTheDocument();
  });

  it("handles API error in loadMore gracefully", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("category"))
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      if (url.includes("product-count"))
        return Promise.resolve({ data: { total: 2 } });
      if (url.includes("product-list/1"))
        return Promise.resolve({ data: { products: mockProductsPage1 } });
      if (url.includes("product-list/2"))
        return Promise.reject(new Error("API fail"));
      return Promise.resolve({ data: {} });
    });

    renderHomePage();

    const loadMoreBtn = await screen.findByText(/Loadmore/i);
    fireEvent.click(loadMoreBtn);

    // still shows first page products
    expect(await screen.findByText("Book A")).toBeInTheDocument();
  });

  it("successfully adds product to cart and stores it in localStorage", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("product-list/1"))
        return Promise.resolve({ data: { products: mockProductsPage1 } });
      if (url.includes("product-count"))
        return Promise.resolve({ data: { total: 1 } });
      if (url.includes("category"))
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      return Promise.resolve({ data: {} });
    });

    renderHomePage();

    const addButton = await screen.findByRole("button", { name: /add to cart/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "cart",
        expect.stringContaining("Book A")
      );
    });
  });

  it("renders an empty product list gracefully", async () => {
    axios.get.mockResolvedValue({
      data: {
        products: [],
        success: true, category: mockCategories
      }
    });

    renderHomePage();

    expect(screen.queryByText("Book A")).not.toBeInTheDocument();
    expect(screen.getByText("All Products")).toBeInTheDocument();
  });

  it("handles category API error gracefully", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("category"))
        return Promise.reject(new Error("Network error"));
      if (url.includes("product-count"))
        return Promise.resolve({ data: { total: 1 } });
      if (url.includes("product-list/1"))
        return Promise.resolve({ data: { products: mockProductsPage1 } });
      return Promise.resolve({ data: {} });
    });

    renderHomePage();

    expect(await screen.findByText("Book A")).toBeInTheDocument();
  });

  it("navigates to product details when 'More Details' button is clicked", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("product-list/1"))
        return Promise.resolve({ data: { products: mockProductsPage1 } });
      if (url.includes("product-count"))
        return Promise.resolve({ data: { total: 1 } });
      if (url.includes("category"))
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      return Promise.resolve({ data: {} });
    });

    renderHomePage();

    const detailsBtn = await screen.findByRole("button", { name: /more details/i });
    fireEvent.click(detailsBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/product/book-a");
  });

  it("does not navigate when 'More Details' button is clicked when slug is undefined", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("product-list/1"))
        return Promise.resolve({ data: { products: [{ ...mockProductsPage1[0], slug: undefined }] } });
      if (url.includes("product-count"))
        return Promise.resolve({ data: { total: 1 } });
      if (url.includes("category"))
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      return Promise.resolve({ data: {} });
    });

    renderHomePage();

    const detailsBtn = await screen.findByRole("button", { name: /more details/i });
    fireEvent.click(detailsBtn);

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe("HomePage Filter Specific Tests", () => {
  it("retrieves all products when no filters are selected", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("product-list/1"))
        return Promise.resolve({ data: { products: mockProductsPage1 } });
      return Promise.resolve({ data: {} });
    });

    renderHomePage();

    expect(await screen.findByText("Book A")).toBeInTheDocument();
  });

  it("applies category filter only and updates listed products", async () => {
    axios.get.mockResolvedValue({ data: { success: true, category: mockCategories } });
    axios.post.mockResolvedValue({ data: { products: mockFilteredProducts } });

    renderHomePage();

    const checkbox = await screen.findByLabelText("Books");
    fireEvent.click(checkbox);

    expect(await screen.findByText("Filtered Book")).toBeInTheDocument();
  });

  it("applies price filter only and updates listed products", async () => {
    axios.get.mockResolvedValue({ data: { success: true, category: mockCategories } });
    axios.post.mockResolvedValue({ data: { products: mockFilteredProducts } });

    renderHomePage();

    const radio = await screen.findByLabelText("$40 to 59");
    fireEvent.click(radio);

    expect(await screen.findByText("Filtered Book")).toBeInTheDocument();
  });

  it("resets filters on RESET FILTERS button click", async () => {
    axios.get.mockResolvedValue({ data: { success: true, category: mockCategories } });

    renderHomePage();

    const resetBtn = await screen.findByRole("button", { name: /reset filters/i });
    fireEvent.click(resetBtn);

    expect(resetBtn).toBeInTheDocument();
  });

  it("handles API error gracefully when filtering products", async () => {
    axios.get.mockResolvedValue({ data: { success: true, category: mockCategories } });
    axios.post.mockRejectedValue(new Error("Filter API fail"));

    renderHomePage();

    const checkbox = await screen.findByLabelText("Books");
    fireEvent.click(checkbox);

    expect(await screen.findByText("All Products")).toBeInTheDocument();
  });

  it("removes category filter when unchecked", async () => {
    axios.get.mockResolvedValue({ data: { success: true, category: mockCategories } });
    axios.post.mockResolvedValue({ data: { products: mockFilteredProducts } });

    renderHomePage();

    const checkbox = await screen.findByLabelText("Books");

    // check
    fireEvent.click(checkbox);
    expect(await screen.findByText("Filtered Book")).toBeInTheDocument();

    // uncheck
    fireEvent.click(checkbox);

    expect(await screen.findByText("All Products")).toBeInTheDocument();
  });

  it("applies both category and price filter", async () => {
    renderHomePage();

    const checkbox = await screen.findByLabelText("Books");
    fireEvent.click(checkbox);

    const radio = await screen.findByLabelText("$40 to 59");
    fireEvent.click(radio);

    expect(await screen.findByText("Filtered Book")).toBeInTheDocument();
  });
});
