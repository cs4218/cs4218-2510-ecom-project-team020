jest.mock("../models/orderModel.js");
jest.mock("dotenv");

jest.mock("braintree", () => {
  const mockGateway = {
    clientToken: {
      generate: jest.fn(),
    },
    transaction: {
      sale: jest.fn(),
    },
  };

  return {
    BraintreeGateway: jest.fn(() => mockGateway),
    Environment: {
      Sandbox: "sandbox",
    },
  };
});

import {
  braintreeTokenController,
  brainTreePaymentController,
} from "./paymentController.js";

import orderModel from "../models/orderModel.js";

// Mock response helper
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("PaymentController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("braintreeTokenController", () => {
    it("should generate client token successfully", async () => {
      const req = {};
      const res = mockResponse();

      // Import braintree to get access to the mocked instance
      const braintree = require("braintree");
      const gateway = new braintree.BraintreeGateway();

      const mockResponse1 = { clientToken: "test-token" };
      gateway.clientToken.generate.mockImplementation((options, callback) => {
        callback(null, mockResponse1);
      });

      await braintreeTokenController(req, res);

      expect(gateway.clientToken.generate).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(mockResponse1);
    });

    it("should handle token generation error", async () => {
      const req = {};
      const res = mockResponse();

      const braintree = require("braintree");
      const gateway = new braintree.BraintreeGateway();

      const mockError = new Error("Token generation failed");
      gateway.clientToken.generate.mockImplementation((options, callback) => {
        callback(mockError, null);
      });

      await braintreeTokenController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(mockError);
    });

    it("should handle synchronous errors in try-catch block", async () => {
      const req = {};
      const res = mockResponse();

      const braintree = require("braintree");
      const gateway = new braintree.BraintreeGateway();

      // Mock gateway to throw synchronous error
      gateway.clientToken.generate.mockImplementation(() => {
        throw new Error("Synchronous error");
      });

      await braintreeTokenController(req, res);

      // The controller catches errors but doesn't send response in catch block
      // This test ensures no unhandled errors occur
      expect(gateway.clientToken.generate).toHaveBeenCalled();
    });
  });

  describe("brainTreePaymentController", () => {
    it("should process payment successfully", async () => {
      const req = {
        body: {
          nonce: "test-nonce",
          cart: [
            { _id: "1", name: "Product 1", price: 100 },
            { _id: "2", name: "Product 2", price: 200 },
          ],
        },
        user: { _id: "user123" },
      };
      const res = mockResponse();

      const braintree = require("braintree");
      const gateway = new braintree.BraintreeGateway();

      const mockResult = { id: "transaction123", success: true };
      gateway.transaction.sale.mockImplementation((options, callback) => {
        callback(null, mockResult);
      });

      const mockSave = jest.fn().mockResolvedValue(true);
      orderModel.mockImplementation(() => ({
        save: mockSave,
      }));

      await brainTreePaymentController(req, res);

      expect(gateway.transaction.sale).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 300,
          paymentMethodNonce: "test-nonce",
          options: {
            submitForSettlement: true,
          },
        }),
        expect.any(Function)
      );
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it("should handle payment error", async () => {
      const req = {
        body: {
          nonce: "test-nonce",
          cart: [{ _id: "1", name: "Product 1", price: 100 }],
        },
        user: { _id: "user123" },
      };
      const res = mockResponse();

      const braintree = require("braintree");
      const gateway = new braintree.BraintreeGateway();

      const mockError = new Error("Payment failed");
      gateway.transaction.sale.mockImplementation((options, callback) => {
        callback(mockError, null);
      });

      await brainTreePaymentController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Payment failed" });
    });

    it("should calculate total correctly with multiple items", async () => {
      const req = {
        body: {
          nonce: "test-nonce",
          cart: [
            { _id: "1", price: 99.99 },
            { _id: "2", price: 149.99 },
            { _id: "3", price: 50.02 },
          ],
        },
        user: { _id: "user123" },
      };
      const res = mockResponse();

      const braintree = require("braintree");
      const gateway = new braintree.BraintreeGateway();

      const mockResult = { id: "transaction123", success: true };
      gateway.transaction.sale.mockImplementation((options, callback) => {
        callback(null, mockResult);
      });

      const mockSave = jest.fn().mockResolvedValue(true);
      orderModel.mockImplementation(() => ({
        save: mockSave,
      }));

      await brainTreePaymentController(req, res);

      expect(gateway.transaction.sale).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 300, // 99.99 + 149.99 + 50.02 = 300
        }),
        expect.any(Function)
      );
    });

    it("should handle empty cart", async () => {
      const req = {
        body: {
          nonce: "test-nonce",
          cart: [],
        },
        user: { _id: "user123" },
      };
      const res = mockResponse();

      const braintree = require("braintree");
      const gateway = new braintree.BraintreeGateway();

      const mockResult = { id: "transaction123", success: true };
      gateway.transaction.sale.mockImplementation((options, callback) => {
        callback(null, mockResult);
      });

      const mockSave = jest.fn().mockResolvedValue(true);
      orderModel.mockImplementation(() => ({
        save: mockSave,
      }));

      await brainTreePaymentController(req, res);

      expect(gateway.transaction.sale).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 0,
        }),
        expect.any(Function)
      );
    });

    it("should handle cart with single item", async () => {
      const req = {
        body: {
          nonce: "test-nonce",
          cart: [{ _id: "1", price: 49.99 }],
        },
        user: { _id: "user123" },
      };
      const res = mockResponse();

      const braintree = require("braintree");
      const gateway = new braintree.BraintreeGateway();

      const mockResult = { id: "transaction123", success: true };
      gateway.transaction.sale.mockImplementation((options, callback) => {
        callback(null, mockResult);
      });

      const mockSave = jest.fn().mockResolvedValue(true);
      orderModel.mockImplementation(() => ({
        save: mockSave,
      }));

      await brainTreePaymentController(req, res);

      expect(gateway.transaction.sale).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 49.99,
        }),
        expect.any(Function)
      );
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it("should handle decimal precision in price calculations", async () => {
      const req = {
        body: {
          nonce: "test-nonce",
          cart: [
            { _id: "1", price: 19.99 },
            { _id: "2", price: 29.99 },
            { _id: "3", price: 0.01 },
          ],
        },
        user: { _id: "user123" },
      };
      const res = mockResponse();

      const braintree = require("braintree");
      const gateway = new braintree.BraintreeGateway();

      const mockResult = { id: "transaction123", success: true };
      gateway.transaction.sale.mockImplementation((options, callback) => {
        callback(null, mockResult);
      });

      const mockSave = jest.fn().mockResolvedValue(true);
      orderModel.mockImplementation(() => ({
        save: mockSave,
      }));

      await brainTreePaymentController(req, res);

      expect(gateway.transaction.sale).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 49.99, // 19.99 + 29.99 + 0.01 = 49.99
        }),
        expect.any(Function)
      );
    });

    it("should handle network timeout errors", async () => {
      const req = {
        body: {
          nonce: "test-nonce",
          cart: [{ _id: "1", price: 100 }],
        },
        user: { _id: "user123" },
      };
      const res = mockResponse();

      const braintree = require("braintree");
      const gateway = new braintree.BraintreeGateway();

      const timeoutError = new Error("Network timeout");
      timeoutError.code = "TIMEOUT";
      gateway.transaction.sale.mockImplementation((options, callback) => {
        callback(timeoutError, null);
      });

      await brainTreePaymentController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Payment failed" });
    });

    it("should create order after successful payment", async () => {
      const req = {
        body: {
          nonce: "test-nonce",
          cart: [{ _id: "1", price: 100 }],
        },
        user: { _id: "user123" },
      };
      const res = mockResponse();

      const braintree = require("braintree");
      const gateway = new braintree.BraintreeGateway();

      const mockResult = { id: "transaction123", success: true };
      gateway.transaction.sale.mockImplementation((options, callback) => {
        callback(null, mockResult);
      });

      const mockSave = jest.fn().mockResolvedValue({
        _id: "order123",
        products: req.body.cart,
        payment: mockResult,
        buyer: req.user._id,
      });
      orderModel.mockImplementation(() => ({
        save: mockSave,
      }));

      await brainTreePaymentController(req, res);

      expect(gateway.transaction.sale).toHaveBeenCalled();
      expect(orderModel).toHaveBeenCalledWith({
        products: req.body.cart,
        payment: mockResult,
        buyer: req.user._id,
      });
      expect(res.json).toHaveBeenCalledWith({ ok: true, orderId: "order123" });
    });

    it("should handle synchronous errors in try-catch block", async () => {
      const req = {
        body: {
          nonce: "test-nonce",
          cart: [{ _id: "1", price: 100 }],
        },
        user: { _id: "user123" },
      };
      const res = mockResponse();

      const braintree = require("braintree");
      const gateway = new braintree.BraintreeGateway();

      // Mock gateway to throw synchronous error
      gateway.transaction.sale.mockImplementation(() => {
        throw new Error("Synchronous error");
      });

      await brainTreePaymentController(req, res);

      // The controller catches errors but doesn't send response in catch block
      // This test ensures no unhandled errors occur
      expect(gateway.transaction.sale).toHaveBeenCalled();
    });
  });
});
