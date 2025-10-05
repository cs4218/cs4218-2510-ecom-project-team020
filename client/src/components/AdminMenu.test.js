import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import AdminMenu from "./AdminMenu";

const renderAdminMenu = () => {
  return render(
    <MemoryRouter>
      <AdminMenu />
    </MemoryRouter>
  );
};

describe("AdminMenu Component", () => {
  describe("Component Rendering", () => {
    // Classification: Output-based (verifies DOM text content)
    it("should render admin panel heading", () => {
      renderAdminMenu();

      expect(screen.getByText("Admin Panel")).toBeInTheDocument();
    });

    // Classification: Output-based (verifies all navigation links are rendered)
    it("should render all navigation links", () => {
      renderAdminMenu();

      expect(screen.getByText("Create Category")).toBeInTheDocument();
      expect(screen.getByText("Create Product")).toBeInTheDocument();
      expect(screen.getByText("Products")).toBeInTheDocument();
      expect(screen.getByText("Orders")).toBeInTheDocument();
      expect(screen.getByText("Users")).toBeInTheDocument();
    });

    // Classification: Output-based (verifies link attributes and navigation URLs)
    it("should render navigation links with correct href attributes", () => {
      renderAdminMenu();

      expect(screen.getByText("Create Category")).toHaveAttribute(
        "href",
        "/dashboard/admin/create-category"
      );
      expect(screen.getByText("Create Product")).toHaveAttribute(
        "href",
        "/dashboard/admin/create-product"
      );
      expect(screen.getByText("Products")).toHaveAttribute(
        "href",
        "/dashboard/admin/products"
      );
      expect(screen.getByText("Orders")).toHaveAttribute(
        "href",
        "/dashboard/admin/orders"
      );
      expect(screen.getByText("Users")).toHaveAttribute(
        "href",
        "/dashboard/admin/users"
      );
    });
  });

  describe("Navigation Structure", () => {
    // Classification: Output-based (verifies exact number of navigation elements)
    it("should render exactly 5 navigation links", () => {
      renderAdminMenu();

      const navLinks = screen.getAllByRole("link");
      expect(navLinks).toHaveLength(5);
    });

    // Classification: Output-based (verifies navigation order and structure)
    it("should render links in correct order", () => {
      renderAdminMenu();

      const navLinks = screen.getAllByRole("link");
      const expectedOrder = [
        "Create Category",
        "Create Product",
        "Products",
        "Orders",
        "Users",
      ];

      navLinks.forEach((link, index) => {
        expect(link).toHaveTextContent(expectedOrder[index]);
      });
    });
  });
});