// This file contains unit tests generated with AI assistance but curated, validated and refined by me.
import {
  registerController,
  loginController,
  forgotPasswordController,
  testController,
  updateProfileController,
  getOrdersController,
  getAllOrdersController,
  orderStatusController
} from "../controllers/authController.js";

import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

import { comparePassword, hashPassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";

jest.mock("../models/userModel.js");
jest.mock("../helpers/authHelper.js");
jest.mock("jsonwebtoken");

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Auth Controllers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registerController", () => {
    it("should return error if name is missing", async () => {
      // Arrange
      const req = { body: { email: "test@test.com", password: "123", phone: "111", address: "SG", answer: "blue" } };
      const res = mockResponse();

      // Act
      await registerController(req, res);

      // Assert
      expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
    });

    it("should return error if email is missing", async () => {
      const req = { body: { name: "John", password: "123", phone: "111", address: "SG", answer: "blue" } };
      const res = mockResponse();

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({ message: "Email is Required" });
    });

    it("should return error if password is missing", async () => {
      const req = { body: { name: "John", email: "a@test.com", phone: "111", address: "SG", answer: "blue" } };
      const res = mockResponse();

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({ message: "Password is Required" });
    });

    it("should return error if phone is missing", async () => {
      const req = { body: { name: "John", email: "a@test.com", password: "123", address: "SG", answer: "blue" } };
      const res = mockResponse();

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({ message: "Phone Number is Required" });
    });

    it("should return error if address is missing", async () => {
      const req = { body: { name: "John", email: "a@test.com", password: "123", phone: "111", answer: "blue" } };
      const res = mockResponse();

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({ message: "Address is Required" });
    });

    it("should return error if answer is missing", async () => {
      const req = { body: { name: "John", email: "a@test.com", password: "123", phone: "111", address: "SG" } };
      const res = mockResponse();

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({ message: "Answer is Required" });
    });

    it("should return already registered if user exists", async () => {
      const req = {
        body: {
          name: "John",
          email: "john@test.com",
          password: "123456",
          phone: "123",
          address: "SG",
          answer: "blue",
        },
      };
      const res = mockResponse();

      userModel.findOne.mockResolvedValue({ email: "john@test.com" });

      await registerController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Already Registered Please Login",
        })
      );
    });

    it("should register user if new", async () => {
      const req = {
        body: {
          name: "John",
          email: "john@test.com",
          password: "123456",
          phone: "123",
          address: "SG",
          answer: "blue",
        },
      };
      const res = mockResponse();

      userModel.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue("password123");
      userModel.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ _id: "1", email: "john@test.com" }),
      }));

      await registerController(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "User Register Successfully",
        })
      );
    });
  });

  describe("registerController Pairwise Validation", () => {
    const res = {
      name: "John",
      email: "john@test.com",
      password: "123456",
      phone: "123456",
      address: "SG",
      answer: "blue",
    };

    const makeReq = (overrides = {}) => ({ body: { ...res, ...overrides } });

    const pairwiseCases = [
      { name: undefined, email: undefined, expected: { error: "Name is Required" } },
      { name: undefined, password: undefined, expected: { error: "Name is Required" } },
      { name: undefined, phone: undefined, expected: { error: "Name is Required" } },
      { name: undefined, address: undefined, expected: { error: "Name is Required" } },
      { name: undefined, answer: undefined, expected: { error: "Name is Required" } },

      { email: undefined, password: undefined, expected: { message: "Email is Required" } },
      { email: undefined, phone: undefined, expected: { message: "Email is Required" } },
      { email: undefined, address: undefined, expected: { message: "Email is Required" } },
      { email: undefined, answer: undefined, expected: { message: "Email is Required" } },

      { password: undefined, phone: undefined, expected: { message: "Password is Required" } },
      { password: undefined, address: undefined, expected: { message: "Password is Required" } },
      { password: undefined, answer: undefined, expected: { message: "Password is Required" } },

      { phone: undefined, address: undefined, expected: { message: "Phone Number is Required" } },
      { phone: undefined, answer: undefined, expected: { message: "Phone Number is Required" } },

      { address: undefined, answer: undefined, expected: { message: "Address is Required" } },
    ];

    it.each(pairwiseCases)(
      "should fail validation for %o",
      async (overrides) => {
        const { expected, ...invalid } = overrides;
        const req = makeReq(invalid);
        const res = mockResponse();

        await registerController(req, res);

        expect(res.send).toHaveBeenCalledWith(expected);
      }
    );
  });

  /**
   * Decision Table:
   * Condition 1: email provided? (Y/N)
   * Condition 2: password provided? (Y/N)
   * Condition 3: user exists? (Y/N)
   * Condition 4: password matches? (Y/N)
   * Actions: fail invalid, fail not found, fail wrong password, success, exception
   */
  describe("loginController", () => {
    it("should fail if missing email", async () => {
      const req = { body: { password: "123" } };
      const res = mockResponse();

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid email or password" })
      );
    });

    it("should fail if missing password", async () => {
      const req = { body: { email: "test@test.com" } };
      const res = mockResponse();

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid email or password" })
      );
    });

    it("should fail if user not found", async () => {
      const req = { body: { email: "a@test.com", password: "123" } };
      const res = mockResponse();

      userModel.findOne.mockResolvedValue(null);

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Email is not registerd" })
      );
    });

    it("should fail if user exists but password does not match", async () => {
      const req = { body: { email: "a@test.com", password: "123" } };
      const res = mockResponse();

      userModel.findOne.mockResolvedValue({ email: "a@test.com", password: "123456" });
      comparePassword.mockResolvedValue(false);

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid Password" })
      );
    });

    it("should return token if login succeeds", async () => {
      const req = { body: { email: "a@test.com", password: "123" } };
      const res = mockResponse();

      const testUser = {
        _id: "1", name: "John", email: "a@test.com", phone: "123", address: "SG",
        role: 0, password: "123456"
      };
      userModel.findOne.mockResolvedValue(testUser);
      comparePassword.mockResolvedValue(true);
      JWT.sign.mockReturnValue("fakeToken");

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: "fakeToken",
        })
      );
    });

    it("should return 500 if an exception occurs", async () => {
      const req = { body: { email: "test@test.com", password: "123" } };
      const res = mockResponse();

      userModel.findOne = jest.fn().mockRejectedValue(new Error("DB error"));

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error Logging In",
          error: expect.any(Error),
        })
      );
    });
  });

  describe("forgotPasswordController", () => {
    it("should fail if email is missing", async () => {
      const req = { body: { answer: "blue", newPassword: "123456" } };
      const res = mockResponse();

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: "Email is Required" });
    });

    it("should fail if answer is missing", async () => {
      const req = { body: { email: "test@test.com", newPassword: "123456" } };
      const res = mockResponse();

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: "Answer is Required" });
    });

    it("should fail if new password is missing", async () => {
      const req = { body: { email: "test@test.com", answer: "blue" } };
      const res = mockResponse();

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: "New Password is Required" });
    });

    it("should fail if user not found", async () => {
      const req = { body: { email: "a@test.com", answer: "blue", newPassword: "123456" } };
      const res = mockResponse();

      userModel.findOne.mockResolvedValue(null);

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Wrong Email Or Answer" })
      );
    });

    it("should successfully reset password if user found", async () => {
      const req = { body: { email: "a@test.com", answer: "blue", newPassword: "123456" } };
      const res = mockResponse();

      userModel.findOne.mockResolvedValue({ _id: "1", email: "a@test.com" });
      hashPassword.mockResolvedValue("new_hashed");
      userModel.findByIdAndUpdate.mockResolvedValue(true);

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it("should fail if password length is 5", async () => {
      const req = { body: { newPassword: "12345" }, user: { _id: "1" } };
      const res = mockResponse();

      userModel.findById.mockResolvedValue({ password: "hashed" });

      await forgotPasswordController(req, res);

      expect(res.json).toHaveBeenCalledWith({
        error: "Passsword is required and at least 6 characters long",
      });
    });

    it("should succeed if password length is 6", async () => {
      const req = { body: { email: "a@test.com", answer: "blue", newPassword: "123456" } };
      const res = mockResponse();

      userModel.findOne.mockResolvedValue({ _id: "1", email: "a@test.com" });
      hashPassword.mockResolvedValue("new_hashed");
      userModel.findByIdAndUpdate.mockResolvedValue(true);

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it("should succeed if password length is 7", async () => {
      const req = { body: { email: "a@test.com", answer: "blue", newPassword: "1234567" } };
      const res = mockResponse();

      userModel.findOne.mockResolvedValue({ _id: "1", email: "a@test.com" });
      hashPassword.mockResolvedValue("new_hashed");
      userModel.findByIdAndUpdate.mockResolvedValue(true);

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it("should return 500 if an exception occurs", async () => {
      const req = { body: { email: "a@test.com", answer: "blue", newPassword: "123456" } };
      const res = mockResponse();

      userModel.findOne.mockRejectedValue(new Error("DB error"));

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Something went wrong",
          error: expect.any(Error),
        })
      );
    });
  });

  describe("testController", () => {
    it("should return Protected Routes", () => {
      const req = {};
      const res = mockResponse();

      testController(req, res);

      expect(res.send).toHaveBeenCalledWith("Protected Routes");
    });
  });

  describe("updateProfileController", () => {
    it("should fail if password length is 5", async () => {
      const req = { body: { password: "12345" }, user: { _id: "1" } };
      const res = mockResponse();

      userModel.findById.mockResolvedValue({ password: "hashed" });

      await updateProfileController(req, res);

      expect(res.json).toHaveBeenCalledWith({
        error: "Passsword is required and at least 6 characters long",
      });
    });

    it("should succeed if password length is 6", async () => {
      const req = {
        body: { name: "NewName", password: "123456", address: "SG" },
        user: { _id: "1" },
      };
      const res = mockResponse();

      userModel.findById.mockResolvedValue({ name: "OldName", password: "hashed", phone: "111", address: "OldAddr" });
      hashPassword.mockResolvedValue("new_hashed");
      userModel.findByIdAndUpdate.mockResolvedValue({ _id: "1", name: "NewName", address: "SG" });

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: "Profile Updated Successfully" })
      );
    });

    it("should succeed if password length is 7", async () => {
      const req = {
        body: { name: "NewName", password: "1234567", address: "SG" },
        user: { _id: "1" },
      };
      const res = mockResponse();

      userModel.findById.mockResolvedValue({ name: "OldName", password: "hashed", phone: "111", address: "OldAddr" });
      hashPassword.mockResolvedValue("new_hashed");
      userModel.findByIdAndUpdate.mockResolvedValue({ _id: "1", name: "NewName", address: "SG" });

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: "Profile Updated Successfully" })
      );
    });

    it("should succeed if password not provided for update", async () => {
      const req = {
        body: { name: "NewName", address: "SG" },
        user: { _id: "1" },
      };
      const res = mockResponse();

      userModel.findById.mockResolvedValue({ name: "OldName", password: "hashed", phone: "111", address: "OldAddr" });
      userModel.findByIdAndUpdate.mockResolvedValue({ _id: "1", name: "NewName", address: "SG" });

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: "Profile Updated Successfully" })
      );
    });
    
    it("should return 500 if an exception occurs", async () => {
      const req = { body: { email: "a@test.com", answer: "blue", newPassword: "123456" } };
      const res = mockResponse();

      userModel.findOne.mockRejectedValue(new Error("DB error"));

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Something went wrong",
          error: expect.any(Error),
        })
      );
    });
  });

  describe("getOrdersController", () => {
    it("should return orders successfully", async () => {
      const req = { user: { _id: "user123" } };
      const res = mockResponse();

      const populateProducts = jest.fn().mockReturnThis();
      const populateBuyer = jest.fn().mockResolvedValue([
        { _id: "order1", buyer: { _id: "user123" }, products: [{ name: "Product A" }] },
      ]);
      orderModel.find = jest.fn().mockReturnValue({
        populate: populateProducts.mockReturnValue({ populate: populateBuyer }),
      });

      await getOrdersController(req, res);

      expect(orderModel.find).toHaveBeenCalledWith({ buyer: "user123" });
      expect(res.json).toHaveBeenCalledWith([
        { _id: "order1", buyer: { _id: "user123" }, products: [{ name: "Product A" }] },
      ]);
    });

    it("should return empty array when user has no orders", async () => {
      const req = { user: { _id: "user123" } };
      const res = mockResponse();

      const populateProducts = jest.fn().mockReturnThis();
      const populateBuyer = jest.fn().mockResolvedValue([]);

      orderModel.find = jest.fn().mockReturnValue({
        populate: populateProducts.mockReturnValue({ populate: populateBuyer }),
      });

      await getOrdersController(req, res);

      expect(orderModel.find).toHaveBeenCalledWith({ buyer: "user123" });
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should handle missing user id gracefully", async () => {
      const req = { user: {} };
      const res = mockResponse();

      const populateProducts = jest.fn().mockReturnThis();
      const populateBuyer = jest.fn().mockResolvedValue([]);

      orderModel.find = jest.fn().mockReturnValue({
        populate: populateProducts.mockReturnValue({ populate: populateBuyer }),
      });

      await getOrdersController(req, res);

      expect(orderModel.find).toHaveBeenCalledWith({ buyer: undefined });
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should return 500 if an exception occurs", async () => {
      const req = { user: { _id: "user123" } };
      const res = mockResponse();

      orderModel.find = jest.fn().mockImplementation(() => {
        throw new Error("DB Error");
      });

      await getOrdersController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error Getting Orders",
          error: expect.any(Error),
        })
      );
    });
  });

  describe("getAllOrdersController", () => {
    it("should return all orders successfully", async () => {
      const req = {};
      const res = mockResponse();

      const populateMock1 = jest.fn().mockReturnThis();
      const populateMock2 = jest.fn().mockReturnThis();
      const sortMock = jest.fn().mockResolvedValue([
        { _id: "1", products: [{ name: "Product A" }], buyer: { name: "John" } },
      ]);

      orderModel.find = jest.fn().mockReturnValue({
        populate: populateMock1.mockReturnValue({ populate: populateMock2.mockReturnValue({ sort: sortMock }) }),
      });

      await getAllOrdersController(req, res);

      expect(orderModel.find).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith([
        { _id: "1", products: [{ name: "Product A" }], buyer: { name: "John" } },
      ]);
    });

    it("should return empty array when no orders exist", async () => {
      const req = {};
      const res = mockResponse();

      const populateMock1 = jest.fn().mockReturnThis();
      const populateMock2 = jest.fn().mockReturnThis();
      const sortMock = jest.fn().mockResolvedValue([]);

      orderModel.find = jest.fn().mockReturnValue({
        populate: populateMock1.mockReturnValue({
          populate: populateMock2.mockReturnValue({ sort: sortMock })
        }),
      });

      await getAllOrdersController(req, res);

      expect(orderModel.find).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should verify sort is called with correct parameter", async () => {
      const req = {};
      const res = mockResponse();

      const populateMock1 = jest.fn().mockReturnThis();
      const populateMock2 = jest.fn().mockReturnThis();
      const sortMock = jest.fn().mockResolvedValue([
        { _id: "1", createdAt: "2024-01-02" },
        { _id: "2", createdAt: "2024-01-01" },
      ]);

      orderModel.find = jest.fn().mockReturnValue({
        populate: populateMock1.mockReturnValue({
          populate: populateMock2.mockReturnValue({ sort: sortMock })
        }),
      });

      await getAllOrdersController(req, res);

      expect(sortMock).toHaveBeenCalledWith({ createdAt: "-1" });
    });

    it("should verify populate is called with correct parameters", async () => {
      const req = {};
      const res = mockResponse();

      const populateMock1 = jest.fn().mockReturnThis();
      const populateMock2 = jest.fn().mockReturnThis();
      const sortMock = jest.fn().mockResolvedValue([]);

      orderModel.find = jest.fn().mockReturnValue({
        populate: populateMock1.mockReturnValue({
          populate: populateMock2.mockReturnValue({ sort: sortMock })
        }),
      });

      await getAllOrdersController(req, res);

      expect(populateMock1).toHaveBeenCalledWith("products", "-photo");
      expect(populateMock2).toHaveBeenCalledWith("buyer", "name");
    });

    it("should return 500 if an exception occurs", async () => {
      const req = {};
      const res = mockResponse();

      orderModel.find = jest.fn().mockImplementation(() => { throw new Error("DB Error"); });

      await getAllOrdersController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error Getting Orders",
          error: expect.any(Error),
        })
      );
    });
  });

  describe("orderStatusController", () => {
    it("should update order status successfully", async () => {
      const req = { params: { orderId: "1" }, body: { status: "Shipped" } };
      const res = mockResponse();

      orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: "1", status: "Shipped" });

      await orderStatusController(req, res);

      expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "1",
        { status: "Shipped" },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith({ _id: "1", status: "Shipped" });
    });

    it("should return 400 when orderId is missing", async () => {
      const req = { params: {}, body: { status: "Shipped" } };
      const res = mockResponse();

      await orderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Order ID is required",
      });
      expect(orderModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should return 400 when status is missing", async () => {
      const req = { params: { orderId: "123" }, body: {} };
      const res = mockResponse();

      await orderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Status is required",
      });
      expect(orderModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should return 404 when order not found", async () => {
      const req = { params: { orderId: "nonexistent123" }, body: { status: "Shipped" } };
      const res = mockResponse();

      orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      await orderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Order not found",
      });
    });

    it("should return 400 when status is empty string", async () => {
      const req = { params: { orderId: "123" }, body: { status: "" } };
      const res = mockResponse();

      await orderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Status is required",
      });
      expect(orderModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should return 400 when status is null", async () => {
      const req = { params: { orderId: "123" }, body: { status: null } };
      const res = mockResponse();

      await orderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Status is required",
      });
      expect(orderModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid status value", async () => {
      const req = { params: { orderId: "123" }, body: { status: "InvalidStatus" } };
      const res = mockResponse();

      orderModel.schema = {
        path: jest.fn().mockReturnValue({
          enumValues: ["Not Processed", "Processing", "Shipped", "Delivered", "Cancelled"]
        })
      };

      await orderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid status. Allowed values: Not Processed, Processing, Shipped, Delivered, Cancelled",
      });
      expect(orderModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should accept valid status case-insensitively", async () => {
      const req = { params: { orderId: "123" }, body: { status: "ShIppED" } };
      const res = mockResponse();

      orderModel.schema = {
        path: jest.fn().mockReturnValue({
          enumValues: ["Not Processed", "Processing", "Shipped", "Deliverd", "Cancelled"]
        })
      };

      orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue({
        _id: "123",
        status: "Shipped"
      });

      await orderStatusController(req, res);

      expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "123",
        { status: "Shipped" },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith({ _id: "123", status: "Shipped" });
    });

    it("should return 500 if an exception occurs", async () => {
      const req = { params: { orderId: "1" }, body: { status: "Shipped" } };
      const res = mockResponse();

      orderModel.findByIdAndUpdate = jest.fn().mockImplementation(() => { throw new Error("DB Error"); });

      await orderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error Updating Order",
          error: expect.any(Error),
        })
      );
    });
  });
});
