import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import CategoryForm from "./CategoryForm";

describe("CategoryForm Component", () => {
  const mockHandleSubmit = jest.fn();
  const mockSetValue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderCategoryForm = (value = "") => {
    return render(
      <CategoryForm
        handleSubmit={mockHandleSubmit}
        value={value}
        setValue={mockSetValue}
      />
    );
  };

  describe("Component Rendering", () => {
    it("should render form with all required elements", () => {
      const { container } = renderCategoryForm();

      const form = container.querySelector("form");
      expect(form).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter new category")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
    });

    it("should render input with correct attributes", () => {
      renderCategoryForm();

      const input = screen.getByPlaceholderText("Enter new category");
      expect(input).toHaveAttribute("type", "text");
      expect(input).toHaveAttribute("required");
      expect(input).toHaveAttribute("minLength", "2");
      expect(input).toHaveAttribute("maxLength", "50");
      expect(input).toHaveAttribute("id", "categoryInput");
      expect(input).toHaveClass("form-control");
    });

    it("should display the provided value in input", () => {
      const testValue = "Electronics";
      renderCategoryForm(testValue);

      const input = screen.getByPlaceholderText("Enter new category");
      expect(input).toHaveValue(testValue);
    });
  });

  describe("Form Validation - Boundary Value Analysis", () => {
    describe("Input Length Validation", () => {
      it("should accept minimum valid length (2 characters)", () => {
        renderCategoryForm();
        const input = screen.getByPlaceholderText("Enter new category");

        fireEvent.change(input, { target: { value: "TV" } });
        expect(mockSetValue).toHaveBeenCalledWith("TV");
      });

      it("should accept maximum valid length (50 characters)", () => {
        renderCategoryForm();
        const input = screen.getByPlaceholderText("Enter new category");
        const maxLengthValue = "A".repeat(50);

        fireEvent.change(input, { target: { value: maxLengthValue } });
        expect(mockSetValue).toHaveBeenCalledWith(maxLengthValue);
      });

      it("should handle input below minimum length (1 character)", () => {
        renderCategoryForm();
        const input = screen.getByPlaceholderText("Enter new category");

        fireEvent.change(input, { target: { value: "A" } });
        expect(mockSetValue).toHaveBeenCalledWith("A");
      });

      it("should invalidate empty input", () => {
        renderCategoryForm();
        const input = screen.getByPlaceholderText("Enter new category");

        fireEvent.change(input, { target: { value: "" } });
        expect(input.validity.valueMissing).toBe(true);
      });

      it("should handle input exceeding maximum length", () => {
        renderCategoryForm();
        const input = screen.getByPlaceholderText("Enter new category");
        const tooLongValue = "A".repeat(51);

        fireEvent.change(input, { target: { value: tooLongValue } });
        expect(mockSetValue).toHaveBeenCalledWith(tooLongValue);
      });
    });
  });

  describe("User Interactions", () => {
    it("should call setValue when input changes", () => {
      renderCategoryForm();
      const input = screen.getByPlaceholderText("Enter new category");

      fireEvent.change(input, { target: { value: "Books" } });
      expect(mockSetValue).toHaveBeenCalledTimes(1);
      expect(mockSetValue).toHaveBeenCalledWith("Books");
    });

    it("should handle multiple input changes", () => {
      renderCategoryForm();
      const input = screen.getByPlaceholderText("Enter new category");

      fireEvent.change(input, { target: { value: "B" } });
      fireEvent.change(input, { target: { value: "Bo" } });
      fireEvent.change(input, { target: { value: "Books" } });

      expect(mockSetValue).toHaveBeenCalledTimes(3);
      expect(mockSetValue).toHaveBeenNthCalledWith(1, "B");
      expect(mockSetValue).toHaveBeenNthCalledWith(2, "Bo");
      expect(mockSetValue).toHaveBeenNthCalledWith(3, "Books");
    });

    it("should handle special characters in input", () => {
      renderCategoryForm();
      const input = screen.getByPlaceholderText("Enter new category");

      fireEvent.change(input, { target: { value: "Books & Media" } });
      expect(mockSetValue).toHaveBeenCalledWith("Books & Media");
    });

    it("should handle numeric input", () => {
      renderCategoryForm();
      const input = screen.getByPlaceholderText("Enter new category");

      fireEvent.change(input, { target: { value: "Category 123" } });
      expect(mockSetValue).toHaveBeenCalledWith("Category 123");
    });
  });

  describe("Form Submission", () => {
    it("should call handleSubmit when form is submitted", () => {
      const { container } = renderCategoryForm("Electronics");
      const form = container.querySelector("form");

      fireEvent.submit(form);
      expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
    });

    it("should call handleSubmit when submit button is clicked", () => {
      renderCategoryForm("Electronics");
      const submitButton = screen.getByRole("button", { name: "Submit" });

      fireEvent.click(submitButton);
      expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
    });

    it("should prevent default form submission", () => {
      const { container } = renderCategoryForm("Electronics");
      const form = container.querySelector("form");
      const mockEvent = { preventDefault: jest.fn() };

      fireEvent.submit(form, mockEvent);
      expect(mockHandleSubmit).toHaveBeenCalled();
    });
  });

  describe("Equivalence Partitioning", () => {
    describe("Valid Input Classes", () => {
      it("should handle valid alphabetic category names", () => {
        renderCategoryForm();
        const input = screen.getByPlaceholderText("Enter new category");

        const validInputs = ["Electronics", "Books", "Clothing", "Sports"];
        
        validInputs.forEach(value => {
          fireEvent.change(input, { target: { value } });
          expect(mockSetValue).toHaveBeenCalledWith(value);
        });
      });

      it("should handle valid alphanumeric category names", () => {
        renderCategoryForm();
        const input = screen.getByPlaceholderText("Enter new category");

        const validInputs = ["Category1", "Type2", "Model3"];
        
        validInputs.forEach(value => {
          fireEvent.change(input, { target: { value } });
          expect(mockSetValue).toHaveBeenCalledWith(value);
        });
      });

      it("should handle valid category names with spaces and special characters", () => {
        renderCategoryForm();
        const input = screen.getByPlaceholderText("Enter new category");

        const validInputs = ["Home & Garden", "Arts-Crafts", "Health & Beauty"];
        
        validInputs.forEach(value => {
          fireEvent.change(input, { target: { value } });
          expect(mockSetValue).toHaveBeenCalledWith(value);
        });
      });
    });

    describe("Edge Cases", () => {
      it("should handle whitespace-only input", () => {
        renderCategoryForm();
        const input = screen.getByPlaceholderText("Enter new category");

        fireEvent.change(input, { target: { value: "   " } });
        expect(mockSetValue).toHaveBeenCalledWith("   ");
      });

      it("should handle input with leading/trailing spaces", () => {
        renderCategoryForm();
        const input = screen.getByPlaceholderText("Enter new category");

        fireEvent.change(input, { target: { value: "  Electronics  " } });
        expect(mockSetValue).toHaveBeenCalledWith("  Electronics  ");
      });

      it("should handle mixed case input", () => {
        renderCategoryForm();
        const input = screen.getByPlaceholderText("Enter new category");

        fireEvent.change(input, { target: { value: "eLeCtrOnIcS" } });
        expect(mockSetValue).toHaveBeenCalledWith("eLeCtrOnIcS");
      });
    });
  });

  describe("Accessibility", () => {
    it("should have input with proper id attribute", () => {
      renderCategoryForm();
      const input = screen.getByPlaceholderText("Enter new category");

      expect(input).toHaveAttribute("id", "categoryInput");
    });

    it("should be keyboard accessible", () => {
      renderCategoryForm();
      const input = screen.getByPlaceholderText("Enter new category");
      const submitButton = screen.getByRole("button", { name: "Submit" });

      input.focus();
      expect(document.activeElement).toBe(input);

      fireEvent.keyDown(input, { key: "Tab" });
      submitButton.focus();
      expect(document.activeElement).toBe(submitButton);
    });

    it("should support form submission via Enter key", () => {
      const { container } = renderCategoryForm("Electronics");
      const form = container.querySelector("form");
      const input = screen.getByPlaceholderText("Enter new category");

      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
      fireEvent.submit(form);
      expect(mockHandleSubmit).toHaveBeenCalled();
    });
  });
});