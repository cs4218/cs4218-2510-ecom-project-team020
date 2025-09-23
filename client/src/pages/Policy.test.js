import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Policy from "../pages/Policy";

jest.mock("../components/Layout", () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="mock-layout">
        <h1>{title}</h1>
        {children}
      </div>
    );
  };
});

describe("Policy Page", () => {
  it("renders the Layout with the correct title", () => {
    render(<Policy />);
    expect(screen.getByTestId("mock-layout")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /privacy policy/i })).toBeInTheDocument();
  });

  it("displays the contact image", () => {
    render(<Policy />);
    const img = screen.getByAltText("contactus");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/contactus.jpeg");
  });

  it("renders all privacy policy paragraphs", () => {
    render(<Policy />);
    expect(
      screen.getByText(/your privacy is important to us/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/by continuing to browse or use our services/i)
    ).toBeInTheDocument();

  });
});
