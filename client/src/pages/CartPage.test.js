import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import CartPage from "./CartPage";

// Mock imports
jest.mock("../components/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn() }));
jest.mock("braintree-web-drop-in-react", () => () => <div data-testid="dropin" />);
jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));
jest.mock("../context/auth", () => ({
  useAuth: jest.fn(),
}));
jest.mock("axios");

describe("CartPage Component", () => {
  const { useCart } = require("../context/cart");
  const { useAuth } = require("../context/auth");

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue([{ user: null, token: "" }, jest.fn()]);
  });

  describe("CartPage total price", () => {
    it("calls reduce and toLocaleString on cart items", async () => {
      useCart.mockReturnValue([[], jest.fn()]);
      reduceSpy = jest.spyOn(Array.prototype, "reduce");
      toLocaleSpy = jest.spyOn(Number.prototype, "toLocaleString");

      render(<CartPage />);
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      expect(reduceSpy.mock.calls.length).toBeGreaterThan(0);
      expect(toLocaleSpy.mock.calls.length).toBeGreaterThan(0);
      expect(toLocaleSpy).toHaveBeenCalledWith(
        "en-US", { style: "currency", currency: "USD" }
      );
    });

    it("shows $0.00 when cart is empty", () => {
      useCart.mockReturnValue([[], jest.fn()]);

      render(<CartPage />);

      expect(screen.getByText(/Total\s*:\s*\$0\.00/i)).toBeInTheDocument();
    });

    it("correctly computes and formats total", () => {
      const fakeCart = [
        { _id: "1", name: "A", description: "foo", price: 1 },
        { _id: "2", name: "B", description: "bar", price: 2 },
        { _id: "3", name: "C", description: "baz", price: 3 },
      ];
      useCart.mockReturnValue([fakeCart, jest.fn()]);

      render(<CartPage />);

      expect(screen.getByText(/Total\s*:\s*\$6/i)).toBeInTheDocument();
    });

    it("correctly computes and formats total with decimal places", () => {
      const fakeCart = [
        { _id: "1", name: "A", description: "foo", price: 1.23 },
        { _id: "2", name: "B", description: "bar", price: 2.46 },
        { _id: "3", name: "C", description: "baz", price: 3.7 },
      ];
      useCart.mockReturnValue([fakeCart, jest.fn()]);

      render(<CartPage />);

      expect(screen.getByText(/Total\s*:\s*\$7\.39/i)).toBeInTheDocument();
    });

    it("logs error if cart is null", () => {
      useCart.mockReturnValue([null, jest.fn()]);
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });

      render(<CartPage />);

      expect(logSpy).toHaveBeenCalled();
      const hadOurError = logSpy.mock.calls.some(
        // specifically TypeError since we are tryin to reduce on a null obj
        ([arg]) => arg instanceof TypeError
      );
      expect(hadOurError).toBe(true);
      expect(screen.getByText(/Total :/i)).toBeInTheDocument();
    });

    it("logs error if cart item prices are not numbers", () => {
      const fakeCart = [
        { _id: "1", name: "A", description: "foo", price: "1.23" },
        { _id: "2", name: "B", description: "foo", price: "1.21231233" },
      ];
      useCart.mockReturnValue([fakeCart, jest.fn()]);
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });

      render(<CartPage />);

      expect(logSpy).toHaveBeenCalled();
      const hadOurError = logSpy.mock.calls.some(
        ([arg]) => arg instanceof Error && arg.message.includes("Invalid price at index")
      );
      expect(hadOurError).toBe(true);
      expect(screen.getByText(/Total :/i)).toBeInTheDocument();
    });

    it("logs error if cart item prices are negative", () => {
      const fakeCart = [
        { _id: "1", name: "A", description: "foo", price: -1.23 },
        { _id: "2", name: "B", description: "foo", price: -2 },
      ];
      useCart.mockReturnValue([fakeCart, jest.fn()]);
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });

      render(<CartPage />);

      expect(logSpy).toHaveBeenCalled();
      const hadOurError = logSpy.mock.calls.some(
        ([arg]) => arg instanceof Error && arg.message.includes("Invalid price at index")
      );
      expect(hadOurError).toBe(true);
      expect(screen.getByText(/Total :/i)).toBeInTheDocument();
    });

    it("logs error if any other error is thrown during calculation", () => {
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });
      const reduceSpy = jest
        .spyOn(Array.prototype, "reduce")
        .mockImplementationOnce(() => {
          throw new Error("calc fail");
        });


      render(<CartPage />);

      expect(logSpy).toHaveBeenCalled();
      const hadOurError = logSpy.mock.calls.some(
        ([arg]) => arg instanceof Error && arg.message === "calc fail"
      );
      expect(hadOurError).toBe(true);
      expect(screen.getByText(/Total\s*:/i)).toBeInTheDocument();
    });
  });

  describe("removeCartItem", () => {
    it("triggers update interactions when clicking remove button ", async () => {
      const setItemSpy = jest.spyOn(window.localStorage.__proto__, "setItem");
      const initialCart = [
        { _id: "1", name: "A", description: "bar", price: 1 },
        { _id: "2", name: "B", description: "foo", price: 2 },
        { _id: "3", name: "C", description: "baz", price: 3 },
      ];
      const setCart = jest.fn();
      useCart.mockReturnValue([initialCart, setCart]);

      render(<CartPage />);
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // find the button for item B and simulate clicking "remove"
      const cardRows = screen.getAllByRole("button", { name: /remove/i })
        .map(btn => btn.closest(".row.card"));
      const rowWithB = cardRows.find(row => within(row).queryByText("B"));
      const removeBtn = within(rowWithB).getByRole("button", { name: /remove/i });
      await userEvent.click(removeBtn);

      // verify update interaction with cart
      expect(setCart).toHaveBeenCalledTimes(1);
      const newCart = setCart.mock.calls[0][0];
      expect(setItemSpy).toHaveBeenCalledWith(
        "cart",
        JSON.stringify(newCart)
      );

      setItemSpy.mockRestore();
    });

    it("removes respective item when clicking remove button", async () => {
      const initialCart = [
        { _id: "1", name: "A", description: "bar", price: 1 },
        { _id: "2", name: "B", description: "foo", price: 2 },
        { _id: "3", name: "C", description: "baz", price: 3 },
      ];
      const setCart = jest.fn();
      useCart.mockReturnValue([initialCart, setCart]);

      render(<CartPage />);
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // find the button for item B and simulate clicking "remove"
      const cardRows = screen.getAllByRole("button", { name: /remove/i })
        .map(btn => btn.closest(".row.card"));
      const rowWithB = cardRows.find(row => within(row).queryByText("B"));
      const removeBtn = within(rowWithB).getByRole("button", { name: /remove/i });
      await userEvent.click(removeBtn);

      const newCart = setCart.mock.calls[0][0];
      expect(newCart).toEqual([
        { _id: "1", name: "A", description: "bar", price: 1 },
        { _id: "3", name: "C", description: "baz", price: 3 },
      ]);
      expect(newCart).not.toBe(initialCart);
    });

    it("supports multiple removals and smoothly removes first and last items", async () => {
      const initialCart = [
        { _id: "1", name: "A", description: "bar", price: 1 },
        { _id: "2", name: "B", description: "foo", price: 2 },
        { _id: "3", name: "C", description: "baz", price: 3 },
      ];
      const setCart = jest.fn();
      useCart.mockReturnValue([initialCart, setCart]);

      const { rerender } = render(<CartPage />);
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // find the button for items A and C and simulate clicking "remove"
      let cardRows = screen.getAllByRole("button", { name: /remove/i })
        .map(btn => btn.closest(".row.card"));
      const rowWithA = cardRows.find(row => within(row).queryByText("A"));
      const removeBtnA = within(rowWithA).getByRole("button", { name: /remove/i });
      await userEvent.click(removeBtnA);

      useCart.mockReturnValue([setCart.mock.calls[0][0], setCart]);
      rerender(<CartPage />);

      cardRows = screen.getAllByRole("button", { name: /remove/i })
        .map(btn => btn.closest(".row.card"));
      const rowWithC = cardRows.find(row => within(row).queryByText("C"));
      const removeBtnC = within(rowWithC).getByRole("button", { name: /remove/i });
      await userEvent.click(removeBtnC);

      const finalCart = setCart.mock.calls[1][0];
      expect(finalCart).toEqual([
        { _id: "2", name: "B", description: "foo", price: 2 },
      ]);
      expect(finalCart).not.toBe(initialCart);
    });
  });

  
});
