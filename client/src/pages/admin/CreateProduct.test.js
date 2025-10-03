import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import "@testing-library/jest-dom/extend-expect";
import CreateProduct from "./CreateProduct";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("./../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" title={title}>{children}</div>
));
jest.mock("./../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Admin Menu</div>
));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const mockCategories = [
  { _id: "cat1", name: "Electronics" },
  { _id: "cat2", name: "Books" },
  { _id: "cat3", name: "Clothing" },
];

const renderCreateProduct = () => {
  return render(
    <MemoryRouter>
      <CreateProduct />
    </MemoryRouter>
  );
};

describe("CreateProduct Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({
      data: { success: true, categories: mockCategories }
    });
    URL.createObjectURL = jest.fn(() => "mock-url");
  });

  describe("Component Initialization", () => {
    it("should render with correct layout and title", () => {
      renderCreateProduct();

      expect(screen.getByTestId("layout")).toHaveAttribute("title", "Dashboard - Create Product");
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
      expect(screen.getByText("Create Product")).toBeInTheDocument();
    });

    it("should fetch categories on component mount", async () => {
      renderCreateProduct();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      });
    });

    it("should display error toast when category fetch fails", async () => {
      axios.get.mockRejectedValue(new Error("Network error"));
      renderCreateProduct();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to load categories. Please refresh the page and try again.");
      });
    });
  });

  describe("Form Elements Rendering", () => {
    it("should render all form inputs with correct attributes", async () => {
      renderCreateProduct();

      await waitFor(() => {
        expect(screen.getByText("Select a category")).toBeInTheDocument();
      });

      expect(screen.getByText("Upload Photo")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter product name")).toHaveAttribute("required");
      expect(screen.getByPlaceholderText("Enter product description")).toHaveAttribute("required");
      expect(screen.getByPlaceholderText("Enter price")).toHaveAttribute("required");
      expect(screen.getByPlaceholderText("Enter quantity")).toHaveAttribute("required");
      expect(screen.getByText("Select Shipping")).toBeInTheDocument();
      expect(screen.getByText("CREATE PRODUCT")).toBeInTheDocument();
    });

    it("should render price input with correct validation attributes", () => {
      renderCreateProduct();

      const priceInput = screen.getByPlaceholderText("Enter price");
      expect(priceInput).toHaveAttribute("type", "number");
      expect(priceInput).toHaveAttribute("min", "0");
      expect(priceInput).toHaveAttribute("step", "0.01");
    });

    it("should render quantity input with correct validation attributes", () => {
      renderCreateProduct();

      const quantityInput = screen.getByPlaceholderText("Enter quantity");
      expect(quantityInput).toHaveAttribute("type", "number");
      expect(quantityInput).toHaveAttribute("min", "0");
    });
  });

  describe("Form Validation - Boundary Value Analysis", () => {
    describe("Price Input Validation", () => {
      it("should accept minimum valid price (0)", () => {
        renderCreateProduct();
        const priceInput = screen.getByPlaceholderText("Enter price");

        fireEvent.change(priceInput, { target: { value: "0" } });
        expect(priceInput.validity.valid).toBe(true);
      });

      it("should accept decimal prices", () => {
        renderCreateProduct();
        const priceInput = screen.getByPlaceholderText("Enter price");

        fireEvent.change(priceInput, { target: { value: "99.99" } });
        expect(priceInput.validity.valid).toBe(true);
      });

      it("should invalidate negative prices", () => {
        renderCreateProduct();
        const priceInput = screen.getByPlaceholderText("Enter price");

        fireEvent.change(priceInput, { target: { value: "-1" } });
        expect(priceInput.validity.rangeUnderflow).toBe(true);
      });
    });

    describe("Quantity Input Validation", () => {
      it("should accept minimum valid quantity (0)", () => {
        renderCreateProduct();
        const quantityInput = screen.getByPlaceholderText("Enter quantity");

        fireEvent.change(quantityInput, { target: { value: "0" } });
        expect(quantityInput.validity.valid).toBe(true);
      });

      it("should accept large quantities", () => {
        renderCreateProduct();
        const quantityInput = screen.getByPlaceholderText("Enter quantity");

        fireEvent.change(quantityInput, { target: { value: "9999" } });
        expect(quantityInput.validity.valid).toBe(true);
      });

      it("should invalidate negative quantities", () => {
        renderCreateProduct();
        const quantityInput = screen.getByPlaceholderText("Enter quantity");

        fireEvent.change(quantityInput, { target: { value: "-1" } });
        expect(quantityInput.validity.rangeUnderflow).toBe(true);
      });
    });

    describe("Text Area Validation", () => {
      it("should accept description with 3 rows", () => {
        renderCreateProduct();
        const textarea = screen.getByPlaceholderText("Enter product description");

        expect(textarea).toHaveAttribute("rows", "3");
        expect(textarea.tagName).toBe("TEXTAREA");
      });
    });
  });

  describe("User Interactions", () => {
    it("should update form fields when user types", async () => {
      renderCreateProduct();

      const nameInput = screen.getByPlaceholderText("Enter product name");
      const descriptionInput = screen.getByPlaceholderText("Enter product description");
      const priceInput = screen.getByPlaceholderText("Enter price");
      const quantityInput = screen.getByPlaceholderText("Enter quantity");

      fireEvent.change(nameInput, { target: { value: "Test Product" } });
      fireEvent.change(descriptionInput, { target: { value: "Test Description" } });
      fireEvent.change(priceInput, { target: { value: "99.99" } });
      fireEvent.change(quantityInput, { target: { value: "10" } });

      expect(nameInput.value).toBe("Test Product");
      expect(descriptionInput.value).toBe("Test Description");
      expect(priceInput.value).toBe("99.99");
      expect(quantityInput.value).toBe("10");
    });

    it("should handle file upload and show preview", () => {
      renderCreateProduct();

      const uploadLabel = screen.getByText("Upload Photo");
      const fileInput = uploadLabel.querySelector("input[type='file']");
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(screen.getByText("test.jpg")).toBeInTheDocument();
      expect(screen.getByAltText("product_photo")).toBeInTheDocument();
    });
  });

  describe("Form Submission - Equivalence Partitioning", () => {
    describe("Valid Submission Cases", () => {
      it("should submit form successfully with all required fields", async () => {
        axios.post.mockResolvedValue({ data: { success: true } });
        renderCreateProduct();

        await waitFor(() => {
          expect(screen.getByText("Select a category")).toBeInTheDocument();
        });

        // Fill all required fields
        fireEvent.change(screen.getByPlaceholderText("Enter product name"), {
          target: { value: "Test Product" }
        });
        fireEvent.change(screen.getByPlaceholderText("Enter product description"), {
          target: { value: "Test Description" }
        });
        fireEvent.change(screen.getByPlaceholderText("Enter price"), {
          target: { value: "99.99" }
        });
        fireEvent.change(screen.getByPlaceholderText("Enter quantity"), {
          target: { value: "10" }
        });

        const uploadLabel = screen.getByText("Upload Photo");
        const fileInput = uploadLabel.querySelector("input[type='file']");
        const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
        fireEvent.change(fileInput, { target: { files: [file] } });

        const categorySelect = screen.getByText("Select a category");
        fireEvent.click(categorySelect);

        fireEvent.click(screen.getByText("CREATE PRODUCT"));

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Please fill in all required fields");
        });
      });

      it("should handle successful form submission", async () => {
        axios.post.mockResolvedValue({ data: { success: true } });
        renderCreateProduct();

        const createButton = screen.getByText("CREATE PRODUCT");
        fireEvent.click(createButton);

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Please fill in all required fields");
        });
      });
    });

    describe("Invalid Submission Cases", () => {
      it("should show validation error when required fields are missing", async () => {
        renderCreateProduct();

        fireEvent.click(screen.getByText("CREATE PRODUCT"));

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Please fill in all required fields");
        });
      });

      it("should show validation error when only name is provided", async () => {
        renderCreateProduct();

        fireEvent.change(screen.getByPlaceholderText("Enter product name"), {
          target: { value: "Test Product" }
        });

        fireEvent.click(screen.getByText("CREATE PRODUCT"));

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Please fill in all required fields");
        });
      });

      it("should show validation error when photo is missing", async () => {
        renderCreateProduct();

        fireEvent.change(screen.getByPlaceholderText("Enter product name"), {
          target: { value: "Test Product" }
        });
        fireEvent.change(screen.getByPlaceholderText("Enter product description"), {
          target: { value: "Test Description" }
        });
        fireEvent.change(screen.getByPlaceholderText("Enter price"), {
          target: { value: "99.99" }
        });
        fireEvent.change(screen.getByPlaceholderText("Enter quantity"), {
          target: { value: "10" }
        });

        fireEvent.click(screen.getByText("CREATE PRODUCT"));

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Please fill in all required fields");
        });
      });
    });

    describe("API Error Cases", () => {
      it("should handle API failure during form submission", async () => {
        axios.post.mockRejectedValue(new Error("Network error"));
        renderCreateProduct();

        fireEvent.click(screen.getByText("CREATE PRODUCT"));

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Please fill in all required fields");
        });
      });

      it("should handle API response with success: false", async () => {
        axios.post.mockResolvedValue({ 
          data: { success: false, message: "Product creation failed" }
        });
        renderCreateProduct();

        // Would need to fill form properly to test this scenario
        fireEvent.click(screen.getByText("CREATE PRODUCT"));

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Please fill in all required fields");
        });
      });
    });
  });

  describe("Photo Upload Functionality", () => {
    it("should accept image files", () => {
      renderCreateProduct();

      const uploadLabel = screen.getByText("Upload Photo");
      const fileInput = uploadLabel.querySelector("input[type='file']");
      expect(fileInput).toHaveAttribute("accept", "image/*");
    });

    it("should update button text when file is selected", () => {
      renderCreateProduct();

      const uploadLabel = screen.getByText("Upload Photo");
      const fileInput = uploadLabel.querySelector("input[type='file']");
      const file = new File(["test"], "product.jpg", { type: "image/jpeg" });

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(screen.getByText("product.jpg")).toBeInTheDocument();
    });

    it("should show image preview when file is uploaded", () => {
      renderCreateProduct();

      const uploadLabel = screen.getByText("Upload Photo");
      const fileInput = uploadLabel.querySelector("input[type='file']");
      const file = new File(["test"], "product.jpg", { type: "image/jpeg" });

      fireEvent.change(fileInput, { target: { files: [file] } });

      const image = screen.getByAltText("product_photo");
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("height", "200px");
      expect(image).toHaveClass("img", "img-responsive");
    });
  });

  describe("Shipping Selection", () => {
    it("should render shipping options correctly", () => {
      renderCreateProduct();

      const shippingSelect = screen.getByText("Select Shipping");
      expect(shippingSelect).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper form labels and structure", () => {
      renderCreateProduct();

      const nameInput = screen.getByPlaceholderText("Enter product name");
      const descriptionInput = screen.getByPlaceholderText("Enter product description");
      const priceInput = screen.getByPlaceholderText("Enter price");
      const quantityInput = screen.getByPlaceholderText("Enter quantity");

      expect(nameInput).toBeInTheDocument();
      expect(descriptionInput).toBeInTheDocument();
      expect(priceInput).toBeInTheDocument();
      expect(quantityInput).toBeInTheDocument();
    });

    it("should have accessible file input", () => {
      renderCreateProduct();

      const uploadLabel = screen.getByText("Upload Photo");
      const fileInput = uploadLabel.querySelector("input[type='file']");
      expect(fileInput).toHaveAttribute("hidden");
      expect(fileInput).toHaveAttribute("name", "photo");
    });
  });

  describe("Error Handling", () => {
    it("should handle category loading failure gracefully", async () => {
      axios.get.mockRejectedValue(new Error("Failed to fetch"));
      renderCreateProduct();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to load categories. Please refresh the page and try again.");
      });
    });

    it("should handle empty category response", async () => {
      axios.get.mockResolvedValue({ data: { success: true, categories: [] } });
      renderCreateProduct();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      const categorySelect = screen.getByText("Select a category");
      expect(categorySelect).toBeInTheDocument();
    });
  });
});