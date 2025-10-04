import React from "react";
import { render, screen } from "@testing-library/react";
import Users from "./Users";

// --- Mocks must match import paths in Users.js ---
jest.mock("../../components/Layout", () => {
  const React = require("react");
  const LayoutMock = ({ title, children }) => (
    <div data-testid="LayoutMock" data-title={title}>
      LayoutMock
      {children}
    </div>
  );
  return { __esModule: true, default: LayoutMock };
});

jest.mock("../../components/AdminMenu", () => ({
  __esModule: true,
  default: () => <div data-testid="AdminMenuMock">AdminMenuMock</div>,
}));

describe("Users page", () => {
  test("renders page heading and admin menu", () => {
    render(<Users />);

    // heading
    expect(screen.getByRole("heading", { level: 1, name: /All Users/i }))
      .toBeInTheDocument();

    // admin menu mock present
    expect(screen.getByTestId("AdminMenuMock")).toBeInTheDocument();
  });

  test("wraps content with Layout and passes title prop", () => {
    render(<Users />);

    const layout = screen.getByTestId("LayoutMock");
    expect(layout).toBeInTheDocument();
    expect(layout).toHaveAttribute("data-title", "Dashboard - All Users");
  });

  test("basic structure is present (two columns)", () => {
    render(<Users />);

    expect(screen.getByTestId("AdminMenuMock")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: /All Users/i }))
      .toBeInTheDocument();
  });
});
