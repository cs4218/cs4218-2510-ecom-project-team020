import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import AdminOrders from "./AdminOrders";
import axios from "axios";
import { useAuth } from "../../context/auth";

jest.mock("axios");
jest.mock("../../context/auth", () => ({ useAuth: jest.fn() }));

jest.mock("../../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));
jest.mock("../../components/AdminMenu", () => ({
  __esModule: true,
  default: () => <nav data-testid="admin-menu">admin menu</nav>,
}));

// Mock AntD Select → simple native <select>
// in AdminOrders.test.js (or a central __mocks__/antd.js)
jest.mock("antd", () => {
  const React = require("react");

  const Select = ({ defaultValue, onChange, children, bordered, ...rest }) => (
    <select
      aria-label="status-select"
      defaultValue={defaultValue}
      onChange={(e) => onChange?.(e.target.value)}
      {...rest}
    >
      {children}
    </select>
  );

  const Option = ({ value, children, ...rest }) => (
    <option value={value} {...rest}>
      {children}
    </option>
  );

  // 👈 critical line: mirror antd’s API
  Select.Option = Option;

  // Only export Select; your component gets Option from Select
  return { Select, __esModule: true };
});


const ordersPayload = [
  {
    _id: "order1",
    status: "Not Process",
    buyer: { name: "Alicia" },
    createAt: new Date().toISOString(),
    payment: { success: true },
    products: [
      { _id: "p1", name: "Rope", description: "Dynamic rope 9.8mm", price: 129 },
    ],
  },
];

describe("AdminOrders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue([{ token: "token123" }, jest.fn()]);
  });

  it("fetches and displays orders", async () => {
    axios.get.mockResolvedValueOnce({ data: ordersPayload });
    render(<AdminOrders />);

    expect(await screen.findByText("All Orders")).toBeInTheDocument();
    expect(await screen.findByText("Alicia")).toBeInTheDocument();
    expect(await screen.findByText("Rope")).toBeInTheDocument();

    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
  });

  it("updates order status and refetches", async () => {
    axios.get.mockResolvedValueOnce({ data: ordersPayload });
    axios.put.mockResolvedValueOnce({ data: { ok: true } });
    axios.get.mockResolvedValueOnce({ data: ordersPayload }); // refetch

    render(<AdminOrders />);

    const select = await screen.findByLabelText("status-select");
    fireEvent.change(select, { target: { value: "Processing" } });

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/auth/order-status/order1",
        { status: "Processing" }
      );
    });
    expect(axios.get).toHaveBeenLastCalledWith("/api/v1/auth/all-orders");
  });

  it("does not fetch without auth token", () => {
    useAuth.mockReturnValueOnce([{}, jest.fn()]);
    render(<AdminOrders />);
    expect(axios.get).not.toHaveBeenCalled();
  });
});
