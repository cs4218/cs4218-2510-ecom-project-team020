import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";


jest.mock("react-hot-toast", () => ({
  __esModule: true,
  success: jest.fn(),
  default: { success: jest.fn() }, 
}));

jest.mock("../context/auth", () => ({ useAuth: jest.fn() }));
jest.mock("../context/cart", () => ({ useCart: jest.fn() }));
jest.mock("../hooks/useCategory", () => ({ __esModule: true, default: jest.fn() }));

jest.mock("./Form/SearchInput", () => () => <div data-testid="search-input">SEARCH</div>);
jest.mock("antd", () => ({
  Badge: ({ count, showZero, children }) => (
    <div data-testid="badge" data-count={String(count)} data-showzero={String(showZero)}>
      {children}
    </div>
  ),
}));

import * as toast from "react-hot-toast";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import useCategory from "../hooks/useCategory";

import Header from "./Header";

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );

describe("Header", () => {
  const setAuthMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default test state: logged-out, empty cart, two categories
    useAuth.mockReturnValue([{ user: null, token: "" }, setAuthMock]);
    useCart.mockReturnValue([[]]);
    useCategory.mockReturnValue([
      { name: "Climbing", slug: "climbing" },
      { name: "Running", slug: "running" },
    ]);

    // Spy localStorage.removeItem
    jest
      .spyOn(window.localStorage.__proto__, "removeItem")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    window.localStorage.removeItem.mockRestore();
  });

  test("renders brand, SearchInput, Home, Login, and Register when logged out", () => {
    renderHeader();

    expect(screen.getByRole("link", { name: /virtual vault/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /register/i })).toBeInTheDocument();
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
  });

  test("categories dropdown contains All Categories and specific category links", () => {
    renderHeader();

    // the trigger exists
    expect(screen.getByRole("link", { name: /^categories$/i })).toBeInTheDocument();
    // All Categories
    const all = screen.getAllByRole("link", { name: /all categories/i })[0];
    expect(all).toHaveAttribute("href", "/categories");

    // Specific categories
    expect(screen.getByRole("link", { name: "Climbing" })).toHaveAttribute(
      "href",
      "/category/climbing"
    );
    expect(screen.getByRole("link", { name: "Running" })).toHaveAttribute(
      "href",
      "/category/running"
    );
  });

  test("handles empty categories gracefully", () => {
    useCategory.mockReturnValue([]);
    renderHeader();

    const all = screen.getAllByRole("link", { name: /all categories/i })[0];
    expect(all).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Climbing" })).not.toBeInTheDocument();
  });

  test("shows user dropdown + /dashboard/user and Logout when logged in (role 0)", () => {
    useAuth.mockReturnValue([{ user: { name: "Alicia", role: 0 }, token: "abc" }, setAuthMock]);

    renderHeader();

    expect(screen.getByText("Alicia")).toBeInTheDocument();
    const dashboard = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboard).toHaveAttribute("href", "/dashboard/user");
    expect(screen.getByRole("link", { name: /logout/i })).toBeInTheDocument();

    expect(screen.queryByRole("link", { name: /login/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /register/i })).not.toBeInTheDocument();
  });

  test("uses /dashboard/admin for role 1", () => {
    useAuth.mockReturnValue([{ user: { name: "Admin", role: 1 }, token: "t" }, setAuthMock]);

    renderHeader();

    const dashboard = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboard).toHaveAttribute("href", "/dashboard/admin");
  });

  test("logout clears auth, removes localStorage key, and toasts success", () => {
    const setAuthSpy = jest.fn();
    useAuth.mockReturnValue([{ user: { name: "Alicia", role: 0 }, token: "abc" }, setAuthSpy]);

    renderHeader();

    fireEvent.click(screen.getByRole("link", { name: /logout/i }));

    // Context updated
    expect(setAuthSpy).toHaveBeenCalledTimes(1);
    const payload = setAuthSpy.mock.calls[0][0];
    expect(payload.user).toBeNull();
    expect(payload.token).toBe("");

    // localStorage cleared
    expect(window.localStorage.removeItem).toHaveBeenCalledWith("auth");

    // toast called (check named export first, then default fallback)
    expect(toast.default.success).toHaveBeenCalledWith("Logout Successfully");

  });

  test("cart badge reflects cart length and links to /cart", () => {
    useCart.mockReturnValue([[{ id: 1 }, { id: 2 }, { id: 3 }]]);
    renderHeader();

    const badge = screen.getByTestId("badge");
    expect(badge).toHaveAttribute("data-count", "3");
    expect(badge).toHaveAttribute("data-showzero", "true");

    const cartLink = within(badge).getByRole("link", { name: /cart/i });
    expect(cartLink).toHaveAttribute("href", "/cart");
  });

  test("brand and home links always render", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /virtual vault/i })).toBeInTheDocument();

    useAuth.mockReturnValue([{ user: { name: "Alicia", role: 0 }, token: "x" }, setAuthMock]);
    renderHeader();
    expect(screen.getAllByRole("link", { name: /home/i }).length).toBeGreaterThan(0);
  });

  test("SearchInput renders exactly once", () => {
    renderHeader();
    expect(screen.getAllByTestId("search-input")).toHaveLength(1);
  });
});
