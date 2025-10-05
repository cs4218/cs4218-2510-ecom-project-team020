import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import UserMenu from "./UserMenu";

const renderWithRoute = (initialPath = "/") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <UserMenu />
    </MemoryRouter>
  );

describe("UserMenu", () => {
  it("renders heading and two nav links with correct text", () => {
    renderWithRoute();

    // Heading
    const heading = screen.getByRole("heading", { level: 4, name: "Dashboard" });
    expect(heading).toBeInTheDocument();

    // Links by accessible name
    const profile = screen.getByRole("link", { name: "Profile" });
    const orders = screen.getByRole("link", { name: "Orders" });
    expect(profile).toBeInTheDocument();
    expect(orders).toBeInTheDocument();
  });

  it("exactly one section heading and exactly two links", () => {
    renderWithRoute();

    const headings = screen.getAllByRole("heading", { level: 4 });
    expect(headings).toHaveLength(1);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
  });

  it("has expected structure/classes for the list group", () => {
    renderWithRoute();

    const container = screen.getByText("Dashboard").closest(".text-center");
    expect(container).toBeInTheDocument();

    const listGroup = container.querySelector(".list-group");
    expect(listGroup).toBeInTheDocument();

    // Both items have the bootstrap list group item/action classes
    const links = screen.getAllByRole("link");
    links.forEach((a) => {
      expect(a).toHaveClass("list-group-item");
      expect(a).toHaveClass("list-group-item-action");
    });
  });

  it("links have the correct hrefs", () => {
    renderWithRoute();

    const profile = screen.getByRole("link", { name: "Profile" });
    const orders = screen.getByRole("link", { name: "Orders" });

    expect(profile).toHaveAttribute("href", "/dashboard/user/profile");
    expect(orders).toHaveAttribute("href", "/dashboard/user/orders");
  });

  describe("active state based on current route", () => {
    it("marks Profile link active when route matches /dashboard/user/profile", () => {
      renderWithRoute("/dashboard/user/profile");

      const profile = screen.getByRole("link", { name: "Profile" });
      const orders = screen.getByRole("link", { name: "Orders" });

      // React Router NavLink adds "active" on match
      expect(profile).toHaveClass("active");
      expect(orders).not.toHaveClass("active");
    });

    it("marks Orders link active when route matches /dashboard/user/orders", () => {
      renderWithRoute("/dashboard/user/orders");

      const profile = screen.getByRole("link", { name: "Profile" });
      const orders = screen.getByRole("link", { name: "Orders" });

      expect(orders).toHaveClass("active");
      expect(profile).not.toHaveClass("active");
    });

    it("treats closely-related routes correctly (trailing slashes)", () => {
      renderWithRoute("/dashboard/user/profile/"); // trailing slash

      const profile = screen.getByRole("link", { name: "Profile" });
      const orders = screen.getByRole("link", { name: "Orders" });

      // Default NavLink behavior still matches (React Router v6)
      expect(profile).toHaveClass("active");
      expect(orders).not.toHaveClass("active");
    });
  });

  describe("navigation interactions", () => {
    it("clicking Orders activates it and deactivates Profile", async () => {
      renderWithRoute("/dashboard/user/profile");

      const profile = screen.getByRole("link", { name: "Profile" });
      const orders = screen.getByRole("link", { name: "Orders" });

      expect(profile).toHaveClass("active");
      expect(orders).not.toHaveClass("active");

      await userEvent.click(orders);

      // After navigation, Orders should become active
      expect(orders).toHaveClass("active");
      expect(profile).not.toHaveClass("active");
    });

    it("keyboard navigation: first Tab focuses the first link (Profile)", async () => {
      renderWithRoute();

      const profile = screen.getByRole("link", { name: "Profile" });
      const orders = screen.getByRole("link", { name: "Orders" });

      await userEvent.tab();
      expect(document.activeElement).toBe(profile);

      await userEvent.tab();
      expect(document.activeElement).toBe(orders);
    });
  });

  describe("BVA checks", () => {
    it("order of links is Profile first, then Orders", () => {
      renderWithRoute();

      const links = screen.getAllByRole("link").map((a) => a.textContent);
      expect(links).toEqual(["Profile", "Orders"]);
    });

    it("no unexpected extra elements (no buttons/forms/images)", () => {
      renderWithRoute();

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(screen.queryByRole("form")).not.toBeInTheDocument();
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      // Sanity: only two links exist
      expect(screen.getAllByRole("link")).toHaveLength(2);
    });

    it("heading text matches exactly (no extra whitespace/case differences)", () => {
      renderWithRoute();
      // positive exact
      expect(screen.getByRole("heading", { level: 4, name: "Dashboard" })).toBeInTheDocument();
      // negatives
      expect(screen.queryByRole("heading", { level: 4, name: "dashboard" })).not.toBeInTheDocument();
      expect(screen.queryByRole("heading", { level: 4, name: " Dashboard " })).not.toBeInTheDocument();
    });
  });
});
