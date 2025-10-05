import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";

const mockLayoutSpy = { lastTitle: undefined, renderCount: 0 };

jest.mock("../../components/Layout", () => ({
  __esModule: true,
  default: ({ title, children }) => {
    mockLayoutSpy.lastTitle = title;
    mockLayoutSpy.renderCount += 1;
    return (
      <div data-testid="layout" data-title={title}>
        {children}
      </div>
    );
  },
}));

jest.mock("../../components/AdminMenu", () => ({
  __esModule: true,
  default: () => <nav data-testid="admin-menu">AdminMenu</nav>,
}));

// eslint-disable-next-line import/first
import Users from "./Users";

describe("Users page", () => {
  beforeEach(() => {
    mockLayoutSpy.lastTitle = undefined;
    mockLayoutSpy.renderCount = 0;
  });

  const renderUsers = () => render(<Users />);

  it("renders Layout, AdminMenu, and the heading", () => {
    renderUsers();

    // Layout wrapper exists
    const layout = screen.getByTestId("layout");
    expect(layout).toBeInTheDocument();

    // Admin menu present once
    const menu = screen.getByTestId("admin-menu");
    expect(menu).toBeInTheDocument();

    // Heading
    const heading = screen.getByRole("heading", { level: 1, name: "All Users" });
    expect(heading).toBeInTheDocument();
  });

  it("passes the correct title prop to Layout", () => {
    renderUsers();

    // via spy
    expect(mockLayoutSpy.renderCount).toBe(1);
    expect(mockLayoutSpy.lastTitle).toBe("Dashboard - All Users");

    const layout = screen.getByTestId("layout");
    expect(layout).toHaveAttribute("data-title", "Dashboard - All Users");
  });

  it("uses the correct container/row/columns classes", () => {
    renderUsers();

    const layout = screen.getByTestId("layout");
    const container = layout.querySelector(".container-fluid.m-3.p-3");
    expect(container).toBeInTheDocument();

    const row = container.querySelector(".row");
    expect(row).toBeInTheDocument();

    const leftCol = row.querySelector(".col-md-3");
    const rightCol = row.querySelector(".col-md-9");
    expect(leftCol).toBeInTheDocument();
    expect(rightCol).toBeInTheDocument();

    expect(leftCol).toContainElement(screen.getByTestId("admin-menu"));
    expect(rightCol).toContainElement(
      screen.getByRole("heading", { level: 1, name: "All Users" })
    );
  });

  it("renders exactly one h1 heading with the correct text", () => {
    renderUsers();

    const allH1s = screen.getAllByRole("heading", { level: 1 });
    expect(allH1s).toHaveLength(1);
    expect(allH1s[0]).toHaveTextContent("All Users");
  });

  it("does not render unexpected duplicate menus or extra headings", () => {
    renderUsers();

    // Only one AdminMenu
    const menus = screen.getAllByTestId("admin-menu");
    expect(menus).toHaveLength(1);

    // Only one h1
    const allH1s = screen.getAllByRole("heading", { level: 1 });
    expect(allH1s).toHaveLength(1);
  });

  it("heading can receive focus programmatically", () => {
    renderUsers();
    const heading = screen.getByRole("heading", { level: 1, name: "All Users" });
    heading.tabIndex = -1; // allow focus programmatically
    heading.focus();
    expect(document.activeElement).toBe(heading);
  });
});
