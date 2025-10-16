import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import dotenv from "dotenv";
import JWT from "jsonwebtoken";

import {
    registerController,
    loginController,
    forgotPasswordController,
    updateProfileController
} from "../controllers/authController.js";
import { hashPassword } from "../helpers/authHelper.js";
import userModel from "../models/userModel.js";
import authRoutes from "../routes/authRoute.js";
import { comparePassword } from "../helpers/authHelper.js";
import orderModel from "../models/orderModel.js";
import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";

dotenv.config();

let app;
let mongoServer;

describe("AuthController Integration Tests", () => {
    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);

        app = express();
        app.use(express.json());
        app.use("/api/v1/auth", authRoutes);


        app.post("/register", registerController);
        app.post("/login", loginController);
        app.post("/forgot-password", forgotPasswordController);
        app.put("/profile", updateProfileController);

        process.env.JWT_SECRET = "test-secret-key";
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        // Clear users and orders before each test
        await userModel.deleteMany({});
        await orderModel.deleteMany({})
    });

    describe("registerController Integration With UserModel", () => {
        const validUser = {
            name: "Test User",
            email: "testuser@example.com",
            password: "password123",
            phone: "1234567890",
            address: "123 Main St",
            answer: "blue",
        };

        it("should register a new user successfully", async () => {
            const response = await request(app)
                .post("/register")
                .send(validUser);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("User Register Successfully");

            const savedUser = await userModel.findOne({ email: validUser.email });
            expect(savedUser).toBeTruthy();
            expect(savedUser.name).toBe(validUser.name);
            expect(savedUser.password).not.toBe(validUser.password);
        });

        it("should not register if user already exists", async () => {
            await userModel.create({ ...validUser, password: "hashed" });

            const response = await request(app)
                .post("/register")
                .send(validUser);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Already Registered Please Login");
        });

        it("should validate missing required fields", async () => {
            const partialUser = {
                name: "Test User",
                email: "testuser@example.com",
                password: "password123",
                phone: "",
                address: "123 Main St",
            };

            const response = await request(app)
                .post("/register")
                .send(partialUser);

            expect(response.status).toBe(200);
            expect(response.body.message.match(/phone number is required/i));
            expect(response.body.message.match(/answer is required/i));
        });
        it("should return 500 if database query fails", async () => {
            jest.spyOn(userModel, "findOne").mockRejectedValueOnce(new Error("DB Error"));
            jest.spyOn(console, 'log').mockImplementation(() => { });

            const response = await request(app)
                .post("/api/v1/auth/register")
                .send(validUser);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Error in Registration");

            jest.restoreAllMocks();
        });
    });

    describe("loginController Integration With UserModel, Hash Helper", () => {
        let userData;

        beforeEach(async () => {
            const hashedPassword = await hashPassword("password")

            userData = await userModel.create({
                name: "Login User",
                email: "loginuser@example.com",
                password: hashedPassword,
                phone: "1112223333",
                address: { street: "789 Elm St" },
                answer: "green",
            });
        });

        it("should login successfully with correct credentials", async () => {
            const response = await request(app)
                .post("/login")
                .send({ email: userData.email, password: "password" });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Login Successful");
            expect(response.body.token).toBeDefined();
            expect(response.body.user.email).toBe(userData.email);
        });

        it("should fail with invalid password", async () => {
            const response = await request(app)
                .post("/login")
                .send({ email: userData.email, password: "wrongpassword" });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Invalid Password");
        });

        it("should fail with unregistered email", async () => {
            const response = await request(app)
                .post("/login")
                .send({ email: "notfound@example.com", password: "password" });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Email is not registered");
        });

        it("should fail if missing credentials", async () => {
            const response = await request(app)
                .post("/login")
                .send({ email: "", password: "" });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Invalid email or password");
        });
    });

    describe("forgotPasswordController Integration with UserModel and Hashing Helper", () => {
        let hashedPassword;
        let existingUser;

        beforeEach(async () => {
            hashedPassword = await hashPassword("oldpassword");
            existingUser = await userModel.create({
                name: "Reset User",
                email: "reset@test.com",
                password: hashedPassword,
                phone: "9998887777",
                address: "123 Reset Road",
                answer: "blue",
            });
        });

        it("should return 200 and reset password successfully", async () => {
            const res = await request(app)
                .post("/api/v1/auth/forgot-password")
                .send({
                    email: "reset@test.com",
                    answer: "blue",
                    newPassword: "newpass123",
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toMatch(/Password Reset Successful/);

            const updatedUser = await userModel.findOne({ email: "reset@test.com" });
            const isMatch = await comparePassword("newpass123", updatedUser.password);
            expect(isMatch).toBe(true);
        });

        it("should return 400 if email is missing", async () => {
            const res = await request(app)
                .post("/api/v1/auth/forgot-password")
                .send({ answer: "blue", newPassword: hashedPassword });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Email is Required/);
        });

        it("should return 400 if answer is missing", async () => {
            const res = await request(app)
                .post("/api/v1/auth/forgot-password")
                .send({ email: "reset@test.com", newPassword: hashedPassword });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Answer is Required/);
        });

        it("should return 400 if newPassword is missing", async () => {
            const res = await request(app)
                .post("/api/v1/auth/forgot-password")
                .send({ email: "reset@test.com", answer: "blue" });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/New Password is Required/);
        });

        it("should return 404 if email or answer is incorrect", async () => {
            const res = await request(app)
                .post("/api/v1/auth/forgot-password")
                .send({
                    email: "reset@test.com",
                    answer: "wrong",
                    newPassword: "newpass123",
                });

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/Wrong Email Or Answer/);
        });

        it("should handle internal server errors", async () => {
            jest.spyOn(userModel, "findOne").mockRejectedValueOnce(new Error("DB error"));
            jest.spyOn(console, 'log').mockImplementation(() => { });

            const res = await request(app)
                .post("/api/v1/auth/forgot-password")
                .send({
                    email: "reset@test.com",
                    answer: "blue",
                    newPassword: "newpass123",
                });

            expect(res.status).toBe(500);
            expect(res.body.message).toMatch(/Something went wrong/);

            jest.restoreAllMocks();
        });
    });

    describe("updateProfileController Integration with Auth Middleware and UserModel", () => {
        let user;
        let token;

        beforeEach(async () => {
            const hashed = await hashPassword("oldpassword");
            user = await userModel.create({
                name: "Profile User",
                email: "profile@test.com",
                password: hashed,
                phone: "1112223333",
                address: "123 Profile Lane",
                answer: "green",
            });

            token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET);
        });

        it("should update profile successfully with valid data", async () => {
            const res = await request(app)
                .put("/api/v1/auth/profile")
                .set("authorization", token)
                .send({
                    name: "Updated Name",
                    password: "newpass123",
                    phone: "9998887777",
                    address: "456 Updated Street",
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toMatch(/Profile Updated Successfully/);
            expect(res.body.updatedUser.name).toBe("Updated Name");
            expect(res.body.updatedUser.phone).toBe("9998887777");

            const updatedUser = await userModel.findById(user._id);
            const isMatch = await comparePassword("newpass123", updatedUser.password);
            expect(isMatch).toBe(true);
        });

        it("should keep existing values if fields are omitted", async () => {
            const res = await request(app)
                .put("/api/v1/auth/profile")
                .set("authorization", token)
                .send({});

            expect(res.status).toBe(200);
            expect(res.body.updatedUser.name).toBe(user.name);
            expect(res.body.updatedUser.phone).toBe(user.phone);
        });

        it("should return error if password is too short", async () => {
            const res = await request(app)
                .put("/api/v1/auth/profile")
                .set("authorization", token)
                .send({ password: "123" });

            expect(res.body.error).toMatch(/at least 6 characters/);

            const unchangedUser = await userModel.findById(user._id);
            const isMatch = await comparePassword("oldpassword", unchangedUser.password);
            expect(isMatch).toBe(true);
        });

        it("should return 401 if no token provided", async () => {
            jest.spyOn(console, 'log').mockImplementation(() => { });

            const res = await request(app)
                .put("/api/v1/auth/profile")
                .send({ name: "Hacker Name" });

            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/Unauthorized Access/);

            console.log.mockRestore();
        });

        it("should handle internal server errors", async () => {
            jest.spyOn(userModel, "findById").mockRejectedValueOnce(new Error("DB error"));
            jest.spyOn(console, 'log').mockImplementation(() => { });

            const res = await request(app)
                .put("/api/v1/auth/profile")
                .set("authorization", token)
                .send({ name: "Test" });

            expect(res.status).toBe(500);
            expect(res.body.message).toMatch(/Error Updating Profile/);

            jest.restoreAllMocks();
        });
    });

    describe("getOrdersController Integration with Auth Middleware, UserModel, \
        OrderModel, ProductModel and CategoryModel", () => {
        let user;
        let token;
        let otherUser;
        let category, product;

        beforeEach(async () => {
            const hashed = await hashPassword("password123");
            user = await userModel.create({
                name: "Order User",
                email: "orderuser@test.com",
                password: hashed,
                phone: "1112223333",
                address: "123 Order Lane",
                answer: "red",
            });

            token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET);

            otherUser = await userModel.create({
                name: "Other User",
                email: "other@test.com",
                password: hashed,
                phone: "9998887777",
                address: "999 Other St",
                answer: "blue",
            });

            // category name needs to be unique
            category = await categoryModel.create({
                name: `Test Cat${Date.now()}`,
                slug: "test-cat"
            });

            product = await productModel.create({
                name: "Test Product",
                slug: "test-product",
                description: "A test product",
                price: 100,
                category: category._id,
                quantity: 10,
            });

            await orderModel.create({
                products: [product._id],
                payment: { method: "card" },
                buyer: user._id,
                status: "Not Processed",
            });

            await orderModel.create({
                products: [product._id],
                payment: { method: "card" },
                buyer: otherUser._id,
                status: "Processing",
            });
        });

        it("should return all orders for the signed-in user", async () => {
            const res = await request(app)
                .get("/api/v1/auth/orders")
                .set("authorization", token);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
            expect(res.body[0].buyer.name).toBe("Order User");
            expect(res.body[0].products[0].name).toBe("Test Product");
        });

        it("should return empty array if user has no orders", async () => {
            const noOrderUser = await userModel.create({
                name: "No Orders",
                email: "noorders@test.com",
                password: await hashPassword("password123"),
                phone: "5555555555",
                address: "No Orders Street",
                answer: "none",
            });
            const noOrderToken = JWT.sign({ _id: noOrderUser._id }, process.env.JWT_SECRET);

            const res = await request(app)
                .get("/api/v1/auth/orders")
                .set("authorization", noOrderToken);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(0);
        });

        it("should return 401 if no token provided", async () => {
            jest.spyOn(console, 'log').mockImplementation(() => { });

            const res = await request(app).get("/api/v1/auth/orders");
            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/Unauthorized Access/);

            jest.restoreAllMocks();
        });

        it("should handle internal server errors", async () => {
            jest.spyOn(console, "log").mockImplementation(() => { });

            // mimick DB disconnection
            await mongoose.connection.close();

            const res = await request(app)
                .get("/api/v1/auth/orders")
                .set("authorization", token);

            expect(res.status).toBe(500);
            expect(res.body.message).toMatch(/Error Getting Orders/);

            jest.restoreAllMocks();

            // bring DB back for other tests
            if (mongoose.connection.readyState === 0) {
                const mongoUri = mongoServer.getUri();
                await mongoose.connect(mongoUri);
            }
        });
    });

    describe("getAllOrdersController Integration with Auth Middleware, UserModel, \
        OrderModel, ProductModel and CategoryModel", () => {
        let token, adminUser, user, otherUser, category, product;

        beforeEach(async () => {
            const hashed = await hashPassword("password123");
            adminUser = await userModel.create({
                name: "Admin",
                email: "admin@test.com",
                password: await hashPassword("password123"),
                phone: "1234567890",
                address: "Admin Street",
                answer: "red",
                role: 1,
            });

            token = JWT.sign({ _id: adminUser._id }, process.env.JWT_SECRET);

            user = await userModel.create({
                name: "Order User",
                email: "orderuser@test.com",
                password: hashed,
                phone: "1112223333",
                address: "123 Order Lane",
                answer: "red",
            });

            otherUser = await userModel.create({
                name: "Other User",
                email: "other@test.com",
                password: hashed,
                phone: "9998887777",
                address: "999 Other St",
                answer: "blue",
            });

            // category name needs to be unique
            category = await categoryModel.create({
                name: `Test Cat${Date.now()}`,
                slug: "test-cat"
            });

            product = await productModel.create({
                name: "Test Product",
                slug: "test-product",
                description: "A test product",
                price: 100,
                category: category._id,
                quantity: 10,
            });

            await orderModel.create({
                products: [product._id],
                payment: { method: "card" },
                buyer: user._id,
                status: "Not Processed",
            });

            await orderModel.create({
                products: [product._id],
                payment: { method: "card" },
                buyer: otherUser._id,
                status: "Processing",
            });
        });

        it("should return all orders sorted by newest first", async () => {
            const res = await request(app)
                .get("/api/v1/auth/all-orders")
                .set("authorization", token);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(2);

            expect(new Date(res.body[0].createdAt) >= new Date(res.body[1].createdAt)).toBe(true);

            expect(res.body[0].products[0].name).toBe("Test Product");
            expect(res.body[0].buyer.name).toBeDefined();
        });

        it("should return empty array if no orders exist", async () => {
            await orderModel.deleteMany({});

            const res = await request(app)
                .get("/api/v1/auth/all-orders")
                .set("authorization", token);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(0);
        });

        it("should return 401 if no token provided", async () => {
            jest.spyOn(console, 'log').mockImplementation(() => { });
            const res = await request(app).get("/api/v1/auth/all-orders");

            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/Unauthorized Access/);

            jest.restoreAllMocks();
        });
    });

    describe("orderStatusController Integration with Auth Middleware, UserModel, \
        OrderModel, ProductModel and CategoryModel", () => {
        let token, user, adminUser, order;

        beforeEach(async () => {
            const hashed = await hashPassword("password123");
            adminUser = await userModel.create({
                name: "Admin",
                email: "admin@test.com",
                password: hashed,
                phone: "1234567890",
                address: "Admin Street",
                answer: "red",
                role: 1,
            });

            token = JWT.sign({ _id: adminUser._id }, process.env.JWT_SECRET);

            user = await userModel.create({
                name: "User",
                email: "user@example.com",
                password: hashed,
                address: "123 Street",
                phone: "99999999",
                answer: "red",
            });

            order = await orderModel.create({
                buyer: user._id,
                products: [],
                status: "Not Processed",
                payment: {},
            });
        });

        it("should update the order status successfully", async () => {
            const res = await request(app)
                .put(`/api/v1/auth/order-status/${order._id}`)
                .set("authorization", token)
                .send({ status: "shipped" });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe("Shipped");

            const updated = await orderModel.findById(order._id);
            expect(updated.status).toBe("Shipped");
        });

        it("should return 404 if orderId param is missing", async () => {
            const res = await request(app)
                .put(`/api/v1/auth/order-status/`)
                .set("authorization", token)
                .send({ status: "Delivered" });

            // express default as it doesn't match correct param
            expect(res.status).toBe(404);
        });

        it("should return 400 if status is missing", async () => {
            const res = await request(app)
                .put(`/api/v1/auth/order-status/${order._id}`)
                .set("authorization", token)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Status is required/);
        });

        it("should return 400 if status is invalid", async () => {
            const res = await request(app)
                .put(`/api/v1/auth/order-status/${order._id}`)
                .set("authorization", token)
                .send({ status: "InvalidStatus" });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Invalid status/);
        });

        it("should return 404 if order does not exist", async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .put(`/api/v1/auth/order-status/${fakeId}`)
                .set("authorization", token)
                .send({ status: "Delivered" });

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/Order not found/);
        });

        it("should handle internal server errors", async () => {
            jest.spyOn(orderModel, "findByIdAndUpdate").mockRejectedValueOnce(new Error("DB error"));
            jest.spyOn(console, "log").mockImplementation(() => { });

            const res = await request(app)
                .put(`/api/v1/auth/order-status/${order._id}`)
                .set("authorization", token)
                .send({ status: "Delivered" });

            expect(res.status).toBe(500);
            expect(res.body.message).toMatch(/Error Updating Order/);

            jest.restoreAllMocks();
        });
    });
});

