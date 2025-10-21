import { renderHook, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import useCategory from "./useCategory";

// Mock axios for controlled API responses (integration testing with mocked backend)
jest.mock("axios");
const mockedAxios = axios;

describe("useCategory Hook Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useCategory hook to API Integration Tests", () => {
    it("should make API call to correct endpoint", async () => {
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

      const { result } = renderHook(() => useCategory());

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          "/api/v1/category/get-category"
        );
        expect(result.current).toEqual(mockCategories);
      });
    });

    it("should handle successful API responses correctly", async () => {
      const mockCategories = [
        { _id: "1", name: "Electronics", slug: "electronics" },
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          success: true,
          categories: mockCategories,
        },
      });

      const { result } = renderHook(() => useCategory());

      await waitFor(() => {
        expect(result.current).toEqual(mockCategories);
        expect(Array.isArray(result.current)).toBe(true);
      });
    });

    it("should handle API errors gracefully", async () => {
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));

      const { result } = renderHook(() => useCategory());

      await waitFor(() => {
        // Should return empty array on error (as per hook implementation)
        expect(result.current).toEqual([]);
        expect(Array.isArray(result.current)).toBe(true);
      });

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});
