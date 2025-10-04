import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UserMenu from "./UserMenu";

describe("UserMenu component", () => {
  test("renders the dashboard heading", () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { level: 4, name: /Dashboard/i }))
      .toBeInTheDocument();
  });

  test("renders both navigation links", () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    const profileLink = screen.getByRole("link", { name: /Profile/i });
    const ordersLink = screen.getByRole("link", { name: /Orders/i });

    expect(profileLink).toBeInTheDocument();
    expect(ordersLink).toBeInTheDocument();
  });

  test("links have correct hrefs", () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    expect(screen.getByText("Profile")).toHaveAttribute(
      "href",
      "/dashboard/user/profile"
    );
    expect(screen.getByText("Orders")).toHaveAttribute(
      "href",
      "/dashboard/user/orders"
    );
  });

  test("renders list group container with expected classes", () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    const listGroup = screen.getByText("Dashboard").closest(".list-group");
    expect(listGroup).toBeInTheDocument();
  });
});
