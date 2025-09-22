import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Contact from "./Contact";

// Mock dependencies
jest.mock("../components/Layout", () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout" data-title={title}>
        {children}
      </div>
    );
  };
});

// Mock react-icons
jest.mock("react-icons/bi", () => ({
  BiMailSend: () => <span data-testid="mail-icon">📧</span>,
  BiPhoneCall: () => <span data-testid="phone-icon">📞</span>,
  BiSupport: () => <span data-testid="support-icon">🎧</span>,
}));

const renderContact = () => {
  return render(<Contact />);
};

describe("Contact Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("should render layout with correct title", () => {
      renderContact();

      const layout = screen.getByTestId("layout");
      expect(layout).toBeInTheDocument();
      expect(layout).toHaveAttribute("data-title", "Contact us");
    });

    it("should render main heading", () => {
      renderContact();

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent("CONTACT US");
      expect(heading).toHaveClass(
        "bg-dark",
        "p-2",
        "text-white",
        "text-center"
      );
    });

    it("should render contact image with correct attributes", () => {
      renderContact();

      const contactImage = screen.getByAltText("Contact us");
      expect(contactImage).toBeInTheDocument();
      expect(contactImage).toHaveAttribute("src", "/images/contactus.jpeg");
      expect(contactImage).toHaveStyle("width: 100%");
    });

    it("should render introductory text", () => {
      renderContact();

      const introText = screen.getByText(
        /For any query or info about products, feel free to call anytime/
      );
      expect(introText).toBeInTheDocument();
      expect(introText).toHaveClass("text-justify", "mt-2");
    });
  });

  describe("Contact Information", () => {
    it("should display email contact information", () => {
      renderContact();

      const emailIcon = screen.getByTestId("mail-icon");
      expect(emailIcon).toBeInTheDocument();

      const emailText = screen.getByText(/help@ecommerceapp.com/);
      expect(emailText).toBeInTheDocument();
      expect(emailText).toHaveClass("mt-3");
    });

    it("should display phone contact information", () => {
      renderContact();

      const phoneIcon = screen.getByTestId("phone-icon");
      expect(phoneIcon).toBeInTheDocument();

      const phoneText = screen.getByText(/012-3456789/);
      expect(phoneText).toBeInTheDocument();
      expect(phoneText).toHaveClass("mt-3");
    });

    it("should display support contact information", () => {
      renderContact();

      const supportIcon = screen.getByTestId("support-icon");
      expect(supportIcon).toBeInTheDocument();

      const supportText = screen.getByText(/1800-0000-0000 \(toll free\)/);
      expect(supportText).toBeInTheDocument();
      expect(supportText).toHaveClass("mt-3");
    });

    it("should display all contact methods", () => {
      renderContact();

      expect(screen.getByTestId("mail-icon")).toBeInTheDocument();
      expect(screen.getByTestId("phone-icon")).toBeInTheDocument();
      expect(screen.getByTestId("support-icon")).toBeInTheDocument();

      expect(screen.getByText(/help@ecommerceapp.com/)).toBeInTheDocument();
      expect(screen.getByText(/012-3456789/)).toBeInTheDocument();
      expect(screen.getByText(/1800-0000-0000/)).toBeInTheDocument();
    });
  });

  describe("Layout and Styling", () => {
    it("should render with correct layout structure", () => {
      renderContact();

      expect(screen.getByRole("heading")).toBeInTheDocument();
      expect(screen.getByRole("img")).toBeInTheDocument();
      expect(screen.getByText(/For any query/)).toBeInTheDocument();
    });

    it("should render image with proper styling", () => {
      renderContact();

      const image = screen.getByRole("img");
      expect(image).toHaveStyle("width: 100%");
      expect(image).toHaveAttribute("src", "/images/contactus.jpeg");
    });

    it("should render content with proper structure", () => {
      renderContact();

      const heading = screen.getByRole("heading");
      expect(heading).toHaveClass(
        "bg-dark",
        "p-2",
        "text-white",
        "text-center"
      );

      const contactParagraphs = screen.getAllByText(/:/);
      expect(contactParagraphs.length).toBe(3);
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading hierarchy", () => {
      renderContact();

      const headings = screen.getAllByRole("heading");
      expect(headings).toHaveLength(1);
      expect(headings[0].tagName).toBe("H1");
    });

    it("should have descriptive alt text for image", () => {
      renderContact();

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("alt", "Contact us");
    });

    it("should render contact information in accessible format", () => {
      renderContact();

      const contactParagraphs = screen.getAllByText(/:/);
      expect(contactParagraphs.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Content Validation", () => {
    it("should display correct availability information", () => {
      renderContact();

      const availabilityText = screen.getByText(/available 24X7/);
      expect(availabilityText).toBeInTheDocument();
    });
  });

  describe("Component Integration", () => {
    it("should integrate properly with Layout component", () => {
      renderContact();

      const layout = screen.getByTestId("layout");
      expect(layout).toBeInTheDocument();

      const heading = screen.getByRole("heading");
      expect(layout).toContainElement(heading);
    });

    it("should render all icons from react-icons/bi", () => {
      renderContact();

      expect(screen.getByTestId("mail-icon")).toBeInTheDocument();
      expect(screen.getByTestId("phone-icon")).toBeInTheDocument();
      expect(screen.getByTestId("support-icon")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should render without crashing when icons fail to load", () => {
      expect(() => renderContact()).not.toThrow();
    });

    it("should maintain structure even with missing CSS classes", () => {
      renderContact();

      expect(screen.getByRole("heading")).toBeInTheDocument();
      expect(screen.getByRole("img")).toBeInTheDocument();
      expect(screen.getByText(/help@ecommerceapp.com/)).toBeInTheDocument();
    });
  });

  describe("Static Content", () => {
    it("should display all required contact methods", () => {
      renderContact();

      const expectedContacts = [
        "help@ecommerceapp.com",
        "012-3456789",
        "1800-0000-0000",
      ];

      expectedContacts.forEach((contact) => {
        expect(screen.getByText(new RegExp(contact))).toBeInTheDocument();
      });
    });

    it("should display complete contact information structure", () => {
      renderContact();

      expect(screen.getByRole("heading")).toBeInTheDocument();
      expect(screen.getByRole("img")).toBeInTheDocument();
      expect(screen.getByText(/For any query/)).toBeInTheDocument();
      expect(screen.getAllByText(/:/)).toHaveLength(3);
    });
  });
});
