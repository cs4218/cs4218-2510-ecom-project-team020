import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  MemoryRouter,
  Routes,
  Route,
  useParams,
} from "react-router-dom";
import axios from "axios";

import SearchInput from "../components/Form/SearchInput";
import Search from "./Search";
import { SearchProvider } from "../context/search";
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

const ProductRouteProbe = () => {
  const { slug } = useParams();
  return <div data-testid="product-route">Product page for {slug}</div>;
};

const renderSearchFlow = () =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <CartProvider>
        <SearchProvider>
          <Routes>
            <Route path="/" element={<SearchInput />} />
            <Route path="/search" element={<Search />} />
            <Route path="/product/:slug" element={<ProductRouteProbe />} />
          </Routes>
        </SearchProvider>
      </CartProvider>
    </MemoryRouter>
  );

describe("Search workflow integration", () => {
  let axiosGetSpy;

  beforeEach(() => {
    axiosGetSpy = jest.spyOn(axios, "get");
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    axiosGetSpy.mockRestore();
  });

  it("searches products, displays results, and persists cart updates", async () => {
    const product = {
      _id: "product-101",
      name: "Modern Phone",
      description: "A flagship device",
      price: 799,
      slug: "modern-phone",
    };

    axiosGetSpy.mockResolvedValueOnce({ data: [product] });

    renderSearchFlow();

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: "phone" },
    });

    fireEvent.submit(screen.getByRole("search"));

    await waitFor(() =>
      expect(axiosGetSpy).toHaveBeenCalledWith("/api/v1/product/search/phone")
    );

    await screen.findByText("Found 1");
    expect(screen.getByText("Modern Phone")).toBeInTheDocument();

    fireEvent.click(screen.getByText("ADD TO CART"));

    await waitFor(() =>
      expect(localStorage.getItem("cart")).toEqual(JSON.stringify([product]))
    );
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  it("navigates to product details for slugged results and disables missing slugs", async () => {
    const navigable = {
      _id: "product-111",
      name: "Travel Backpack",
      description: "Carry-on friendly",
      price: 120,
      slug: "travel-backpack",
    };
    const missingSlug = {
      _id: "product-222",
      name: "Mystery Item",
      description: "No slug provided",
      price: 10,
      slug: null,
    };

    axiosGetSpy.mockResolvedValueOnce({ data: [navigable, missingSlug] });

    renderSearchFlow();

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: "bag" },
    });

    fireEvent.submit(screen.getByRole("search"));

    await waitFor(() =>
      expect(axiosGetSpy).toHaveBeenCalledWith("/api/v1/product/search/bag")
    );

    const cards = await screen.findAllByRole("button", {
      name: "More Details",
    });

    const [enabledButton, disabledButton] = cards;
    expect(enabledButton).not.toBeDisabled();
    expect(disabledButton).toBeDisabled();

    const addToCartButtons = screen.getAllByRole("button", {
      name: "ADD TO CART",
    });
    expect(addToCartButtons).toHaveLength(2);

    fireEvent.click(enabledButton);

    await waitFor(() =>
      expect(screen.getByTestId("product-route")).toHaveTextContent(
        "Product page for travel-backpack"
      )
    );
  });

  it("appends search results to an existing cart retrieved from storage", async () => {
    const existingCartItem = {
      _id: "existing-1",
      name: "Legacy Item",
      description: "Previously saved item",
      price: 45,
      slug: "legacy-item",
    };
    localStorage.setItem("cart", JSON.stringify([existingCartItem]));

    const searchedProduct = {
      _id: "product-333",
      name: "Fresh Gadget",
      description: "Brand new tech",
      price: 299,
      slug: "fresh-gadget",
    };

    axiosGetSpy.mockResolvedValueOnce({ data: [searchedProduct] });

    renderSearchFlow();

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: "gadget" },
    });
    fireEvent.submit(screen.getByRole("search"));

    await waitFor(() =>
      expect(axiosGetSpy).toHaveBeenCalledWith("/api/v1/product/search/gadget")
    );
    await screen.findByText("Found 1");

    fireEvent.click(screen.getByText("ADD TO CART"));

    await waitFor(() => {
      const persisted = JSON.parse(localStorage.getItem("cart"));
      expect(persisted).toEqual([existingCartItem, searchedProduct]);
    });
  });
});
