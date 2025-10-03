import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import "@testing-library/jest-dom/extend-expect";
import UpdateProduct from "./UpdateProduct";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("./../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" title={title}>{children}</div>
));
jest.mock("./../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Admin Menu</div>
));

const mockNavigate = jest.fn();
const mockParams = { slug: "test-product-slug" };

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));

const mockCategories = [
  { _id: "cat1", name: "Electronics" },
  { _id: "cat2", name: "Books" },
  { _id: "cat3", name: "Clothing" },
];

const mockProduct = {
  _id: "prod1",
  name: "Test Product",
  description: "Test Description",
  price: 99.99,
  quantity: 10,
  shipping: true,
  category: { _id: "cat1", name: "Electronics" }
};

const renderUpdateProduct = () => {
  return render(
    <MemoryRouter>
      <UpdateProduct />
    </MemoryRouter>
  );
};

describe("UpdateProduct Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({ data: { success: true, categories: mockCategories } });
      }
      if (url.includes("/api/v1/product/get-product/")) {
        return Promise.resolve({ data: { product: mockProduct } });
      }
      return Promise.reject(new Error("Unknown URL"));
    });
    URL.createObjectURL = jest.fn(() => "mock-url");
    window.confirm = jest.fn();
  });

  describe("Component Initialization", () => {
    it("should render with correct layout and title", () => {
      renderUpdateProduct();

      expect(screen.getByTestId("layout")).toHaveAttribute("title", "Dashboard - Update Product");
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
      expect(screen.getByText("Update Product")).toBeInTheDocument();
    });

    it("should fetch product details and categories on mount", async () => {
      renderUpdateProduct();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(`/api/v1/product/get-product/${mockParams.slug}`);
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      });
    });

    it("should populate form fields with product data", async () => {
      renderUpdateProduct();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Test Description")).toBeInTheDocument();
        expect(screen.getByDisplayValue("99.99")).toBeInTheDocument();
        expect(screen.getByDisplayValue("10")).toBeInTheDocument();
      });
    });

    it("should handle product fetch error", async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes("/api/v1/product/get-product/")) {
          return Promise.reject(new Error("Product not found"));
        }
        return Promise.resolve({ data: { success: true, categories: mockCategories } });
      });

      renderUpdateProduct();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to load product details. Please try again.");
      });
    });

    it("should handle categories fetch error", async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes("/api/v1/category/get-category")) {
          return Promise.reject(new Error("Categories not found"));
        }
        return Promise.resolve({ data: { product: mockProduct } });
      });

      renderUpdateProduct();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to load categories. Please refresh the page and try again.");
      });
    });
  });

  describe("Form Elements Rendering", () => {
    it("should render all form inputs with correct attributes", async () => {
      renderUpdateProduct();

      await waitFor(() => {
        expect(screen.getByTestId("category-select")).toBeInTheDocument();
      });

      expect(screen.getByText("Upload Photo")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter product name")).toHaveAttribute("required");
      expect(screen.getByPlaceholderText("Enter product description")).toHaveAttribute("required");
      expect(screen.getByPlaceholderText("Enter price")).toHaveAttribute("required");
      expect(screen.getByPlaceholderText("Enter quantity")).toHaveAttribute("required");
      expect(screen.getByTestId("shipping-select")).toBeInTheDocument();
      expect(screen.getByText("UPDATE PRODUCT")).toBeInTheDocument();
      expect(screen.getByText("DELETE PRODUCT")).toBeInTheDocument();
    });

    it("should display existing product photo", async () => {
      renderUpdateProduct();

      await waitFor(() => {
        const productImage = screen.getByAltText("product_photo");
        expect(productImage).toBeInTheDocument();
        expect(productImage).toHaveAttribute("src", `/api/v1/product/product-photo/${mockProduct._id}`);
      });
    });

    it("should show new photo preview when file is uploaded", async () => {
      renderUpdateProduct();

      await waitFor(() => {
        expect(screen.getByAltText("product_photo")).toBeInTheDocument();
      });

      const fileInput = screen.getByTestId("photo-upload");
      const file = new File(["test"], "new-product.jpg", { type: "image/jpeg" });

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(screen.getByText("new-product.jpg")).toBeInTheDocument();
    });
  });

  describe("Form Validation - Boundary Value Analysis", () => {
    describe("Price Input Validation", () => {
      it("should accept minimum valid price (0)", async () => {
        renderUpdateProduct();

        await waitFor(() => {
          expect(screen.getByDisplayValue("99.99")).toBeInTheDocument();
        });

        const priceInput = screen.getByPlaceholderText("Enter price");
        fireEvent.change(priceInput, { target: { value: "0" } });
        expect(priceInput.validity.valid).toBe(true);
      });

      it("should accept decimal prices with step validation", async () => {
        renderUpdateProduct();

        await waitFor(() => {
          expect(screen.getByDisplayValue("99.99")).toBeInTheDocument();
        });

        const priceInput = screen.getByPlaceholderText("Enter price");
        fireEvent.change(priceInput, { target: { value: "199.99" } });
        expect(priceInput.validity.valid).toBe(true);
      });

      it("should invalidate negative prices", async () => {
        renderUpdateProduct();

        await waitFor(() => {
          expect(screen.getByDisplayValue("99.99")).toBeInTheDocument();
        });

        const priceInput = screen.getByPlaceholderText("Enter price");
        fireEvent.change(priceInput, { target: { value: "-10" } });
        expect(priceInput.validity.rangeUnderflow).toBe(true);
      });
    });

    describe("Quantity Input Validation", () => {
      it("should accept zero quantity", async () => {
        renderUpdateProduct();

        await waitFor(() => {
          expect(screen.getByDisplayValue("10")).toBeInTheDocument();
        });

        const quantityInput = screen.getByPlaceholderText("Enter quantity");
        fireEvent.change(quantityInput, { target: { value: "0" } });
        expect(quantityInput.validity.valid).toBe(true);
      });

      it("should accept large quantities", async () => {
        renderUpdateProduct();

        await waitFor(() => {
          expect(screen.getByDisplayValue("10")).toBeInTheDocument();
        });

        const quantityInput = screen.getByPlaceholderText("Enter quantity");
        fireEvent.change(quantityInput, { target: { value: "9999" } });
        expect(quantityInput.validity.valid).toBe(true);
      });

      it("should invalidate negative quantities", async () => {
        renderUpdateProduct();

        await waitFor(() => {
          expect(screen.getByDisplayValue("10")).toBeInTheDocument();
        });

        const quantityInput = screen.getByPlaceholderText("Enter quantity");
        fireEvent.change(quantityInput, { target: { value: "-5" } });
        expect(quantityInput.validity.rangeUnderflow).toBe(true);
      });
    });
  });

  describe("Form Updates - Equivalence Partitioning", () => {
    describe("Valid Update Cases", () => {
      it("should handle successful product update", async () => {
        axios.put.mockResolvedValue({ data: { success: true } });
        renderUpdateProduct();

        await waitFor(() => {
          expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
        });

        const nameInput = screen.getByPlaceholderText("Enter product name");
        fireEvent.change(nameInput, { target: { value: "Updated Product Name" } });

        fireEvent.click(screen.getByText("UPDATE PRODUCT"));

        await waitFor(() => {
          expect(axios.put).toHaveBeenCalledWith(
            `/api/v1/product/update-product/${mockProduct._id}`,
            expect.any(FormData)
          );
          expect(toast.success).toHaveBeenCalledWith("Product updated successfully");
          expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
        });
      });

      it("should update product with new photo", async () => {
        axios.put.mockResolvedValue({ data: { success: true } });
        renderUpdateProduct();

        await waitFor(() => {
          expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
        });

        const fileInput = screen.getByTestId("photo-upload");
        const file = new File(["test"], "updated.jpg", { type: "image/jpeg" });
        fireEvent.change(fileInput, { target: { files: [file] } });

        fireEvent.click(screen.getByText("UPDATE PRODUCT"));

        await waitFor(() => {
          expect(axios.put).toHaveBeenCalled();
          expect(toast.success).toHaveBeenCalledWith("Product updated successfully");
        });
      });

      it("should update product without changing photo", async () => {
        axios.put.mockResolvedValue({ data: { success: true } });
        renderUpdateProduct();

        await waitFor(() => {
          expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
        });

        const priceInput = screen.getByPlaceholderText("Enter price");
        fireEvent.change(priceInput, { target: { value: "149.99" } });

        fireEvent.click(screen.getByText("UPDATE PRODUCT"));

        await waitFor(() => {
          expect(axios.put).toHaveBeenCalled();
          expect(toast.success).toHaveBeenCalledWith("Product updated successfully");
        });
      });
    });

    describe("Invalid Update Cases", () => {
      it("should handle API error during update", async () => {
        axios.put.mockRejectedValue(new Error("Network error"));
        renderUpdateProduct();

        await waitFor(() => {
          expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("UPDATE PRODUCT"));

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Failed to update product. Please check your input and try again.");
        });
      });

      it("should handle API response with success: false", async () => {
        axios.put.mockResolvedValue({ 
          data: { success: false, message: "Update failed" }
        });
        renderUpdateProduct();

        await waitFor(() => {
          expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("UPDATE PRODUCT"));

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Update failed");
        });
      });
    });
  });

  describe("Product Deletion", () => {
    it("should confirm before deleting product", async () => {
      window.confirm.mockReturnValue(true);
      axios.delete.mockResolvedValue({ data: { success: true } });
      renderUpdateProduct();

      await waitFor(() => {
        expect(screen.getByText("DELETE PRODUCT")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("DELETE PRODUCT"));

      expect(window.confirm).toHaveBeenCalledWith(
        "Are you sure you want to delete this product? This action cannot be undone."
      );
    });

    it("should delete product when confirmed", async () => {
      window.confirm.mockReturnValue(true);
      axios.delete.mockResolvedValue({ data: { success: true } });
      renderUpdateProduct();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("DELETE PRODUCT"));

      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith(`/api/v1/product/delete-product/${mockProduct._id}`);
        expect(toast.success).toHaveBeenCalledWith("Product deleted successfully");
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
      });
    });

    it("should not delete product when cancelled", async () => {
      window.confirm.mockReturnValue(false);
      renderUpdateProduct();

      await waitFor(() => {
        expect(screen.getByText("DELETE PRODUCT")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("DELETE PRODUCT"));

      expect(window.confirm).toHaveBeenCalled();
      expect(axios.delete).not.toHaveBeenCalled();
    });

    it("should handle deletion error", async () => {
      window.confirm.mockReturnValue(true);
      axios.delete.mockRejectedValue(new Error("Delete failed"));
      renderUpdateProduct();

      await waitFor(() => {
        expect(screen.getByText("DELETE PRODUCT")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("DELETE PRODUCT"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to delete product. Please try again.");
      });
    });
  });

  describe("Shipping Selection", () => {
    it("should display correct shipping value for product with shipping", async () => {
      renderUpdateProduct();

      await waitFor(() => {
        const shippingSelect = screen.getByTestId("shipping-select");
        expect(shippingSelect).toBeInTheDocument();
      });
    });

    it("should handle product with no shipping", async () => {
      const productWithoutShipping = { ...mockProduct, shipping: false };
      axios.get.mockImplementation((url) => {
        if (url.includes("/api/v1/product/get-product/")) {
          return Promise.resolve({ data: { product: productWithoutShipping } });
        }
        return Promise.resolve({ data: { success: true, categories: mockCategories } });
      });

      renderUpdateProduct();

      await waitFor(() => {
        const shippingSelect = screen.getByTestId("shipping-select");
        expect(shippingSelect).toBeInTheDocument();
      });
    });
  });

  describe("Form Input Updates", () => {
    it("should update all form fields independently", async () => {
      renderUpdateProduct();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText("Enter product name");
      const descriptionInput = screen.getByPlaceholderText("Enter product description");
      const priceInput = screen.getByPlaceholderText("Enter price");
      const quantityInput = screen.getByPlaceholderText("Enter quantity");

      fireEvent.change(nameInput, { target: { value: "New Name" } });
      fireEvent.change(descriptionInput, { target: { value: "New Description" } });
      fireEvent.change(priceInput, { target: { value: "199.99" } });
      fireEvent.change(quantityInput, { target: { value: "20" } });

      expect(nameInput.value).toBe("New Name");
      expect(descriptionInput.value).toBe("New Description");
      expect(priceInput.value).toBe("199.99");
      expect(quantityInput.value).toBe("20");
    });
  });

  describe("Category Selection", () => {
    it("should pre-select product category", async () => {
      renderUpdateProduct();

      await waitFor(() => {
        expect(screen.getByTestId("category-select")).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling Edge Cases", () => {
    it("should handle malformed product data", async () => {
      const malformedProduct = {
        _id: "prod1",
        name: null,
        description: undefined,
        price: "invalid",
        category: null
      };

      axios.get.mockImplementation((url) => {
        if (url.includes("/api/v1/product/get-product/")) {
          return Promise.resolve({ data: { product: malformedProduct } });
        }
        return Promise.resolve({ data: { success: true, categories: mockCategories } });
      });

      renderUpdateProduct();

      await waitFor(() => {
        expect(screen.getByText("Update Product")).toBeInTheDocument();
      });
    });

    it("should handle empty categories list", async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes("/api/v1/category/get-category")) {
          return Promise.resolve({ data: { success: true, categories: [] } });
        }
        return Promise.resolve({ data: { product: mockProduct } });
      });

      renderUpdateProduct();

      await waitFor(() => {
        expect(screen.getByTestId("category-select")).toBeInTheDocument();
      });
    });
  });
});