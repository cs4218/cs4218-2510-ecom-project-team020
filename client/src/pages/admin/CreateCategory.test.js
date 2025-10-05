import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import "@testing-library/jest-dom/extend-expect";
import CreateCategory from "./CreateCategory";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("./../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" title={title}>{children}</div>
));
jest.mock("./../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Admin Menu</div>
));
jest.mock("../../components/Form/CategoryForm", () => ({ handleSubmit, value, setValue }) => (
  <form onSubmit={handleSubmit} data-testid="category-form">
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Enter category name"
      data-testid="category-input"
    />
    <button type="submit">Submit</button>
  </form>
));

const mockCategories = [
  { _id: "cat1", name: "Electronics" },
  { _id: "cat2", name: "Books" },
  { _id: "cat3", name: "Clothing" },
];

const renderCreateCategory = () => {
  return render(
    <MemoryRouter>
      <CreateCategory />
    </MemoryRouter>
  );
};

describe("CreateCategory Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({
      data: { success: true, categories: mockCategories }
    });
    axios.post.mockResolvedValue({
      data: { success: true, message: "Category created successfully" }
    });
    axios.put.mockResolvedValue({
      data: { success: true, message: "Category updated successfully" }
    });
    axios.delete.mockResolvedValue({
      data: { success: true, message: "Category deleted successfully" }
    });
  });

  describe("Component Initialization", () => {
    // Classification: Output-based (verifies DOM elements and attributes)
    it("should render with correct layout and title", () => {
      renderCreateCategory();

      expect(screen.getByTestId("layout")).toHaveAttribute("title", "Dashboard - Create Category");
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
      expect(screen.getByText("Manage Category")).toBeInTheDocument();
    });

    // Classification: Communication-based (verifies API call on mount)
    it("should fetch categories on component mount", async () => {
      renderCreateCategory();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      });
    });

    // Classification: Output-based (verifies rendered data from API response)
    it("should display categories in table", async () => {
      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
        expect(screen.getByText("Books")).toBeInTheDocument();
        expect(screen.getByText("Clothing")).toBeInTheDocument();
      });
    });

    // Classification: Communication-based (verifies error handling for API call)
    it("should handle category fetch error", async () => {
      axios.get.mockRejectedValue(new Error("Network error"));
      renderCreateCategory();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to load categories. Please refresh the page and try again.");
      });
    });
  });

  describe("Category Creation - Equivalence Partitioning", () => {
    describe("Valid Category Creation", () => {
      // Classification: Communication-based (verifies API call), Output-based (verifies toast message)
      // Technique: Equivalence Partitioning (valid category name class)
      it("should create category successfully with valid name", async () => {
        renderCreateCategory();

        await waitFor(() => {
          expect(screen.getByTestId("category-input")).toBeInTheDocument();
        });

        const categoryInput = screen.getByTestId("category-input");
        const submitButton = screen.getByRole("button", { name: "Submit" });

        fireEvent.change(categoryInput, { target: { value: "New Category" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", {
            name: "New Category"
          });
          expect(toast.success).toHaveBeenCalledWith('Category "New Category" created successfully');
        });
      });

      // Classification: Communication-based (verifies state refresh after creation)
      it("should clear form and refresh categories after successful creation", async () => {
        renderCreateCategory();

        await waitFor(() => {
          expect(screen.getByTestId("category-input")).toBeInTheDocument();
        });

        const categoryInput = screen.getByTestId("category-input");
        const submitButton = screen.getByRole("button", { name: "Submit" });

        fireEvent.change(categoryInput, { target: { value: "Test Category" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(axios.get).toHaveBeenCalledTimes(2); // Initial load + refresh after creation
        });
      });

      // Classification: Communication-based (verifies API call with special characters)
      // Technique: Equivalence Partitioning (special characters input class)
      it("should handle category names with special characters", async () => {
        renderCreateCategory();

        await waitFor(() => {
          expect(screen.getByTestId("category-input")).toBeInTheDocument();
        });

        const categoryInput = screen.getByTestId("category-input");
        const submitButton = screen.getByRole("button", { name: "Submit" });

        fireEvent.change(categoryInput, { target: { value: "Arts & Crafts" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", {
            name: "Arts & Crafts"
          });
        });
      });

      // Classification: Communication-based (verifies API call with alphanumeric input)
      // Technique: Equivalence Partitioning (alphanumeric input class)
      it("should handle category names with numbers", async () => {
        renderCreateCategory();

        await waitFor(() => {
          expect(screen.getByTestId("category-input")).toBeInTheDocument();
        });

        const categoryInput = screen.getByTestId("category-input");
        const submitButton = screen.getByRole("button", { name: "Submit" });

        fireEvent.change(categoryInput, { target: { value: "Category 123" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", {
            name: "Category 123"
          });
        });
      });
    });

    describe("Invalid Category Creation", () => {
      // Classification: Communication-based (verifies no API call made)
      // Technique: Boundary Value Analysis (empty input = 0 characters)
      it("should prevent submission with empty category name", async () => {
        renderCreateCategory();

        await waitFor(() => {
          expect(screen.getByTestId("category-input")).toBeInTheDocument();
        });

        const submitButton = screen.getByRole("button", { name: "Submit" });

        // Try to submit without entering any category name
        fireEvent.click(submitButton);

        // Should show validation error instead of making API call
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Category name is required");
        });
        expect(axios.post).not.toHaveBeenCalled();
      });

      // Classification: Communication-based (verifies no API call made)
      // Technique: Boundary Value Analysis (below minimum length = 1 character)
      it("should prevent submission with category name too short", async () => {
        renderCreateCategory();

        await waitFor(() => {
          expect(screen.getByTestId("category-input")).toBeInTheDocument();
        });

        const categoryInput = screen.getByTestId("category-input");
        const submitButton = screen.getByRole("button", { name: "Submit" });

        // Enter a single character (below minLength of 2)
        fireEvent.change(categoryInput, { target: { value: "A" } });
        fireEvent.click(submitButton);

        // Should show validation error instead of making API call
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Category name must be at least 2 characters long");
        });
        expect(axios.post).not.toHaveBeenCalled();
      });

      // Classification: Communication-based (verifies no API call made)
      // Technique: Boundary Value Analysis (above maximum length = 51 characters)
      it("should prevent submission with category name too long", async () => {
        renderCreateCategory();

        await waitFor(() => {
          expect(screen.getByTestId("category-input")).toBeInTheDocument();
        });

        const categoryInput = screen.getByTestId("category-input");
        const submitButton = screen.getByRole("button", { name: "Submit" });

        // Enter a string longer than maxLength of 50
        const longCategoryName = "A".repeat(51);
        fireEvent.change(categoryInput, { target: { value: longCategoryName } });
        fireEvent.click(submitButton);

        // Should show validation error instead of making API call
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Category name must not exceed 50 characters");
        });
        expect(axios.post).not.toHaveBeenCalled();
      });

      // Classification: Communication-based (verifies error handling for API failure)
      // Technique: Equivalence Partitioning (API error response class)
      it("should handle API error during creation", async () => {
        axios.post.mockRejectedValue(new Error("Creation failed"));
        renderCreateCategory();

        await waitFor(() => {
          expect(screen.getByTestId("category-input")).toBeInTheDocument();
        });

        const categoryInput = screen.getByTestId("category-input");
        const submitButton = screen.getByRole("button", { name: "Submit" });

        fireEvent.change(categoryInput, { target: { value: "Test Category" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Failed to create category. Please check your input and try again.");
        });
      });

      // Classification: Communication-based (verifies handling of unsuccessful API response)
      // Technique: Equivalence Partitioning (API success: false response class)
      it("should handle API response with success: false", async () => {
        axios.post.mockResolvedValue({
          data: { success: false, message: "Category already exists" }
        });
        renderCreateCategory();

        await waitFor(() => {
          expect(screen.getByTestId("category-input")).toBeInTheDocument();
        });

        const categoryInput = screen.getByTestId("category-input");
        const submitButton = screen.getByRole("button", { name: "Submit" });

        fireEvent.change(categoryInput, { target: { value: "Duplicate Category" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Category already exists");
        });
      });
    });
  });

  describe("Pairwise Combinatorial Testing - Category Operations", () => {
    // Technique: Pairwise Combinatorial - Test different input lengths with different character types
    it("should handle minimum length with special characters", async () => {
      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByTestId("category-input")).toBeInTheDocument();
      });

      const categoryInput = screen.getByTestId("category-input");
      const submitButton = screen.getByRole("button", { name: "Submit" });

      // Pairwise: minimum length (2) + special characters
      fireEvent.change(categoryInput, { target: { value: "A&" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", {
          name: "A&"
        });
      });
    });

    it("should handle maximum length with numbers", async () => {
      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByTestId("category-input")).toBeInTheDocument();
      });

      const categoryInput = screen.getByTestId("category-input");
      const submitButton = screen.getByRole("button", { name: "Submit" });

      // Pairwise: maximum length (50) + numbers
      const maxLengthWithNumbers = "Category123" + "A".repeat(39);
      fireEvent.change(categoryInput, { target: { value: maxLengthWithNumbers } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", {
          name: maxLengthWithNumbers
        });
      });
    });

    it("should handle medium length with mixed case", async () => {
      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByTestId("category-input")).toBeInTheDocument();
      });

      const categoryInput = screen.getByTestId("category-input");
      const submitButton = screen.getByRole("button", { name: "Submit" });

      // Pairwise: medium length + mixed case
      fireEvent.change(categoryInput, { target: { value: "MiXeD CaSe Category" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", {
          name: "MiXeD CaSe Category"
        });
      });
    });

    // Technique: Pairwise Combinatorial - Test API responses with different input types
    it("should handle API failure with special characters input", async () => {
      axios.post.mockRejectedValue(new Error("Network error"));
      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByTestId("category-input")).toBeInTheDocument();
      });

      const categoryInput = screen.getByTestId("category-input");
      const submitButton = screen.getByRole("button", { name: "Submit" });

      // Pairwise: special characters + API failure
      fireEvent.change(categoryInput, { target: { value: "Arts & Crafts" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to create category. Please check your input and try again.");
      });
    });

    it("should handle successful creation with whitespace", async () => {
      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByTestId("category-input")).toBeInTheDocument();
      });

      const categoryInput = screen.getByTestId("category-input");
      const submitButton = screen.getByRole("button", { name: "Submit" });

      // Pairwise: whitespace handling + success
      fireEvent.change(categoryInput, { target: { value: "  Spaced Category  " } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", {
          name: "  Spaced Category  "
        });
      });
    });
  });

  describe("Decision Tree Testing - Category Management Flow", () => {
    // Decision Tree: Test the complete flow from creation to update to deletion
    it("should follow decision tree - create then update flow", async () => {
      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByTestId("category-input")).toBeInTheDocument();
      });

      // Step 1: Create a category
      const categoryInput = screen.getByTestId("category-input");
      const submitButton = screen.getByRole("button", { name: "Submit" });

      fireEvent.change(categoryInput, { target: { value: "Decision Tree Test" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", {
          name: "Decision Tree Test"
        });
        expect(axios.get).toHaveBeenCalledTimes(2); // Initial + refresh after creation
      });

      // Step 2: Update the category (simulate by editing existing category)
      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const modalInputs = screen.getAllByTestId("category-input");
        expect(modalInputs).toHaveLength(2);
      });

      const modalInput = screen.getAllByTestId("category-input")[1];
      const modalSubmitButton = screen.getAllByRole("button", { name: "Submit" })[1];

      fireEvent.change(modalInput, { target: { value: "Updated Electronics" } });
      fireEvent.click(modalSubmitButton);

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalled();
      });
    });

    it("should follow decision tree - validation failure path", async () => {
      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByTestId("category-input")).toBeInTheDocument();
      });

      // Decision: Empty input -> should not proceed to API call
      const submitButton = screen.getByRole("button", { name: "Submit" });
      fireEvent.click(submitButton);

      // Should show validation error instead of making API call
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Category name is required");
      });
      expect(axios.post).not.toHaveBeenCalled();
    });

    it("should follow decision tree - API error recovery", async () => {
      // Setup API to fail first, then succeed
      let callCount = 0;
      axios.post.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error("Temporary failure"));
        }
        return Promise.resolve({
          data: { success: true, message: "Category created successfully" }
        });
      });

      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByTestId("category-input")).toBeInTheDocument();
      });

      const categoryInput = screen.getByTestId("category-input");
      const submitButton = screen.getByRole("button", { name: "Submit" });

      // First attempt - should fail
      fireEvent.change(categoryInput, { target: { value: "Recovery Test" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to create category. Please check your input and try again.");
      });

      // Second attempt - should succeed
      fireEvent.change(categoryInput, { target: { value: "Recovery Success" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Category "Recovery Success" created successfully');
      });
    });

    it("should follow decision tree - complete CRUD operations", async () => {
      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByTestId("category-input")).toBeInTheDocument();
      });

      // CREATE operation
      const categoryInput = screen.getByTestId("category-input");
      const submitButton = screen.getByRole("button", { name: "Submit" });

      fireEvent.change(categoryInput, { target: { value: "CRUD Test" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });

      // READ operation (verify categories are displayed)
      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
        expect(screen.getByText("Books")).toBeInTheDocument();
        expect(screen.getByText("Clothing")).toBeInTheDocument();
      });

      // UPDATE operation
      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const modalSubmitButton = screen.getAllByRole("button", { name: "Submit" })[1];
        fireEvent.click(modalSubmitButton);
      });

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalled();
      });

      // DELETE operation
      const deleteButtons = screen.getAllByText("Delete");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalled();
      });
    });

    it("should follow decision tree - different validation paths", async () => {
      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByTestId("category-input")).toBeInTheDocument();
      });

      const categoryInput = screen.getByTestId("category-input");
      const submitButton = screen.getByRole("button", { name: "Submit" });

      // Path 1: Too short -> validation fails
      fireEvent.change(categoryInput, { target: { value: "A" } });
      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Category name must be at least 2 characters long");
      });
      expect(axios.post).not.toHaveBeenCalled();

      // Path 2: Too long -> validation fails
      fireEvent.change(categoryInput, { target: { value: "A".repeat(51) } });
      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Category name must not exceed 50 characters");
      });
      expect(axios.post).not.toHaveBeenCalled();

      // Path 3: Valid input -> proceeds to API
      axios.post.mockResolvedValueOnce({ data: { success: true } });
      fireEvent.change(categoryInput, { target: { value: "Valid Category" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", {
          name: "Valid Category"
        });
      });
    });
  });

  describe("Category Update - Boundary Value Analysis", () => {
    // Classification: Output-based (verifies modal display), State-based (verifies UI state change)
    it("should open update modal when edit button is clicked", async () => {
      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const modalForm = screen.getAllByTestId("category-form");
        expect(modalForm).toHaveLength(2); // Main form + modal form
      });
    });

    // Classification: Communication-based (verifies PUT API call), Output-based (verifies success toast)
    it("should update category successfully", async () => {
      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const modalInputs = screen.getAllByTestId("category-input");
        expect(modalInputs).toHaveLength(2);
      });

      const modalInput = screen.getAllByTestId("category-input")[1]; // Modal input
      const modalSubmitButton = screen.getAllByRole("button", { name: "Submit" })[1];

      fireEvent.change(modalInput, { target: { value: "Updated Electronics" } });
      fireEvent.click(modalSubmitButton);

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          `/api/v1/category/update-category/${mockCategories[0]._id}`,
          { name: "Updated Electronics" }
        );
        expect(toast.success).toHaveBeenCalledWith('Category "Updated Electronics" updated successfully');
      });
    });

    it("should close modal and reset form after successful update", async () => {
      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const modalInputs = screen.getAllByTestId("category-input");
        expect(modalInputs).toHaveLength(2);
      });

      const modalSubmitButton = screen.getAllByRole("button", { name: "Submit" })[1];
      fireEvent.click(modalSubmitButton);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(2); // Initial + refresh after update
      });
    });

    it("should handle update error", async () => {
      axios.put.mockRejectedValue(new Error("Update failed"));
      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const modalSubmitButton = screen.getAllByRole("button", { name: "Submit" })[1];
        fireEvent.click(modalSubmitButton);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to update category. Please try again.");
      });
    });

    it("should handle API response with success: false for update", async () => {
      axios.put.mockResolvedValue({
        data: { success: false, message: "Update not allowed" }
      });
      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const modalSubmitButton = screen.getAllByRole("button", { name: "Submit" })[1];
        fireEvent.click(modalSubmitButton);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Update not allowed");
      });
    });
  });

  describe("Category Deletion", () => {
    // Classification: Communication-based (verifies DELETE API call), Output-based (verifies success toast)
    // State-based (verifies categories list refresh)
    it("should delete category successfully", async () => {
      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("Delete");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith(`/api/v1/category/delete-category/${mockCategories[0]._id}`);
        expect(toast.success).toHaveBeenCalledWith("Category deleted successfully");
        expect(axios.get).toHaveBeenCalledTimes(2); // Initial + refresh after deletion
      });
    });

    // Classification: Communication-based (verifies error handling for API failure)
    it("should handle deletion error", async () => {
      axios.delete.mockRejectedValue(new Error("Delete failed"));
      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("Delete");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to delete category. Please try again.");
      });
    });

    it("should handle API response with success: false for deletion", async () => {
      axios.delete.mockResolvedValue({
        data: { success: false, message: "Cannot delete category with products" }
      });
      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("Delete");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Cannot delete category with products");
      });
    });
  });

  describe("Table Structure and Display", () => {
    it("should render table with correct headers", async () => {
      renderCreateCategory();

      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Actions")).toBeInTheDocument();
    });

    it("should render all categories with edit and delete buttons", async () => {
      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
        expect(screen.getByText("Books")).toBeInTheDocument();
        expect(screen.getByText("Clothing")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText("Edit");
      const deleteButtons = screen.getAllByText("Delete");

      expect(editButtons).toHaveLength(3);
      expect(deleteButtons).toHaveLength(3);
    });

    it("should handle empty categories list", async () => {
      axios.get.mockResolvedValue({
        data: { success: true, categories: [] }
      });
      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByText("Name")).toBeInTheDocument();
        expect(screen.getByText("Actions")).toBeInTheDocument();
      });

      expect(screen.queryByText("Electronics")).not.toBeInTheDocument();
    });
  });

  describe("Form State Management", () => {
    it("should manage form state correctly during creation", async () => {
      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByTestId("category-input")).toBeInTheDocument();
      });

      const categoryInput = screen.getByTestId("category-input");

      fireEvent.change(categoryInput, { target: { value: "Test" } });
      fireEvent.change(categoryInput, { target: { value: "Test Category" } });

      expect(categoryInput.value).toBe("Test Category");
    });

    it("should populate update form with selected category", async () => {
      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const modalInputs = screen.getAllByTestId("category-input");
        expect(modalInputs[1].value).toBe("Electronics");
      });
    });
  });

  describe("Error Edge Cases", () => {
    it("should handle malformed category data", async () => {
      const malformedCategories = [
        { _id: "cat1", name: null },
        { _id: "cat2" }, // missing name
        { name: "No ID" }, // missing _id
      ];

      axios.get.mockResolvedValue({
        data: { success: true, categories: malformedCategories }
      });

      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByText("Name")).toBeInTheDocument();
      });
    });

    it("should handle network timeouts gracefully", async () => {
      axios.get.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout")), 100)
        )
      );

      renderCreateCategory();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to load categories. Please refresh the page and try again.");
      }, { timeout: 200 });
    });
  });

  describe("Accessibility", () => {
    it("should have proper table structure for screen readers", async () => {
      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByRole("table")).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "Actions" })).toBeInTheDocument();
      });
    });

    it("should have accessible buttons", async () => {
      renderCreateCategory();

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole("button", { name: "Edit" });
      const deleteButtons = screen.getAllByRole("button", { name: "Delete" });

      expect(editButtons).toHaveLength(3);
      expect(deleteButtons).toHaveLength(3);
    });
  });
});