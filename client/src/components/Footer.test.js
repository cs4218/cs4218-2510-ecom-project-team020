import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Footer from "../components/Footer";

describe("Footer component", () => {
  test("renders footer heading text", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    // check heading
    const heading = screen.getByText(/All Rights Reserved/i);
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass("text-center");
  });

  test("renders all navigation links", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    const aboutLink = screen.getByRole("link", { name: /About/i });
    const contactLink = screen.getByRole("link", { name: /Contact/i });
    const policyLink = screen.getByRole("link", { name: /Privacy Policy/i });

    expect(aboutLink).toBeInTheDocument();
    expect(contactLink).toBeInTheDocument();
    expect(policyLink).toBeInTheDocument();

    // verify correct paths
    expect(aboutLink.getAttribute("href")).toBe("/about");
    expect(contactLink.getAttribute("href")).toBe("/contact");
    expect(policyLink.getAttribute("href")).toBe("/policy");
  });

  test("footer structure and classes", () => {
    const { container } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    // Prefer ARIA role if present, but don't throw if it's not there
    const byRole = screen.queryByRole("contentinfo");
    const fallback = screen
      .getByText(/All Rights Reserved/i)
      .closest(".footer");
    const footer = byRole ?? fallback ?? container.querySelector(".footer");

    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass("footer");
  });
});
