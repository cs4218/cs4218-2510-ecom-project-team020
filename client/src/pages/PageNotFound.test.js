import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import PageNotFound from "./PageNotFound";

// Mock Layout component
jest.mock("../components/Layout", () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout" data-title={title}>
        {children}
      </div>
    );
  };
});

const renderPageNotFound = () => {
  return render(
    <MemoryRouter>
      <PageNotFound />
    </MemoryRouter>
  );
};

describe("PageNotFound Component - Unit Tests", () => {
  describe("Component Rendering", () => {
    it("should render the PageNotFound component without crashing", () => {
      renderPageNotFound();

      expect(screen.getByTestId("layout")).toBeInTheDocument();
    });

    it("should render Layout with correct title prop", () => {
      renderPageNotFound();

      const layout = screen.getByTestId("layout");
      expect(layout).toHaveAttribute("data-title", "go back- page not found");
    });
  });

  describe("Navigation Link Testing", () => {
    it("should render Go Back link with correct text", () => {
      renderPageNotFound();

      const goBackLink = screen.getByRole("link", { name: "Go Back" });
      expect(goBackLink).toBeInTheDocument();
      expect(goBackLink).toHaveTextContent("Go Back");
    });

    it("should have correct href attribute pointing to home", () => {
      renderPageNotFound();

      const goBackLink = screen.getByRole("link", { name: "Go Back" });
      expect(goBackLink).toHaveAttribute("href", "/");
    });
  });

  describe("Layout Integration", () => {
    it("should pass correct props to Layout component", () => {
      renderPageNotFound();

      const layout = screen.getByTestId("layout");
      expect(layout).toHaveAttribute("data-title", "go back- page not found");
    });

    it("should render all content within Layout wrapper", () => {
      renderPageNotFound();

      const layout = screen.getByTestId("layout");
      const errorCode = screen.getByText("404");
      const errorMessage = screen.getByText("Oops ! Page Not Found");
      const goBackLink = screen.getByRole("link", { name: "Go Back" });

      expect(layout).toContainElement(errorCode);
      expect(layout).toContainElement(errorMessage);
      expect(layout).toContainElement(goBackLink);
    });
  });

  describe("React Router Integration", () => {
    it("should use Link component for navigation", () => {
      renderPageNotFound();

      const goBackLink = screen.getByRole("link", { name: "Go Back" });
      expect(goBackLink).toBeInTheDocument();
      // Link component should render as an anchor tag
      expect(goBackLink.tagName).toBe("A");
    });
  });

  describe("Valid Rendering States", () => {
    it("should handle normal 404 page display", () => {
      renderPageNotFound();

      // Valid partition: All required elements present
      expect(screen.getByText("404")).toBeInTheDocument();
      expect(screen.getByText("Oops ! Page Not Found")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Go Back" })).toBeInTheDocument();
    });
  });
});
