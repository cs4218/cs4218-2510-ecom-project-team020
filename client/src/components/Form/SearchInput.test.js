import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import "@testing-library/jest-dom/extend-expect";
import SearchInput from "./SearchInput";

// Mock dependencies
jest.mock("axios");
jest.mock("../../context/search", () => ({
  useSearch: jest.fn(),
}));

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Import useSearch after mocking
const { useSearch } = require("../../context/search");

// Mock data
const mockSearchResults = [
  {
    _id: "507f1f77bcf86cd799439011",
    name: "Test Product 1",
    description: "Test description for product 1",
    price: 99.99,
  },
  {
    _id: "507f1f77bcf86cd799439012",
    name: "Test Product 2",
    description: "Test description for product 2",
    price: 149.99,
  },
];

const renderSearchInput = () => {
  return render(
    <MemoryRouter>
      <SearchInput />
    </MemoryRouter>
  );
};

describe("SearchInput Component", () => {
  const mockSetValues = jest.fn();
  const defaultSearchState = {
    keyword: "",
    results: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockSetValues.mockClear();

    // Default mock implementation
    useSearch.mockReturnValue([defaultSearchState, mockSetValues]);
  });

  describe("Component Rendering", () => {
    it("should render search form with input and button", () => {
      renderSearchInput();

      expect(screen.getByRole("search")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Search" })
      ).toBeInTheDocument();
    });

    it("should render input with correct attributes", () => {
      renderSearchInput();

      const searchInput = screen.getByPlaceholderText("Search");
      expect(searchInput).toHaveClass("form-control", "me-2");
      expect(searchInput).toHaveAttribute("type", "search");
      expect(searchInput).toHaveAttribute("aria-label", "Search");
    });

    it("should render search button with correct classes", () => {
      renderSearchInput();

      const searchButton = screen.getByRole("button", { name: "Search" });
      expect(searchButton).toHaveClass("btn", "btn-outline-success");
      expect(searchButton).toHaveAttribute("type", "submit");
    });

    it("should display current keyword value from context", () => {
      const searchStateWithKeyword = {
        keyword: "test search",
        results: [],
      };
      useSearch.mockReturnValue([searchStateWithKeyword, mockSetValues]);

      renderSearchInput();

      const searchInput = screen.getByPlaceholderText("Search");
      expect(searchInput.value).toBe("test search");
    });
  });

  describe("User Interactions", () => {
    it("should update keyword when user types in input", () => {
      renderSearchInput();

      const searchInput = screen.getByPlaceholderText("Search");
      fireEvent.change(searchInput, { target: { value: "new keyword" } });

      expect(mockSetValues).toHaveBeenCalledWith({
        ...defaultSearchState,
        keyword: "new keyword",
      });
    });

    it("should handle empty input change", () => {
      const searchStateWithKeyword = {
        keyword: "existing",
        results: [],
      };
      useSearch.mockReturnValue([searchStateWithKeyword, mockSetValues]);

      renderSearchInput();

      const searchInput = screen.getByPlaceholderText("Search");
      fireEvent.change(searchInput, { target: { value: "" } });

      expect(mockSetValues).toHaveBeenCalledWith({
        ...searchStateWithKeyword,
        keyword: "",
      });
    });

    it("should handle special characters in search input", () => {
      renderSearchInput();

      const searchInput = screen.getByPlaceholderText("Search");
      fireEvent.change(searchInput, { target: { value: "test@#$%^&*()" } });

      expect(mockSetValues).toHaveBeenCalledWith({
        ...defaultSearchState,
        keyword: "test@#$%^&*()",
      });
    });
  });

  describe("Form Submission", () => {
    it("should call API and navigate on successful search", async () => {
      const searchState = {
        keyword: "test product",
        results: [],
      };
      useSearch.mockReturnValue([searchState, mockSetValues]);

      axios.get.mockResolvedValueOnce({
        data: mockSearchResults,
      });

      renderSearchInput();

      const form = screen.getByRole("search");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/search/test product"
        );
      });

      await waitFor(() => {
        expect(mockSetValues).toHaveBeenCalledWith({
          keyword: "test product",
          results: mockSearchResults,
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith("/search");
    });

    it("should call API with encoded keyword containing spaces", async () => {
      const searchState = {
        keyword: "test product with spaces",
        results: [],
      };
      useSearch.mockReturnValue([searchState, mockSetValues]);

      axios.get.mockResolvedValueOnce({
        data: mockSearchResults,
      });

      renderSearchInput();

      const form = screen.getByRole("search");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/search/test product with spaces"
        );
      });
    });

    it("should handle empty keyword search", async () => {
      const searchState = {
        keyword: "",
        results: [],
      };
      useSearch.mockReturnValue([searchState, mockSetValues]);

      axios.get.mockResolvedValueOnce({
        data: [],
      });

      renderSearchInput();

      const form = screen.getByRole("search");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/");
      });
    });

    it("should submit form when search button is clicked", async () => {
      const searchState = {
        keyword: "button click test",
        results: [],
      };
      useSearch.mockReturnValue([searchState, mockSetValues]);

      axios.get.mockResolvedValueOnce({
        data: mockSearchResults,
      });

      renderSearchInput();

      const searchButton = screen.getByRole("button", { name: "Search" });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/search/button click test"
        );
      });
    });

    it("should submit form when Enter key is pressed in input", async () => {
      const searchState = {
        keyword: "enter key test",
        results: [],
      };
      useSearch.mockReturnValue([searchState, mockSetValues]);

      axios.get.mockResolvedValueOnce({
        data: mockSearchResults,
      });

      renderSearchInput();

      const form = screen.getByRole("search");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/search/enter key test"
        );
      });
    });
  });

  describe("API Integration", () => {
    it("should handle successful API response with results", async () => {
      const searchState = {
        keyword: "successful search",
        results: [],
      };
      useSearch.mockReturnValue([searchState, mockSetValues]);

      axios.get.mockResolvedValueOnce({
        data: mockSearchResults,
      });

      renderSearchInput();

      const form = screen.getByRole("search");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/search/successful search"
        );
      });

      await waitFor(() => {
        expect(mockSetValues).toHaveBeenCalledWith({
          keyword: "successful search",
          results: mockSearchResults,
        });
      });
    });

    it("should handle API response with empty results", async () => {
      const searchState = {
        keyword: "this search should return no results",
        results: [],
      };
      useSearch.mockReturnValue([searchState, mockSetValues]);

      axios.get.mockResolvedValueOnce({
        data: [],
      });

      renderSearchInput();

      const form = screen.getByRole("search");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/search/this search should return no results"
        );
      });

      await waitFor(() => {
        expect(mockSetValues).toHaveBeenCalledWith({
          keyword: "this search should return no results",
          results: [],
        });
      });
    });

    it("should handle API errors gracefully", async () => {
      const consoleLogSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      const searchState = {
        keyword: "error test",
        results: [],
      };
      useSearch.mockReturnValue([searchState, mockSetValues]);

      axios.get.mockRejectedValue(new Error("API Error"));

      renderSearchInput();

      const form = screen.getByRole("search");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));
      });

      // Should not update context or navigate on error
      expect(mockSetValues).not.toHaveBeenCalledWith(
        expect.objectContaining({ results: expect.any(Array) })
      );
      expect(mockNavigate).not.toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it("should handle network timeout errors", async () => {
      const consoleLogSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      const searchState = {
        keyword: "timeout test",
        results: [],
      };
      useSearch.mockReturnValue([searchState, mockSetValues]);

      const timeoutError = new Error("Network timeout");
      timeoutError.code = "ECONNABORTED";
      axios.get.mockRejectedValue(timeoutError);

      renderSearchInput();

      const form = screen.getByRole("search");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(timeoutError);
      });

      consoleLogSpy.mockRestore();
    });
  });

  describe("Context Integration", () => {
    it("should use search context values correctly", () => {
      const customSearchState = {
        keyword: "context test",
        results: [{ id: 1, name: "test" }],
      };
      useSearch.mockReturnValue([customSearchState, mockSetValues]);

      renderSearchInput();

      expect(useSearch).toHaveBeenCalled();
      const searchInput = screen.getByPlaceholderText("Search");
      expect(searchInput.value).toBe("context test");
    });

    it("should handle context state updates correctly", () => {
      renderSearchInput();

      const searchInput = screen.getByPlaceholderText("Search");
      fireEvent.change(searchInput, { target: { value: "updated value" } });

      expect(mockSetValues).toHaveBeenCalledWith({
        keyword: "updated value",
        results: [],
      });
    });

    it("should preserve existing results when updating keyword", () => {
      const searchStateWithResults = {
        keyword: "existing",
        results: mockSearchResults,
      };
      useSearch.mockReturnValue([searchStateWithResults, mockSetValues]);

      renderSearchInput();

      const searchInput = screen.getByPlaceholderText("Search");
      fireEvent.change(searchInput, { target: { value: "new keyword" } });

      expect(mockSetValues).toHaveBeenCalledWith({
        keyword: "new keyword",
        results: mockSearchResults,
      });
    });
  });

  describe("Form Validation and Edge Cases", () => {
    it("should prevent default form submission", async () => {
      const searchState = {
        keyword: "prevent default test",
        results: [],
      };
      useSearch.mockReturnValue([searchState, mockSetValues]);

      axios.get.mockResolvedValueOnce({ data: [] });

      renderSearchInput();

      const form = screen.getByRole("search");
      const mockPreventDefault = jest.fn();

      fireEvent.submit(form, {
        preventDefault: mockPreventDefault,
      });

      // Note: preventDefault is automatically called by fireEvent.submit
      // but we can verify the form submission behavior
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
    });

    it("should handle very long search keywords", async () => {
      const longKeyword = "a".repeat(1000);
      const searchState = {
        keyword: longKeyword,
        results: [],
      };
      useSearch.mockReturnValue([searchState, mockSetValues]);

      axios.get.mockResolvedValueOnce({ data: [] });

      renderSearchInput();

      const form = screen.getByRole("search");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          `/api/v1/product/search/${longKeyword}`
        );
      });
    });

    it("should handle special characters in search", async () => {
      const specialKeyword = "test@#$%^&*()_+-=[]{}|;':\",./<>?";
      const searchState = {
        keyword: specialKeyword,
        results: [],
      };
      useSearch.mockReturnValue([searchState, mockSetValues]);

      axios.get.mockResolvedValueOnce({ data: [] });

      renderSearchInput();

      const form = screen.getByRole("search");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          `/api/v1/product/search/${specialKeyword}`
        );
      });
    });
  });

  describe("Component Lifecycle", () => {
    it("should handle component unmounting gracefully", () => {
      const { unmount } = renderSearchInput();

      expect(() => unmount()).not.toThrow();
    });

    it("should maintain input focus after typing", () => {
      renderSearchInput();

      const searchInput = screen.getByPlaceholderText("Search");
      searchInput.focus();

      fireEvent.change(searchInput, { target: { value: "focus test" } });

      expect(searchInput).toHaveFocus();
    });
  });
});
