import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";
import axios from "axios";

import CategoryProduct from "./CategoryProduct";

jest.mock("../components/Layout", () => {
  return function LayoutStub({ children }) {
    return <div data-testid="layout-stub">{children}</div>;
  };
});

const ProductRouteProbe = ({ label }) => (
  <div data-testid="product-route">Viewing product {label}</div>
);

const CategorySwitcher = ({ target }) => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(target)}
      data-testid={`switch-to-${target}`}
    >
      Switch
    </button>
  );
};

const renderCategoryRoute = (path = "/category/electronics") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <CategorySwitcher target="/category/books" />
      <Routes>
        <Route path="/category/:slug" element={<CategoryProduct />} />
        <Route
          path="/product/:slug"
          element={<ProductRouteProbe label="details" />}
        />
      </Routes>
    </MemoryRouter>
  );

describe("CategoryProduct integration", () => {
  let axiosGetSpy;

  beforeEach(() => {
    axiosGetSpy = jest.spyOn(axios, "get");
    jest.clearAllMocks();
  });

  afterEach(() => {
    axiosGetSpy.mockRestore();
  });

  it("fetches category data and renders product cards", async () => {
    const response = {
      category: { _id: "cat-1", name: "Electronics" },
      products: [
        {
          _id: "prod-1",
          name: "Smart Speaker",
          description: "Voice-enabled assistant",
          price: 199,
          slug: "smart-speaker",
        },
        {
          _id: "prod-2",
          name: "Noise Cancelling Headphones",
          description: "Premium sound quality",
          price: 349,
          slug: "nc-headphones",
        },
      ],
    };

    axiosGetSpy.mockResolvedValueOnce({ data: response });

    renderCategoryRoute();

    await screen.findByText("Category - Electronics");
    expect(screen.getByText("2 result found")).toBeInTheDocument();
    expect(screen.getByText("Smart Speaker")).toBeInTheDocument();
    expect(screen.getByText("Noise Cancelling Headphones")).toBeInTheDocument();

    expect(axiosGetSpy).toHaveBeenCalledWith(
      "/api/v1/product/product-category/electronics"
    );
  });

  it("navigates to product details when More Details is clicked", async () => {
    const response = {
      category: { _id: "cat-2", name: "Accessories" },
      products: [
        {
          _id: "prod-3",
          name: "Travel Backpack",
          description: "Carry-on compliant",
          price: 120,
          slug: "travel-backpack",
        },
      ],
    };

    axiosGetSpy.mockResolvedValueOnce({ data: response });

    renderCategoryRoute("/category/accessories");

    const button = await screen.findByRole("button", { name: "More Details" });
    fireEvent.click(button);

    await waitFor(() =>
      expect(screen.getByTestId("product-route")).toHaveTextContent(
        "Viewing product details"
      )
    );
  });

  it("refetches products when category slug changes", async () => {
    const electronicsResponse = {
      category: { _id: "cat-1", name: "Electronics" },
      products: [
        {
          _id: "prod-1",
          name: "Smart Speaker",
          description: "Voice-enabled assistant",
          price: 199,
          slug: "smart-speaker",
        },
      ],
    };

    const booksResponse = {
      category: { _id: "cat-3", name: "Books" },
      products: [
        {
          _id: "prod-4",
          name: "Testing Strategies",
          description: "Software testing handbook",
          price: 45,
          slug: "testing-strategies",
        },
      ],
    };

    axiosGetSpy
      .mockResolvedValueOnce({ data: electronicsResponse })
      .mockResolvedValueOnce({ data: booksResponse });

    renderCategoryRoute("/category/electronics");

    await screen.findByText("Category - Electronics");

    fireEvent.click(screen.getByTestId("switch-to-/category/books"));

    await waitFor(() => expect(axiosGetSpy).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Category - Books")).toBeInTheDocument();
    expect(screen.getByText("Testing Strategies")).toBeInTheDocument();

    expect(axiosGetSpy).toHaveBeenNthCalledWith(
      1,
      "/api/v1/product/product-category/electronics"
    );
    expect(axiosGetSpy).toHaveBeenNthCalledWith(
      2,
      "/api/v1/product/product-category/books"
    );
  });
});
