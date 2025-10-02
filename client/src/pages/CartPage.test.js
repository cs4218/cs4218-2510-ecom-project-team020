import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import CartPage from "./CartPage";
import { describe } from "node:test";

// Mock imports
jest.mock("../components/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("react-router-dom", () => {
  const navigate = jest.fn();
  return {
    mockNavigate: navigate,
    useNavigate: () => navigate,
  };
});

jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));
jest.mock("../context/auth", () => ({
  useAuth: jest.fn(),
}));
jest.mock("react-hot-toast", () => ({ success: jest.fn(), error: jest.fn() }));
jest.mock("axios");

jest.mock("braintree-web-drop-in-react", () => {
  const React = require("react");
  const holder = { instance: null };

  function MockDropIn(props) {
    React.useEffect(() => {
      if (props.onInstance && holder.instance) {
        props.onInstance(holder.instance);
      }
    }, [props.onInstance]);
    return <div data-testid="dropin" />;
  }
  return {
    __esModule: true,
    default: MockDropIn,
    __setInstance(inst) { holder.instance = inst; },
  };
});

describe("CartPage Component", () => {
  const { useCart } = require("../context/cart");
  const { useAuth } = require("../context/auth");
  const { mockNavigate } = require("react-router-dom");
  const DropInModule = require("braintree-web-drop-in-react");

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

  describe("getToken", () => {
    const endpoint = "/api/v1/product/braintree/token";

    it("calls axios.get with correct endpoint on mount", async () => {
      useCart.mockReturnValue([[], jest.fn()]);

      render(<CartPage />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(endpoint);
        expect(axios.get).toHaveBeenCalledTimes(1);
      });
    });

    it("logs error when axios.get fails", async () => {
      const mockError = new Error("Server error");
      axios.get.mockRejectedValue(mockError);
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });
      useCart.mockReturnValue([[], jest.fn()]);

      render(<CartPage />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(endpoint);
        expect(logSpy).toHaveBeenCalledWith(mockError);
      });

      logSpy.mockRestore();
    });

    it("calls getToken again when auth.token changes", async () => {
      useCart.mockReturnValue([[], jest.fn()]);
      useAuth.mockReturnValue([{ user: null, token: "token1" }, jest.fn()]);

      const { rerender } = render(<CartPage />);
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      useAuth.mockReturnValue([{ user: { name: "Test" }, token: "token2" }, jest.fn()]);
      rerender(<CartPage />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(2);
        expect(axios.get).toHaveBeenCalledWith(endpoint);
      });
    });

    it("does not call getToken again when auth.token stays the same", async () => {
      useCart.mockReturnValue([[], jest.fn()]);
      useAuth.mockReturnValue([{ user: null, token: "token1" }, jest.fn()]);

      const { rerender } = render(<CartPage />);
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      useAuth.mockReturnValue([{ user: { name: "Test" }, token: "token1" }, jest.fn()]);
      rerender(<CartPage />);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(axios.get).toHaveBeenCalledTimes(1);
    });
  });
  describe("handlePayment", () => {
    const toast = require("react-hot-toast");

    beforeEach(() => {
      jest.clearAllMocks();

      axios.get.mockResolvedValue({ data: { clientToken: "fake-token" } });
      useAuth.mockReturnValue([{ user: { name: "name", address: "21 Lower Kent Ridge Rd" }, token: "token" }, jest.fn()]);
      const mockDropinInstance = {
        requestPaymentMethod: jest.fn().mockResolvedValue({ nonce: "fake-nonce" }),
      };
      DropInModule.__setInstance(mockDropinInstance);
    });

    it("should show payment success path interactions", async () => {
      const initialCart = [
        { _id: "p1", name: "A", description: "bar", price: 1.25 },
        { _id: "p2", name: "B", description: "foo", price: 2.5 },
      ];
      const setCart = jest.fn();

      useCart.mockReturnValue([initialCart, setCart]);

      const mockDropinInstance = {
        requestPaymentMethod: jest.fn().mockResolvedValue({ nonce: "fake-nonce" }),
      };
      DropInModule.__setInstance(mockDropinInstance);

      axios.post.mockResolvedValue({ data: { ok: true } });
      const removeSpy = jest.spyOn(window.localStorage.__proto__, "removeItem");

      render(<CartPage />);

      // Wait for DropIn area and for button to enable (instance set)
      await screen.findByTestId("dropin");
      await waitFor(() =>
        expect(screen.getByRole("button", { name: /make payment/i })).toBeEnabled()
      );

      await userEvent.click(screen.getByRole("button", { name: /make payment/i }));

      expect(mockDropinInstance.requestPaymentMethod).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/braintree/payment",
        { nonce: "fake-nonce", cart: initialCart }
      );

      await waitFor(() => {
        expect(setCart).toHaveBeenCalledWith([]);
        expect(removeSpy).toHaveBeenCalledWith("cart");
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/orders");
        expect(toast.success).toHaveBeenCalledWith("Payment Completed Successfully ");
      });

      removeSpy.mockRestore();
    });

    it("should show payment failure path interactions", async () => {
      const initialCart = [{ _id: "p1", name: "A", description: "bar", price: 1.25 }];
      const setCart = jest.fn();

      useCart.mockReturnValue([initialCart, setCart]);

      const mockDropinInstance = {
        requestPaymentMethod: jest.fn().mockResolvedValue({ nonce: "fake-nonce" }),
      };
      DropInModule.__setInstance(mockDropinInstance);

      const err = new Error("payment failed");
      axios.post.mockRejectedValue(err);
      const removeSpy = jest.spyOn(window.localStorage.__proto__, "removeItem");
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });

      render(<CartPage />);

      await screen.findByTestId("dropin");
      await waitFor(() =>
        expect(screen.getByRole("button", { name: /make payment/i })).toBeEnabled()
      );

      await userEvent.click(screen.getByRole("button", { name: /make payment/i }));

      expect(mockDropinInstance.requestPaymentMethod).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/braintree/payment",
        { nonce: "fake-nonce", cart: initialCart }
      );

      await waitFor(() => {
        expect(logSpy).toHaveBeenCalledWith(err);
        expect(setCart).not.toHaveBeenCalledWith([]);
        expect(removeSpy).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(toast.success).not.toHaveBeenCalled();
        expect(screen.getByRole("button", { name: /make payment/i })).toBeEnabled();
      });

      removeSpy.mockRestore();
      logSpy.mockRestore();
    });

  });
});