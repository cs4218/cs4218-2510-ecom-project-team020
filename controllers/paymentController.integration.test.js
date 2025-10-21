import request from "supertest";
import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import productRoutes from "../routes/productRoutes.js";
import authRoutes from "../routes/authRoute.js";
import paymentRoutes from "../routes/paymentRoutes.js";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";

// Import the actual models
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";

// Test helper functions
const createUser = async (userData) => {
  const { name, email, password, phone, address } = userData;

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new userModel({
    name,
    email,
    password: hashedPassword,
    phone,
    address,
    answer: "test-answer", // Required field
  });

  await user.save();
  return user;
};

const loginUser = async (credentials) => {
  const { email, password } = credentials;

  // Find user
  const user = await userModel.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }

  // Generate actual JWT token for testing
  const token = JWT.sign(
    { _id: user._id },
    process.env.JWT_SECRET || "test-jwt-secret",
    { expiresIn: "7d" }
  );

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
    },
    token,
  };
};

// Load environment variables
dotenv.config();

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.BRAINTREE_MERCHANT_ID = "test-merchant-id";
process.env.BRAINTREE_PUBLIC_KEY = "test-public-key";
process.env.BRAINTREE_PRIVATE_KEY = "test-private-key";

// Mock Braintree with more realistic behavior
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

describe("Payment Controller E2E Tests", () => {
  let app;
  let server;
  let mongoServer;
  let authToken;
  let userId;
  let testProducts;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to test database
    await mongoose.connect(mongoUri);

    // Create Express app with middleware
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/product", productRoutes);
    app.use("/api/v1/payment", paymentRoutes);

    // Start server
    server = app.listen(0);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear all collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }

    // Create test user and get auth token
    const userData = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      phone: "1234567890",
      address: "123 Test Street, Test City, TC 12345",
    };

    const user = await createUser(userData);
    userId = user._id;

    const loginResponse = await loginUser({
      email: userData.email,
      password: userData.password,
    });
    authToken = loginResponse.token;

    // Create test categories first
    const electronicsCategory = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });

    const accessoriesCategory = await categoryModel.create({
      name: "Accessories",
      slug: "accessories",
    });

    // Create test products with realistic data using actual models
    testProducts = await productModel.create([
      {
        name: "Wireless Headphones",
        slug: "wireless-headphones",
        description: "High-quality wireless headphones with noise cancellation",
        price: 199.99,
        category: electronicsCategory._id,
        quantity: 50,
        shipping: true,
      },
      {
        name: "Smart Watch",
        slug: "smart-watch",
        description: "Advanced smartwatch with health monitoring",
        price: 299.99,
        category: electronicsCategory._id,
        quantity: 25,
        shipping: true,
      },
      {
        name: "Laptop Stand",
        slug: "laptop-stand",
        description: "Adjustable laptop stand for better ergonomics",
        price: 49.99,
        category: accessoriesCategory._id,
        quantity: 100,
        shipping: true,
      },
    ]);
  });

  describe("Complete Payment Flow Integration", () => {
    it("should handle successful payment flow with multiple products", async () => {
      const braintree = require("braintree");
      const gateway = new braintree.BraintreeGateway();

      // Mock successful token generation
      const mockTokenResponse = { clientToken: "test-client-token-abc123" };
      gateway.clientToken.generate.mockImplementation((options, callback) => {
        callback(null, mockTokenResponse);
      });

      // Mock successful payment transaction
      const mockTransactionResult = {
        id: "transaction-456",
        success: true,
        transaction: {
          id: "transaction-456",
          status: "authorized",
          amount: "549.97",
          currencyIsoCode: "USD",
        },
      };

      gateway.transaction.sale.mockImplementation((options, callback) => {
        callback(null, mockTransactionResult);
      });

      // Step 1: Get client token
      const tokenResponse = await request(app)
        .get("/api/v1/payment/braintree/token")
        .expect(200);

      expect(tokenResponse.body.clientToken).toBe("test-client-token-abc123");

      // Step 2: Process payment with multiple products
      const cart = [
        {
          _id: testProducts[0]._id,
          name: testProducts[0].name,
          price: testProducts[0].price,
        },
        {
          _id: testProducts[1]._id,
          name: testProducts[1].name,
          price: testProducts[1].price,
        },
        {
          _id: testProducts[2]._id,
          name: testProducts[2].name,
          price: testProducts[2].price,
        },
      ];

      const paymentData = {
        nonce: "fake-payment-method-nonce-123",
        cart: cart,
      };

      const paymentResponse = await request(app)
        .post("/api/v1/payment/braintree/payment")
        .set("Authorization", authToken)
        .send(paymentData)
        .expect(200);

      expect(paymentResponse.body).toEqual({
        ok: true,
        orderId: expect.any(String),
      });

      // Step 3: Verify transaction was called with correct amount
      expect(gateway.transaction.sale).toHaveBeenCalledWith(
        {
          amount: 549.97, // 199.99 + 299.99 + 49.99
          paymentMethodNonce: "fake-payment-method-nonce-123",
          options: {
            submitForSettlement: true,
          },
        },
        expect.any(Function)
      );

      // Step 4: Verify order was created in database
      const orders = await orderModel.find({ buyer: userId });
      expect(orders).toHaveLength(1);

      const order = orders[0];
      expect(order.products).toHaveLength(3);
      expect(order.payment).toEqual(mockTransactionResult);
      expect(order.buyer.toString()).toBe(userId.toString());
      expect(order.status).toBe("Not Processed");
    });

    it("should handle payment failure and rollback", async () => {
      const braintree = require("braintree");
      const gateway = new braintree.BraintreeGateway();

      // Mock successful token generation
      const mockTokenResponse = { clientToken: "test-client-token-xyz789" };
      gateway.clientToken.generate.mockImplementation((options, callback) => {
        callback(null, mockTokenResponse);
      });

      // Mock payment failure
      const mockError = new Error("Payment declined by bank");
      gateway.transaction.sale.mockImplementation((options, callback) => {
        callback(mockError, null);
      });

      const cart = [
        {
          _id: testProducts[0]._id,
          name: testProducts[0].name,
          price: testProducts[0].price,
        },
      ];

      const paymentData = {
        nonce: "fake-payment-method-nonce-456",
        cart: cart,
      };

      const paymentResponse = await request(app)
        .post("/api/v1/payment/braintree/payment")
        .set("Authorization", authToken)
        .send(paymentData)
        .expect(500);

      expect(paymentResponse.body).toEqual({ error: "Payment failed" });

      // Verify no order was created
      const orders = await orderModel.find({ buyer: userId });
      expect(orders).toHaveLength(0);
    });

    it("should handle network timeout scenarios", async () => {
      const braintree = require("braintree");
      const gateway = new braintree.BraintreeGateway();

      const mockTokenResponse = { clientToken: "test-client-token-timeout" };
      gateway.clientToken.generate.mockImplementation((options, callback) => {
        callback(null, mockTokenResponse);
      });

      // Mock network timeout
      const timeoutError = new Error("Network timeout");
      timeoutError.code = "TIMEOUT";
      gateway.transaction.sale.mockImplementation((options, callback) => {
        callback(timeoutError, null);
      });

      const cart = [
        {
          _id: testProducts[0]._id,
          name: testProducts[0].name,
          price: testProducts[0].price,
        },
      ];

      const paymentData = {
        nonce: "fake-payment-method-nonce-timeout",
        cart: cart,
      };

      const response = await request(app)
        .post("/api/v1/payment/braintree/payment")
        .set("Authorization", authToken)
        .send(paymentData)
        .expect(500);

      expect(response.body).toEqual({ error: "Payment failed" });

      // Verify no order was created
      const orders = await orderModel.find({ buyer: userId });
      expect(orders).toHaveLength(0);
    });
  });

  describe("Authentication and Authorization", () => {
    it("should require valid authentication for payment", async () => {
      const cart = [
        {
          _id: testProducts[0]._id,
          name: testProducts[0].name,
          price: testProducts[0].price,
        },
      ];

      const paymentData = {
        nonce: "fake-payment-method-nonce",
        cart: cart,
      };

      // Test without token
      await request(app)
        .post("/api/v1/payment/braintree/payment")
        .send(paymentData)
        .expect(401);

      // Test with invalid token
      await request(app)
        .post("/api/v1/payment/braintree/payment")
        .set("Authorization", "invalid-token")
        .send(paymentData)
        .expect(401);
    });

    it("should allow token generation without authentication", async () => {
      const braintree = require("braintree");
      const gateway = new braintree.BraintreeGateway();

      const mockTokenResponse = { clientToken: "test-client-token-no-auth" };
      gateway.clientToken.generate.mockImplementation((options, callback) => {
        callback(null, mockTokenResponse);
      });

      const response = await request(app)
        .get("/api/v1/payment/braintree/token")
        .expect(200);

      expect(response.body.clientToken).toBe("test-client-token-no-auth");
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle malformed request data", async () => {
      const braintree = require("braintree");
      const gateway = new braintree.BraintreeGateway();

      const mockTokenResponse = { clientToken: "test-client-token-malformed" };
      gateway.clientToken.generate.mockImplementation((options, callback) => {
        callback(null, mockTokenResponse);
      });

      // Test with malformed cart data
      const malformedPaymentData = {
        nonce: "fake-payment-method-nonce",
        cart: "not-an-array",
      };

      const response = await request(app)
        .post("/api/v1/payment/braintree/payment")
        .set("Authorization", authToken)
        .send(malformedPaymentData)
        .expect(500);

      expect(response.body).toEqual({ error: "Internal server error" });
    });
    it("should handle invalid cart data with negative prices", async () => {
      const braintree = require("braintree");
      const gateway = new braintree.BraintreeGateway();

      const mockTokenResponse = { clientToken: "test-client-token-negative" };
      gateway.clientToken.generate.mockImplementation((options, callback) => {
        callback(null, mockTokenResponse);
      });

      const cart = [
        { _id: testProducts[0]._id, name: testProducts[0].name, price: -10 }, // Invalid negative price
      ];

      const paymentData = {
        nonce: "fake-payment-method-nonce",
        cart: cart,
      };

      const response = await request(app)
        .post("/api/v1/payment/braintree/payment")
        .set("Authorization", authToken)
        .send(paymentData)
        .expect(500);

      expect(response.body).toEqual({ error: "Internal server error" });
    });

    it("should handle non-numeric prices", async () => {
      const braintree = require("braintree");
      const gateway = new braintree.BraintreeGateway();

      const mockTokenResponse = {
        clientToken: "test-client-token-non-numeric",
      };
      gateway.clientToken.generate.mockImplementation((options, callback) => {
        callback(null, mockTokenResponse);
      });

      const cart = [
        {
          _id: testProducts[0]._id,
          name: testProducts[0].name,
          price: "invalid",
        },
      ];

      const paymentData = {
        nonce: "fake-payment-method-nonce",
        cart: cart,
      };

      const response = await request(app)
        .post("/api/v1/payment/braintree/payment")
        .set("Authorization", authToken)
        .send(paymentData)
        .expect(500);

      expect(response.body).toEqual({ error: "Internal server error" });
    });

    it("should handle empty cart", async () => {
      const braintree = require("braintree");
      const gateway = new braintree.BraintreeGateway();

      const mockTokenResponse = { clientToken: "test-client-token-empty" };
      gateway.clientToken.generate.mockImplementation((options, callback) => {
        callback(null, mockTokenResponse);
      });

      const mockTransactionResult = {
        id: "transaction-empty",
        success: true,
        transaction: {
          id: "transaction-empty",
          status: "authorized",
          amount: "0.00",
        },
      };

      gateway.transaction.sale.mockImplementation((options, callback) => {
        callback(null, mockTransactionResult);
      });

      const paymentData = {
        nonce: "fake-payment-method-nonce",
        cart: [],
      };

      const response = await request(app)
        .post("/api/v1/payment/braintree/payment")
        .set("Authorization", authToken)
        .send(paymentData)
        .expect(200);

      expect(response.body).toEqual({
        ok: true,
        orderId: expect.any(String),
      });

      // Verify transaction was called with amount 0
      expect(gateway.transaction.sale).toHaveBeenCalledWith(
        {
          amount: 0,
          paymentMethodNonce: "fake-payment-method-nonce",
          options: {
            submitForSettlement: true,
          },
        },
        expect.any(Function)
      );
    });
  });

  describe("Token Generation Tests", () => {
    it("should generate client token successfully", async () => {
      const braintree = require("braintree");
      const gateway = new braintree.BraintreeGateway();

      const mockTokenResponse = { clientToken: "test-client-token-123" };
      gateway.clientToken.generate.mockImplementation((options, callback) => {
        callback(null, mockTokenResponse);
      });

      const response = await request(app)
        .get("/api/v1/payment/braintree/token")
        .expect(200);

      expect(response.body).toEqual(mockTokenResponse);
      expect(gateway.clientToken.generate).toHaveBeenCalledWith(
        {},
        expect.any(Function)
      );
    });
  });

  describe("Payment Processing Tests", () => {
    it("should process payment successfully with single product", async () => {
      const braintree = require("braintree");
      const gateway = new braintree.BraintreeGateway();

      const mockTokenResponse = { clientToken: "test-client-token-single" };
      gateway.clientToken.generate.mockImplementation((options, callback) => {
        callback(null, mockTokenResponse);
      });

      const mockTransactionResult = {
        id: "transaction-single",
        success: true,
        transaction: {
          id: "transaction-single",
          status: "authorized",
          amount: "199.99",
        },
      };

      gateway.transaction.sale.mockImplementation((options, callback) => {
        callback(null, mockTransactionResult);
      });

      const cart = [
        {
          _id: testProducts[0]._id,
          name: testProducts[0].name,
          price: testProducts[0].price,
        },
      ];

      const paymentData = {
        nonce: "fake-payment-method-nonce-single",
        cart: cart,
      };

      const response = await request(app)
        .post("/api/v1/payment/braintree/payment")
        .set("Authorization", authToken)
        .send(paymentData)
        .expect(200);

      expect(response.body).toEqual({
        ok: true,
        orderId: expect.any(String),
      });

      // Verify transaction was called with correct amount
      expect(gateway.transaction.sale).toHaveBeenCalledWith(
        {
          amount: 199.99,
          paymentMethodNonce: "fake-payment-method-nonce-single",
          options: {
            submitForSettlement: true,
          },
        },
        expect.any(Function)
      );

      // Verify order was created
      const orders = await orderModel.find({ buyer: userId });
      expect(orders).toHaveLength(1);
      expect(orders[0].products).toHaveLength(1);
      expect(orders[0].payment).toEqual(mockTransactionResult);
    });

    it("should handle payment failure with proper error response", async () => {
      const braintree = require("braintree");
      const gateway = new braintree.BraintreeGateway();

      const mockTokenResponse = { clientToken: "test-client-token-failure" };
      gateway.clientToken.generate.mockImplementation((options, callback) => {
        callback(null, mockTokenResponse);
      });

      const mockError = new Error("Payment declined by bank");
      gateway.transaction.sale.mockImplementation((options, callback) => {
        callback(mockError, null);
      });

      const cart = [
        {
          _id: testProducts[0]._id,
          name: testProducts[0].name,
          price: testProducts[0].price,
        },
      ];

      const paymentData = {
        nonce: "fake-payment-method-nonce-failure",
        cart: cart,
      };

      const response = await request(app)
        .post("/api/v1/payment/braintree/payment")
        .set("Authorization", authToken)
        .send(paymentData)
        .expect(500);

      expect(response.body).toEqual({ error: "Payment failed" });

      // Verify no order was created
      const orders = await orderModel.find({ buyer: userId });
      expect(orders).toHaveLength(0);
    });
  });

  // describe("Performance and Load Tests", () => {
  //   it("should handle multiple concurrent payments efficiently", async () => {
  //     const braintree = require("braintree");
  //     const gateway = new braintree.BraintreeGateway();

  //     const mockTokenResponse = { clientToken: "test-client-token-concurrent" };
  //     gateway.clientToken.generate.mockImplementation((options, callback) => {
  //       callback(null, mockTokenResponse);
  //     });

  //     const mockTransactionResult = {
  //       id: "transaction-concurrent",
  //       success: true,
  //       transaction: {
  //         id: "transaction-concurrent",
  //         status: "authorized",
  //         amount: "199.99",
  //       },
  //     };

  //     gateway.transaction.sale.mockImplementation((options, callback) => {
  //       callback(null, mockTransactionResult);
  //     });

  //     const cart = [
  //       {
  //         _id: testProducts[0]._id,
  //         name: testProducts[0].name,
  //         price: testProducts[0].price,
  //       },
  //     ];

  //     const paymentData = {
  //       nonce: "fake-payment-method-nonce-concurrent",
  //       cart: cart,
  //     };

  //     // Make 5 concurrent payment requests
  //     const promises = Array.from({ length: 5 }, () =>
  //       request(app)
  //         .post("/api/v1/payment/braintree/payment")
  //         .set("Authorization", authToken)
  //         .send(paymentData)
  //     );

  //     const startTime = Date.now();
  //     const responses = await Promise.all(promises);
  //     const endTime = Date.now();

  //     // All should succeed
  //     responses.forEach((response) => {
  //       expect(response.status).toBe(200);
  //       expect(response.body.ok).toBe(true);
  //     });

  //     // Should complete within reasonable time
  //     expect(endTime - startTime).toBeLessThan(10000); // 10 seconds

  //     // Verify orders were created
  //     const orders = await orderModel.find({ buyer: userId });
  //     expect(orders).toHaveLength(5);
  //   });
  // });
});
