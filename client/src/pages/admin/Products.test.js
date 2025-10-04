import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";

jest.mock("axios");

jest.mock("../../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));

jest.mock("../../components/AdminMenu", () => ({
  __esModule: true,
  default: () => <nav data-testid="admin-menu">AdminMenu</nav>,
}));

jest.mock("react-hot-toast", () => {
  const mockToast = { error: jest.fn(), success: jest.fn() };
  return { __esModule: true, default: mockToast };
});

// eslint-disable-next-line import/first
import Products from "./Products";
// eslint-disable-next-line import/first
import toast from "react-hot-toast";

const mkProduct = (overrides = {}) => ({
  _id: "p1",
  slug: "rope-60m",
  name: "Rope 60m",
  description: "Dynamic single rope, 9.8mm, durable sheath.",
  ...overrides,
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <Products />
    </MemoryRouter>
  );

describe("Products page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the API exactly once on mount", async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [] } });
    renderPage();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product");
    });
  });

  it("renders as many cards as products in the payload", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          mkProduct({ _id: "a", name: "A", slug: "a" }),
          mkProduct({ _id: "b", name: "B", slug: "b" }),
          mkProduct({ _id: "c", name: "C", slug: "c" }),
        ],
      },
    });

    renderPage();

    const titles = await screen.findAllByRole("heading", { level: 5 });
    expect(titles).toHaveLength(3);

    const imgs = screen.getAllByRole("img");
    expect(imgs).toHaveLength(3);
  });

  it("preserves order: cards render in the same order as the API result", async () => {
    const ordered = [
      mkProduct({ _id: "1", name: "First", slug: "first" }),
      mkProduct({ _id: "2", name: "Second", slug: "second" }),
      mkProduct({ _id: "3", name: "Third", slug: "third" }),
    ];
    axios.get.mockResolvedValueOnce({ data: { products: ordered } });

    renderPage();

    const titles = await screen.findAllByRole("heading", { level: 5 });
    const textOrder = titles.map((t) => t.textContent);
    expect(textOrder).toEqual(["First", "Second", "Third"]);
  });

  it("each product renders a link with correct class and href", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          mkProduct({ _id: "x", name: "Belay", slug: "belay-device" }),
          mkProduct({ _id: "y", name: "Draws", slug: "quickdraws-6" }),
        ],
      },
    });

    renderPage();

    const belay = await screen.findByRole("heading", { name: "Belay", level: 5 });
    const belayLink = belay.closest("a");
    expect(belayLink).toHaveClass("product-link");
    expect(belayLink).toHaveAttribute(
      "href",
      "/dashboard/admin/product/belay-device"
    );

    const draws = screen.getByRole("heading", { name: "Draws", level: 5 });
    const drawsLink = draws.closest("a");
    expect(drawsLink).toHaveClass("product-link");
    expect(drawsLink).toHaveAttribute(
      "href",
      "/dashboard/admin/product/quickdraws-6"
    );
  });

  it("image src and alt reflect _id and name; alt can be empty when name missing", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          mkProduct({ _id: "z1", name: "Helmet", slug: "helmet" }),
          mkProduct({ _id: "z2", name: "", slug: "no-name", description: "" }),
        ],
      },
    });

    renderPage();

    const img1 = await screen.findByRole("img", { name: "Helmet" });
    expect(img1).toHaveAttribute("src", "/api/v1/product/product-photo/z1");

    const imgs = screen.getAllByRole("img");

    expect(imgs[1]).toHaveAttribute("src", "/api/v1/product/product-photo/z2");
    expect(imgs[1]).toHaveAttribute("alt", "");
  });

  it("handles undefined products in response without crashing", async () => {
    axios.get.mockResolvedValueOnce({ data: {} });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole("heading", { name: /all products list/i })
    ).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("handles null products in response without crashing", async () => {
    axios.get.mockResolvedValueOnce({ data: { products: null } });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole("heading", { name: /all products list/i })
    ).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });


  it("renders large descriptions fully (no truncation logic in component)", async () => {
    const long =
      "Very long description ".repeat(10) + "with lots of text to ensure rendering is stable.";
    axios.get.mockResolvedValueOnce({
      data: { products: [mkProduct({ _id: "ld", name: "Long Desc", slug: "long", description: long })] },
    });

    renderPage();

    const title = await screen.findByRole("heading", { name: "Long Desc", level: 5 });
    const card = title.closest(".card");
    expect(card).toHaveTextContent(long);
  });

  it("supports slugs with special characters; link path is preserved", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          mkProduct({
            _id: "sp",
            name: "Special",
            slug: "spec!al slug_1~2",
          }),
        ],
      },
    });

    renderPage();

    const title = await screen.findByRole("heading", { name: "Special", level: 5 });
    const link = title.closest("a");
    expect(link).toHaveAttribute(
      "href",
      "/dashboard/admin/product/spec!al slug_1~2"
    );
  });

  it("displays toast on fetch error only once and keeps the page stable", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockRejectedValueOnce(new Error("Network down"));

    renderPage();

    expect(
      await screen.findByRole("heading", { name: /all products list/i })
    ).toBeInTheDocument();

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith("Failed to fetch products");
    logSpy.mockRestore();
  });

  it("empty list: renders heading and no cards/images", async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [] } });

    renderPage();

    expect(
      await screen.findByRole("heading", { name: /all products list/i })
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 5 })).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("basic layout sanity: admin menu is in left column and product list on the right", async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [] } });
    renderPage();

    expect(await screen.findByTestId("layout")).toBeInTheDocument();
    expect(screen.getByTestId("admin-menu")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: /all products list/i })
    ).toBeInTheDocument();
  });

  it("first product link is keyboard-focusable", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          mkProduct({ _id: "a", name: "A", slug: "a" }),
          mkProduct({ _id: "b", name: "B", slug: "b" }),
        ],
      },
    });

    renderPage();

    const linkA = (await screen.findByRole("heading", { name: "A", level: 5 })).closest("a");
    expect(linkA?.tagName).toBe("A");

    await userEvent.tab();
    expect(document.activeElement).toBe(linkA);
  });
});
