import React from "react";
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from "@testing-library/react";
import Orders from "./Orders";
import axios from "axios";
import '@testing-library/jest-dom/extend-expect';

jest.mock("axios");
jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [[], jest.fn()]),
}));

jest.mock("../../hooks/useCategory", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));

const mockUseAuth = jest.fn();
jest.mock('../../context/auth', () => ({
  useAuth: () => mockUseAuth()
}));

describe("Orders Component", () => {
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it("calls getOrders when auth token exists", async () => {
    mockUseAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter initialEntries={['/dashboard/user/orders']}>
        <Orders />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
    });
  });

  it("does not call getOrders when auth token is null", async () => {
    mockUseAuth.mockReturnValue([{ token: null }, jest.fn()]);

    render(
      <MemoryRouter initialEntries={['/dashboard/user/orders']}>
        <Orders />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("All Orders")).toBeInTheDocument();
    });

    expect(axios.get).not.toHaveBeenCalled();
  });

  it("does not call getOrders when auth is undefined", async () => {
    mockUseAuth.mockReturnValue([undefined, jest.fn()]);

    render(
      <MemoryRouter initialEntries={['/dashboard/user/orders']}>
        <Orders />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("All Orders")).toBeInTheDocument();
    });

    expect(axios.get).not.toHaveBeenCalled();
  });

  it("does not call getOrders when auth object exists but token is undefined", async () => {
    mockUseAuth.mockReturnValue([{}, jest.fn()]);

    render(
      <MemoryRouter initialEntries={['/dashboard/user/orders']}>
        <Orders />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("All Orders")).toBeInTheDocument();
    });

    expect(axios.get).not.toHaveBeenCalled();
  });

  it("renders orders when API call succeeds with data", async () => {
    mockUseAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
    axios.get.mockResolvedValue({
      data: [
        {
          _id: "order1",
          status: "Not Process",
          buyer: { name: "John" },
          createAt: new Date().toISOString(),
          payment: { success: true },
          products: [
            { 
              _id: "prod1", 
              name: "Test Product", 
              description: "description", 
              price: 25.99 
            }
          ]
        }
      ]
    });

    render(
      <MemoryRouter initialEntries={['/dashboard/user/orders']}>
        <Orders />
      </MemoryRouter>
    );

    expect(await screen.findByText("Not Process")).toBeInTheDocument();
    expect(await screen.findByText("John")).toBeInTheDocument();
    expect(await screen.findByText("Success")).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(2);
    expect(await screen.findByText("Test Product")).toBeInTheDocument();
    expect(await screen.findByText("description")).toBeInTheDocument();
    expect(await screen.findByText(/Price : 25.99/)).toBeInTheDocument();

    const productImg = await screen.findByAltText("Test Product");
    expect(productImg).toBeInTheDocument();
    expect(productImg).toHaveAttribute(
      "src",
      "/api/v1/product/product-photo/prod1"
    );
  });

  it("handles API error gracefully and logs error", async () => {
    mockUseAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
    const mockError = new Error("Network error");
    axios.get.mockRejectedValue(mockError);

    render(
      <MemoryRouter initialEntries={['/dashboard/user/orders']}>
        <Orders />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(mockError);
    });

    expect(screen.getByText("All Orders")).toBeInTheDocument();
  });

  it("renders empty state when API returns empty array and no table should be renderd", async () => {
    mockUseAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter initialEntries={['/dashboard/user/orders']}>
        <Orders />
      </MemoryRouter>
    );

    expect(await screen.findByText("All Orders")).toBeInTheDocument();
    
    const tables = screen.queryAllByRole('table');
    expect(tables).toHaveLength(0);
    
    expect(screen.queryByText("Price")).not.toBeInTheDocument();
    expect(screen.queryByText("Success")).not.toBeInTheDocument();
  });

  it("renders multiple orders with multiple products", async () => {
    mockUseAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
    axios.get.mockResolvedValue({
      data: [
        {
          _id: "order1",
          status: "Shipped",
          buyer: { name: "Alice" },
          createAt: new Date().toISOString(),
          payment: { success: true },
          products: [
            { 
              _id: "prod1", 
              name: "Product One", 
              description: "First product with a longer description", 
              price: 15.50 
            },
            { 
              _id: "prod2", 
              name: "Product Two", 
              description: "Second product", 
              price: 32.00 
            }
          ]
        },
        {
          _id: "order2",
          status: "Delivered",
          buyer: { name: "Alice" },
          createAt: new Date().toISOString(),
          payment: { success: false },
          products: [
            { 
              _id: "prod3", 
              name: "Product Three", 
              description: "Third product description here", 
              price: 8.99 
            }
          ]
        }
      ]
    });

    render(
      <MemoryRouter initialEntries={['/dashboard/user/orders']}>
        <Orders />
      </MemoryRouter>
    );

    expect(await screen.findByText("Shipped")).toBeInTheDocument();
    expect(await screen.findByText("Success")).toBeInTheDocument();
    expect(await screen.findByText("Delivered")).toBeInTheDocument();
    expect(await screen.findByText("Failed")).toBeInTheDocument();

    expect(screen.getAllByText("Alice")).toHaveLength(2);
    expect(screen.getAllByText("2")).toHaveLength(2);
    expect(screen.getAllByText("1")).toHaveLength(2);
  
    expect(await screen.findByText("Product One")).toBeInTheDocument();
    expect(await screen.findByText("Product Two")).toBeInTheDocument();
    expect(await screen.findByText("Product Three")).toBeInTheDocument();
    
    expect(await screen.findByText("First product with a longer de")).toBeInTheDocument();
    expect(await screen.findByText("Second product")).toBeInTheDocument();
    expect(await screen.findByText("Third product description here")).toBeInTheDocument();
    
    expect(await screen.findByText(/Price : 15.5/)).toBeInTheDocument();
    expect(await screen.findByText(/Price : 32/)).toBeInTheDocument();
    expect(await screen.findByText(/Price : 8.99/)).toBeInTheDocument();

    const productImages = await screen.findAllByRole('img');
    expect(productImages).toHaveLength(3);
    expect(productImages[0]).toHaveAttribute('src', '/api/v1/product/product-photo/prod1');
    expect(productImages[1]).toHaveAttribute('src', '/api/v1/product/product-photo/prod2');
    expect(productImages[2]).toHaveAttribute('src', '/api/v1/product/product-photo/prod3');
  });
});
