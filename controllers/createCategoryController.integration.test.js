import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import JWT from "jsonwebtoken";
import bcrypt from "bcrypt";

// Import actual components (no mocking for integration tests)
import { createCategoryController } from "../controllers/categoryController.js";
import { requireSignIn, isAdmin } from "../middlewares/authMiddleware.js";
import userModel from "../models/userModel.js";
import categoryModel from "../models/categoryModel.js";

let mongoServer;
let app;

const adminUser = {
  name: "Admin User",
  email: "admin@test.com",
  password: "password123",
  phone: "1234567890",
  address: { street: "123 Main St", city: "Test City" },
  answer: "test answer",
  role: 1, // Admin role
};

const regularUser = {
  name: "Regular User",
  email: "user@test.com",
  password: "password123",
  phone: "1234567890",
  address: { street: "456 Oak St", city: "Test City" },
  answer: "test answer",
  role: 0, // Regular user role
};

describe("CreateCategoryController Integration Tests", () => {
  let adminToken;
  let userToken;
  let adminUserId;
  let regularUserId;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to in-memory database
    await mongoose.connect(mongoUri);

    // Set up Express app with actual middleware chain
    app = express();
    app.use(express.json());
    app.post("/create-category", requireSignIn, isAdmin, createCategoryController);

    // Create test users
    const hashedPasswordAdmin = await bcrypt.hash(adminUser.password, 10);
    const hashedPasswordUser = await bcrypt.hash(regularUser.password, 10);

    const createdAdminUser = await userModel.create({
      ...adminUser,
      password: hashedPasswordAdmin,
    });

    const createdRegularUser = await userModel.create({
      ...regularUser,
      password: hashedPasswordUser,
    });

    adminUserId = createdAdminUser._id;
    regularUserId = createdRegularUser._id;

    // Generate JWT tokens
    process.env.JWT_SECRET = "test-secret-key";
    adminToken = JWT.sign({ _id: adminUserId }, process.env.JWT_SECRET);
    userToken = JWT.sign({ _id: regularUserId }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean up categories before each test
    await categoryModel.deleteMany({});
  });

  describe("Integration: Middleware Chain + Controller + Database", () => {
    it("should successfully create category when all middleware passes and database operation succeeds", async () => {
      const categoryData = { name: "Electronics" };

      const response = await request(app)
        .post("/create-category")
        .set("authorization", adminToken)
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("New category created");
      expect(response.body.category.name).toBe("Electronics");
      expect(response.body.category.slug).toBe("electronics");

      // Verify actual database state
      const savedCategory = await categoryModel.findOne({ name: "Electronics" });
      expect(savedCategory).toBeTruthy();
      expect(savedCategory.name).toBe("Electronics");
      expect(savedCategory.slug).toBe("electronics");
    });

    it("should fail at requireSignIn middleware when no token provided", async () => {
      const categoryData = { name: "Electronics" };

      const response = await request(app)
        .post("/create-category")
        .send(categoryData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Unauthorized Access");

      // Verify no category was created in database
      const savedCategory = await categoryModel.findOne({ name: "Electronics" });
      expect(savedCategory).toBeNull();
    });

    it("should fail at isAdmin middleware when user is not admin", async () => {
      const categoryData = { name: "Electronics" };

      const response = await request(app)
        .post("/create-category")
        .set("authorization", userToken)
        .send(categoryData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Forbidden");

      // Verify no category was created in database
      const savedCategory = await categoryModel.findOne({ name: "Electronics" });
      expect(savedCategory).toBeNull();
    });

    it("should handle database constraint violations (duplicate category)", async () => {
      // First, create a category directly in database
      await categoryModel.create({ name: "Electronics", slug: "electronics" });

      const categoryData = { name: "Electronics" };

      const response = await request(app)
        .post("/create-category")
        .set("authorization", adminToken)
        .send(categoryData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Category Already Exists");

      // Verify only one category exists in database
      const categoryCount = await categoryModel.countDocuments({ name: "Electronics" });
      expect(categoryCount).toBe(1);
    });
  });

  describe("Integration: Controller Validation Logic + Database Interaction", () => {
    it("should validate required fields before attempting database operation", async () => {
      const response = await request(app)
        .post("/create-category")
        .set("authorization", adminToken)
        .send({}); // No name provided

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Name is required");

      // Verify no category was created in database
      const categoryCount = await categoryModel.countDocuments();
      expect(categoryCount).toBe(0);
    });

    it("should check for existing category before creating new one", async () => {
      // Create category directly in database
      await categoryModel.create({ name: "Books", slug: "books" });

      const categoryData = { name: "Books" };

      const response = await request(app)
        .post("/create-category")
        .set("authorization", adminToken)
        .send(categoryData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Category Already Exists");

      // Verify still only one category exists
      const categoryCount = await categoryModel.countDocuments({ name: "Books" });
      expect(categoryCount).toBe(1);
    });

    it("should generate slug automatically when creating category", async () => {
      const categoryData = { name: "Home & Garden" };

      const response = await request(app)
        .post("/create-category")
        .set("authorization", adminToken)
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body.category.slug).toBe("home-and-garden");

      // Verify slug in database
      const savedCategory = await categoryModel.findOne({ name: "Home & Garden" });
      expect(savedCategory.slug).toBe("home-and-garden");
    });
  });

  describe("Integration: Error Handling Across All Layers", () => {
    it("should handle JWT verification errors in middleware", async () => {
      const categoryData = { name: "Electronics" };

      const response = await request(app)
        .post("/create-category")
        .set("authorization", "invalid-jwt-token")
        .send(categoryData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Unauthorized Access");
    });

    it("should handle user not found in isAdmin middleware", async () => {
      // Create token with non-existent user ID
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const invalidToken = JWT.sign({ _id: nonExistentUserId }, process.env.JWT_SECRET);

      const categoryData = { name: "Electronics" };

      const response = await request(app)
        .post("/create-category")
        .set("authorization", invalidToken)
        .send(categoryData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("User not found");
    });

    it("should handle database connection errors in controller", async () => {
      // Temporarily close database connection
      await mongoose.connection.close();

      const categoryData = { name: "Electronics" };

      const response = await request(app)
        .post("/create-category")
        .set("authorization", adminToken)
        .send(categoryData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Something went wrong");

      // Reconnect for cleanup
      await mongoose.connect(mongoServer.getUri());
    });
  });

  describe("Integration: End-to-End Data Flow", () => {
    it("should handle complete data transformation from request to database", async () => {
      const categoryData = { name: "  Consumer Electronics  " };

      const response = await request(app)
        .post("/create-category")
        .set("authorization", adminToken)
        .send(categoryData);

      expect(response.status).toBe(201);

      // Check response data
      expect(response.body.category.name).toBe("  Consumer Electronics  ");
      expect(response.body.category.slug).toBe("consumer-electronics");

      // Verify database storage
      const savedCategory = await categoryModel.findOne({ 
        name: "  Consumer Electronics  " 
      });
      expect(savedCategory).toBeTruthy();
      expect(savedCategory.slug).toBe("consumer-electronics");
      expect(savedCategory._id).toBeTruthy();
    });

    it("should handle concurrent category creation attempts", async () => {
      const categoryData = { name: "Sports" };

      // Attempt to create the same category concurrently
      const promises = [
        request(app)
          .post("/create-category")
          .set("authorization", adminToken)
          .send(categoryData),
        request(app)
          .post("/create-category")
          .set("authorization", adminToken)
          .send(categoryData)
      ];

      const responses = await Promise.allSettled(promises);

      // One should succeed (201), one should fail with either 409 (duplicate) or 500 (error)
      const statuses = responses.map(result => 
        result.status === 'fulfilled' ? result.value.status : null
      ).filter(status => status !== null);

      expect(statuses).toContain(201);
      expect(statuses.some(status => status === 409 || status === 500)).toBe(true);

      // Verify only one category exists in database
      const categoryCount = await categoryModel.countDocuments({ name: "Sports" });
      expect(categoryCount).toBe(1);
    });
  });
});
