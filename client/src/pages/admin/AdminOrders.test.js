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

jest.mock("moment", () => () => ({ fromNow: () => "3 days ago" }));

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

  Select.Option = Option;

  return { Select, __esModule: true };
});

const mkOrder = (overrides = {}) => ({
  _id: "orderX",
  status: "Processing",
  buyer: { name: "Buyer X" },
  createAt: new Date().toISOString(),
  payment: { success: true },
  products: [
    {
      _id: "prodX",
      name: "Rope 60m",
      description: "Durable dynamic rope for sport and trad climbing.",
      price: 199,
    },
  ],
  ...overrides,
});


const ordersPayload = [
  {
    _id: "order1",
    status: "Not Processed",
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

  it("renders table headers and default status value", async () => {
    axios.get.mockResolvedValueOnce({ data: [mkOrder({ status: "Shipped" })] });
    render(<AdminOrders />);

    const table = await screen.findByRole("table");
    // header labels
    expect(table).toHaveTextContent("#");
    expect(table).toHaveTextContent("Status");
    expect(table).toHaveTextContent("Buyer");
    expect(table).toHaveTextContent("Date");
    expect(table).toHaveTextContent("Payment");
    expect(table).toHaveTextContent("Quantity");

    const select = await screen.findByLabelText("status-select");
    expect(select).toHaveValue("Shipped");
  });

  it("renders the full status option set for each order", async () => {
    axios.get.mockResolvedValueOnce({ data: [mkOrder()] });
    render(<AdminOrders />);

    const select = await screen.findByLabelText("status-select");
    const options = Array.from(select.querySelectorAll("option")).map(o => o.textContent);
    expect(options).toEqual([
      "Not Processed",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ]);
  });

  it("shows Success when payment.success is true", async () => {
    axios.get.mockResolvedValueOnce({ data: [mkOrder({ payment: { success: true } })] });
    render(<AdminOrders />);

    const table = await screen.findByRole("table");
    expect(table).toHaveTextContent("Success");
  });

  it("shows Failed when payment.success is false", async () => {
    axios.get.mockResolvedValueOnce({ data: [mkOrder({ payment: { success: false } })] });
    render(<AdminOrders />);

    const table = await screen.findByRole("table");
    expect(table).toHaveTextContent("Failed");
  });

  it("truncates product description to 30 characters", async () => {
    const long = "ABCDEFGHIJKLMNOPQRSTUVWXYZ012345 more text";
    axios.get.mockResolvedValueOnce({
      data: [mkOrder({ products: [{ _id: "p", name: "Cam", description: long, price: 1 }] })],
    });
    render(<AdminOrders />);

    const truncated = long.substring(0, 30);
    const row = await screen.findByText("Cam");
    const card = row.closest(".row");
    expect(card).toHaveTextContent(truncated);
    // should not contain the full long tail
    expect(card).not.toHaveTextContent(" more text");
  });

  it("renders product image with correct src and alt", async () => {
    axios.get.mockResolvedValueOnce({ data: [mkOrder()] });
    render(<AdminOrders />);

    const img = await screen.findByAltText("Rope 60m");
    expect(img).toHaveAttribute("src", "/api/v1/product/product-photo/prodX");
  });

  it("renders multiple orders with correct index and quantity", async () => {
    const two = [
      mkOrder({ _id: "o1", products: [{ _id: "a", name: "A", description: "x", price: 1 }] }),
      mkOrder({ _id: "o2", buyer: { name: "Buyer Y" },
        products: [{ _id: "b", name: "B", description: "y", price: 2 }, { _id: "c", name: "C", description: "z", price: 3 }] }),
    ];
    axios.get.mockResolvedValueOnce({ data: two });
    render(<AdminOrders />);

    const tables = await screen.findAllByRole("table");
    // first row should show index "1" and quantity "1"
    expect(tables[0]).toHaveTextContent("1");
    expect(tables[0]).toHaveTextContent("Buyer X"); // default name for mkOrder unless overridden
    expect(tables[0]).toHaveTextContent("1"); // quantity cell (products length)

    // second should show index "2" and quantity "2"
    expect(tables[1]).toHaveTextContent("2");
    expect(tables[1]).toHaveTextContent("Buyer Y");
    expect(tables[1]).toHaveTextContent("2");
});

  it("handles GET error gracefully and keeps page stable", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockRejectedValueOnce(new Error("Network down"));

    render(<AdminOrders />);
    // heading still renders, no table
    expect(await screen.findByText("All Orders")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    spy.mockRestore();
  });

  it("handles PUT error without crashing and keeps UI rendered", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockResolvedValueOnce({ data: [mkOrder({ _id: "order1" })] });
    axios.put.mockRejectedValueOnce(new Error("PUT failed"));

    render(<AdminOrders />);

    const select = await screen.findByLabelText("status-select");
    fireEvent.change(select, { target: { value: "Cancelled" } });

    await waitFor(() => expect(axios.put).toHaveBeenCalled());
    // heading still there
    expect(screen.getByText("All Orders")).toBeInTheDocument();

    spy.mockRestore();
  });

  it("renders zero orders gracefully (no tables)", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });
    render(<AdminOrders />);

    expect(await screen.findByText("All Orders")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("handles empty buyer name and empty products list", async () => {
    axios.get.mockResolvedValueOnce({
      data: [mkOrder({ buyer: { name: "" }, products: [] })],
    });
    render(<AdminOrders />);

    const table = await screen.findByRole("table");
    // Buyer cell ends up empty string—still renders
    expect(table).toBeInTheDocument();
    // quantity 0 should show as "0"
    expect(table).toHaveTextContent("0");
  });

  it("uses index as key when _id is missing (branch coverage)", async () => {
    // build an order WITH id, then strip it to ensure the branch runs
    const withId = {
      _id: "should-be-removed",
      status: "Processing",
      buyer: { name: "No ID Buyer" },
      createAt: new Date().toISOString(),
      payment: { success: true },
      products: [{ _id: "p1", name: "Item", description: "desc", price: 1 }],
    };
    const { _id, ...noIdOrder } = withId; // remove _id

    axios.get.mockResolvedValueOnce({ data: [noIdOrder] });

    render(<AdminOrders />);

    // wait for UI
    const tables = await screen.findAllByRole("table");
    expect(tables).toHaveLength(1);
    // sanity: content still renders
    expect(tables[0]).toHaveTextContent("No ID Buyer");
  });

});
