import React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";
import Categories from "./Categories";

// Mock axios for controlled API responses (integration testing with mocked backend)
jest.mock("axios");
const mockedAxios = axios;

// Mock Layout component to focus on Categories component logic
jest.mock("../components/Layout", () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout">
        <h1>{title}</h1>
        {children}
      </div>
    );
  };
});

describe("Categories Component Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Categories Component to API Integration Tests", () => {
    it("should render categories when API returns data", async () => {
      const mockCategories = [
        { _id: "1", name: "Electronics", slug: "electronics" },
        { _id: "2", name: "Books", slug: "books" },
        { _id: "3", name: "Clothing", slug: "clothing" },
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          success: true,
          message: "All categories retrieved successfully",
          categories: mockCategories,
        },
      });

      render(
        <MemoryRouter>
          <Categories />
        </MemoryRouter>
      );

      // Wait for API call to complete and categories to render
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          "/api/v1/category/get-category"
        );
        expect(screen.getByText("Electronics")).toBeInTheDocument();
        expect(screen.getByText("Books")).toBeInTheDocument();
        expect(screen.getByText("Clothing")).toBeInTheDocument();
      });

      // Check that categories are rendered as links
      const electronicsLink = screen.getByRole("link", { name: "Electronics" });
      const booksLink = screen.getByRole("link", { name: "Books" });
      const clothingLink = screen.getByRole("link", { name: "Clothing" });

      expect(electronicsLink).toHaveAttribute("href", "/category/electronics");
      expect(booksLink).toHaveAttribute("href", "/category/books");
      expect(clothingLink).toHaveAttribute("href", "/category/clothing");
    });

    it("should render 'No categories found!' when API returns empty array", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          success: true,
          message: "All categories retrieved successfully",
          categories: [],
        },
      });

      render(
        <MemoryRouter>
          <Categories />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("No categories found!")).toBeInTheDocument();
      });

      // Should not have any category links
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("should handle API errors gracefully", async () => {
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));

      render(
        <MemoryRouter>
          <Categories />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("No categories found!")).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      consoleSpy.mockRestore();
    });

    it("should render with proper Bootstrap classes and structure", async () => {
      const mockCategories = [
        { _id: "1", name: "Electronics", slug: "electronics" },
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          success: true,
          categories: mockCategories,
        },
      });

      render(
        <MemoryRouter>
          <Categories />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      // Check Bootstrap classes are applied
      const container = document.querySelector(".container");
      const row = document.querySelector(".row");
      const col = document.querySelector(".col-md-6");

      expect(container).toBeInTheDocument();
      expect(row).toBeInTheDocument();
      expect(col).toBeInTheDocument();

      // Check button classes
      const button = screen.getByRole("link", { name: "Electronics" });
      expect(button).toHaveClass("btn", "btn-primary");
    });

    it("should render layout with correct title", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          success: true,
          categories: [],
        },
      });

      render(
        <MemoryRouter>
          <Categories />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("All Categories")).toBeInTheDocument();
      });
    });

    it("should handle multiple categories with proper grid layout", async () => {
      const mockCategories = [
        { _id: "1", name: "Electronics", slug: "electronics" },
        { _id: "2", name: "Books", slug: "books" },
        { _id: "3", name: "Clothing", slug: "clothing" },
        { _id: "4", name: "Sports", slug: "sports" },
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          success: true,
          categories: mockCategories,
        },
      });

      render(
        <MemoryRouter>
          <Categories />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
        expect(screen.getByText("Books")).toBeInTheDocument();
        expect(screen.getByText("Clothing")).toBeInTheDocument();
        expect(screen.getByText("Sports")).toBeInTheDocument();
      });

      // Check that all categories are rendered as links
      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(4);

      // Check grid structure
      const cols = document.querySelectorAll(".col-md-6");
      expect(cols).toHaveLength(4);
    });

    it("should handle API response with missing categories field", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          success: true,
          message: "All categories retrieved successfully",
          // categories field missing
        },
      });

      render(
        <MemoryRouter>
          <Categories />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("No categories found!")).toBeInTheDocument();
      });
    });

    it("should handle API response with null categories", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          success: true,
          message: "All categories retrieved successfully",
          categories: null,
        },
      });

      render(
        <MemoryRouter>
          <Categories />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("No categories found!")).toBeInTheDocument();
      });
    });
  });

  describe("Complete Frontend Integration Flow", () => {
    it("should handle complete category display flow", async () => {
      const mockCategories = [
        { _id: "1", name: "Electronics", slug: "electronics" },
        { _id: "2", name: "Books", slug: "books" },
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          success: true,
          message: "All categories retrieved successfully",
          categories: mockCategories,
        },
      });

      render(
        <MemoryRouter>
          <Categories />
        </MemoryRouter>
      );

      // Test complete flow: API call → data processing → rendering
      await waitFor(() => {
        // Verify API was called
        expect(mockedAxios.get).toHaveBeenCalledWith(
          "/api/v1/category/get-category"
        );

        // Verify data was processed and rendered
        expect(screen.getByText("Electronics")).toBeInTheDocument();
        expect(screen.getByText("Books")).toBeInTheDocument();

        // Verify links are properly formatted
        expect(
          screen.getByRole("link", { name: "Electronics" })
        ).toHaveAttribute("href", "/category/electronics");
        expect(screen.getByRole("link", { name: "Books" })).toHaveAttribute(
          "href",
          "/category/books"
        );
      });
    });

    it("should handle performance with large category list", async () => {
      const mockCategories = Array.from({ length: 20 }, (_, i) => ({
        _id: `${i + 1}`,
        name: `Category ${i + 1}`,
        slug: `category-${i + 1}`,
      }));

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          success: true,
          categories: mockCategories,
        },
      });

      const startTime = Date.now();

      render(
        <MemoryRouter>
          <Categories />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Category 1")).toBeInTheDocument();
        expect(screen.getByText("Category 20")).toBeInTheDocument();
      });

      const endTime = Date.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 2 seconds for mocked API)
      expect(renderTime).toBeLessThan(2000);
    });
  });
});
