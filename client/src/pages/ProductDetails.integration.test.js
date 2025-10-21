import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

import ProductDetails from "./ProductDetails";
import { CartProvider } from "../context/cart";

jest.mock("../components/Layout", () => {
  return function LayoutStub({ children }) {
    return <div data-testid="layout-stub">{children}</div>;
  };
});

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
}));

const toast = require("react-hot-toast");

const renderProductDetailsRoute = (slug = "main-product") =>
  render(
    <MemoryRouter initialEntries={[`/product/${slug}`]}>
      <CartProvider>
        <Routes>
          <Route path="/product/:slug" element={<ProductDetails />} />
        </Routes>
      </CartProvider>
    </MemoryRouter>
  );

describe("ProductDetails integration", () => {
  let axiosGetSpy;

  beforeEach(() => {
    axiosGetSpy = jest.spyOn(axios, "get");
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    axiosGetSpy.mockRestore();
  });

  it("loads product data and appends it to the existing cart with persistence", async () => {
    const existingItem = {
      _id: "existing-1",
      name: "Existing Cart Item",
      price: 40,
    };
    localStorage.setItem("cart", JSON.stringify([existingItem]));

    const product = {
      _id: "prod-100",
      name: "Integration Phone",
      description: "Flagship phone",
      price: 899,
      slug: "main-product",
      category: { _id: "cat-1", name: "Phones" },
    };

    axiosGetSpy
      .mockResolvedValueOnce({ data: { product } })
      .mockResolvedValueOnce({ data: { products: [] } });

    renderProductDetailsRoute("main-product");

    await screen.findByText(/Name : Integration Phone/);

    fireEvent.click(screen.getByText("ADD TO CART"));

    await waitFor(() => {
      const persisted = JSON.parse(localStorage.getItem("cart"));
      expect(persisted).toEqual([existingItem, product]);
    });
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  it("adds related products to the cart and disables navigation when slug missing", async () => {
    const product = {
      _id: "prod-200",
      name: "Integration Laptop",
      description: "Developer focused",
      price: 1599,
      slug: "integration-laptop",
      category: { _id: "cat-2", name: "Laptops" },
    };

    const related = [
      {
        _id: "rel-1",
        name: "Docking Station",
        description: "USB-C hub",
        price: 199,
        slug: "docking-station",
      },
      {
        _id: "rel-2",
        name: "Mystery Accessory",
        description: "No slug product",
        price: 49,
        slug: null,
      },
    ];

    axiosGetSpy
      .mockResolvedValueOnce({ data: { product } })
      .mockResolvedValueOnce({ data: { products: related } });

    renderProductDetailsRoute("integration-laptop");

    await screen.findByText(/Name : Integration Laptop/);

    const addButtons = await screen.findAllByRole("button", {
      name: "ADD TO CART",
    });
    expect(addButtons).toHaveLength(3);

    fireEvent.click(addButtons[1]);
    await waitFor(() => {
      const persisted = JSON.parse(localStorage.getItem("cart"));
      expect(persisted).toEqual([related[0]]);
    });
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");

    const moreDetailsButtons = screen.getAllByRole("button", {
      name: "More Details",
    });
    expect(moreDetailsButtons[1]).toBeDisabled();
  });

  it("navigates to a related product and fetches new details", async () => {
    const mainProduct = {
      _id: "prod-main",
      name: "Primary Camera",
      description: "Shoots 4K video",
      price: 1200,
      slug: "primary-camera",
      category: { _id: "cat-camera", name: "Cameras" },
    };

    const relatedProduct = {
      _id: "prod-related",
      name: "Travel Tripod",
      description: "Compact and sturdy",
      price: 250,
      slug: "travel-tripod",
      category: { _id: "cat-accessory", name: "Accessories" },
    };

    axiosGetSpy
      .mockResolvedValueOnce({ data: { product: mainProduct } }) // initial product
      .mockResolvedValueOnce({ data: { products: [relatedProduct] } }) // related for initial product
      .mockResolvedValueOnce({ data: { product: relatedProduct } }) // product after navigation
      .mockResolvedValueOnce({ data: { products: [] } }); // related products for new product

    renderProductDetailsRoute("primary-camera");

    await screen.findByText(/Name : Primary Camera/);

    const moreDetailsButton = await screen.findByRole("button", {
      name: "More Details",
    });

    fireEvent.click(moreDetailsButton);

    await screen.findByText(/Name : Travel Tripod/);
    expect(axiosGetSpy).toHaveBeenCalledWith(
      "/api/v1/product/get-product/travel-tripod"
    );
  });
});
