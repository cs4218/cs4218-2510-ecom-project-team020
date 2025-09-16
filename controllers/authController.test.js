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

      expect(res.send).toHaveBeenCalledWith({ message: "Phone no is Required" });
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
          message: "Already Register please login",
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

    it("should fail if password does not match", async () => {
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
          message: "Error in login",
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
      expect(res.send).toHaveBeenCalledWith({ message: "Emai is required" });
    });

    it("should fail if answer is missing", async () => {
      const req = { body: { email: "test@test.com", newPassword: "123456" } };
      const res = mockResponse();

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: "answer is required" });
    });

    it("should fail if new password is missing", async () => {
      const req = { body: { email: "test@test.com", answer: "blue" } };
      const res = mockResponse();

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: "New Password is required" });
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

    it("should reset password if correct", async () => {
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
        error: "Passsword is required and 6 character long",
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
        expect.objectContaining({ success: true, message: "Profile Updated SUccessfully" })
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
        expect.objectContaining({ success: true, message: "Profile Updated SUccessfully" })
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
        expect.objectContaining({ success: true, message: "Profile Updated SUccessfully" })
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
          message: "Error WHile Geting Orders",
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

    it("should return 500 if an exception occurs", async () => {
      const req = {};
      const res = mockResponse();

      orderModel.find = jest.fn().mockImplementation(() => { throw new Error("DB Error"); });

      await getAllOrdersController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error WHile Geting Orders",
          error: expect.any(Error),
        })
      );
    });
  });

  describe("orderStatusController", () => {
    it("should update order status successfully", async () => {
      const req = { params: { orderId: "1" }, body: { status: "shipped" } };
      const res = mockResponse();

      orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: "1", status: "shipped" });

      await orderStatusController(req, res);

      expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "1",
        { status: "shipped" },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith({ _id: "1", status: "shipped" });
    });

    it("should return 500 if an exception occurs", async () => {
      const req = { params: { orderId: "1" }, body: { status: "shipped" } };
      const res = mockResponse();

      orderModel.findByIdAndUpdate = jest.fn().mockImplementation(() => { throw new Error("DB Error"); });

      await orderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error While Updateing Order",
          error: expect.any(Error),
        })
      );
    });
  });
});
