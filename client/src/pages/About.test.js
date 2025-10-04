import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import About from "./About";

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

describe("About Component - Unit Tests", () => {
  // Output-Based Testing
  describe("Component Rendering", () => {
    it("should render the About component without crashing", () => {
      render(<About />);

      expect(screen.getByTestId("layout")).toBeInTheDocument();
    });

    it("should render Layout with correct title prop", () => {
      render(<About />);

      const layout = screen.getByTestId("layout");
      expect(layout).toHaveAttribute("data-title", "About us - Ecommerce app");
    });

    it("should render about image with correct attributes", () => {
      render(<About />);

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("src", "/images/about.jpeg");
      expect(image).toHaveAttribute("alt", "about us");
      expect(image).toHaveStyle({ width: "100%" });
    });
  });

  describe("Content Structure Testing", () => {
    it("should render a main heading", () => {
      render(<About />);

      // Test for presence of main heading, not specific text
      const mainHeading = screen.getByRole("heading", { level: 2 });
      expect(mainHeading).toBeInTheDocument();
      expect(mainHeading).toBeVisible();
    });

    it("should render a features/benefits section", () => {
      render(<About />);

      // Test for presence of a list structure (benefits/features)
      const list = screen.getByRole("list");
      expect(list).toBeInTheDocument();

      const listItems = screen.getAllByRole("listitem");
      expect(listItems.length).toBeGreaterThanOrEqual(2); // At least 2 features/benefits
    });

    it("should render a secondary heading for features section", () => {
      render(<About />);

      // Test for presence of secondary heading, not specific text
      const secondaryHeading = screen.getByRole("heading", { level: 5 });
      expect(secondaryHeading).toBeInTheDocument();
      expect(secondaryHeading).toBeVisible();
    });

    it("should have proper content hierarchy", () => {
      render(<About />);

      // Test semantic structure rather than content
      const headings = screen.getAllByRole("heading");
      expect(headings.length).toBeGreaterThanOrEqual(2);

      // Ensure headings are in proper order (H2 before H5)
      const headingLevels = headings.map((h) => parseInt(h.tagName.charAt(1)));
      expect(headingLevels[0]).toBeLessThan(headingLevels[1]);
    });
  });

  // Communication-Based Testing
  describe("Layout Integration", () => {
    it("should pass correct props to Layout component", () => {
      render(<About />);

      const layout = screen.getByTestId("layout");
      expect(layout).toHaveAttribute("data-title", "About us - Ecommerce app");
    });

    it("should render children content within Layout", () => {
      render(<About />);

      const layout = screen.getByTestId("layout");
      const image = screen.getByRole("img");
      const heading = screen.getByText("About Our Store");

      expect(layout).toContainElement(image);
      expect(layout).toContainElement(heading);
    });
  });

  describe("Component Structure Validation", () => {
    it("should handle normal rendering scenario", () => {
      render(<About />);

      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByRole("img")).toBeInTheDocument();
      expect(screen.getAllByRole("heading")).toHaveLength(2);
      expect(screen.getByRole("list")).toBeInTheDocument();
    });
  });
});
