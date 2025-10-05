import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("./Header", () => () => <div data-testid="header">HEADER</div>);
jest.mock("./Footer", () => () => <div data-testid="footer">FOOTER</div>);

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  Toaster: () => <div data-testid="toaster">TOASTER</div>,
}));

import Layout from "./Layout";

const getMeta = (name) => document.head.querySelector(`meta[name="${name}"]`);

describe("Layout", () => {
  beforeEach(() => {
    document.title = "";
    ["description", "keywords", "author"].forEach((n) => {
      const m = getMeta(n);
      if (m) m.parentNode.removeChild(m);
    });
  });

  test("renders Header, Footer, Toaster and children", () => {
    render(
      <Layout>
        <div data-testid="content">CONTENT</div>
      </Layout>
    );

    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(screen.getByTestId("toaster")).toBeInTheDocument();
    expect(screen.getByTestId("content")).toBeInTheDocument();

    const main = screen.getByRole("main");
    expect(main).toHaveStyle({ minHeight: "70vh" });
  });

  test("applies default Helmet tags when props not provided", async () => {
    render(<Layout />);

    await waitFor(() =>
      expect(document.title).toBe("Ecommerce app - shop now")
    );

    await waitFor(() =>
      expect(getMeta("description")).toHaveAttribute(
        "content",
        "mern stack project"
      )
    );
    expect(getMeta("keywords")).toHaveAttribute(
      "content",
      "mern,react,node,mongodb"
    );
    expect(getMeta("author")).toHaveAttribute("content", "Techinfoyt");
  });

  test("overrides Helmet tags when custom props are provided", async () => {
    render(
      <Layout
        title="Custom Title"
        description="Custom Description"
        keywords="a,b,c"
        author="Alicia"
      />
    );

    await waitFor(() => expect(document.title).toBe("Custom Title"));
    await waitFor(() =>
      expect(getMeta("description")).toHaveAttribute(
        "content",
        "Custom Description"
      )
    );
    expect(getMeta("keywords")).toHaveAttribute("content", "a,b,c");
    expect(getMeta("author")).toHaveAttribute("content", "Alicia");
  });

  test("renders children inside <main>", () => {
    render(
      <Layout>
        <p data-testid="child">Hello</p>
      </Layout>
    );
    const main = screen.getByRole("main");
    expect(main).toContainElement(screen.getByTestId("child"));
  });
});
