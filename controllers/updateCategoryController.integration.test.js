import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import JWT from "jsonwebtoken";
import bcrypt from "bcrypt";

// Import actual components (no mocking for integration tests)
import { updateCategoryController } from "../controllers/categoryController.js";
import { requireSignIn, isAdmin } from "../middlewares/authMiddleware.js";
import userModel from "../models/userModel.js";
import categoryModel from "../models/categoryModel.js";

let mongoServer;
let app;

// Test data
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

describe("UpdateCategoryController Integration Tests", () => {
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
    app.put("/update-category/:id", requireSignIn, isAdmin, updateCategoryController);

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
    let categoryId;

    beforeEach(async () => {
      // Create a category to update
      const category = await categoryModel.create({ 
        name: "Electronics", 
        slug: "electronics" 
      });
      categoryId = category._id;
    });

    it("should successfully update category when all middleware passes and database operation succeeds", async () => {
      const updateData = { name: "Updated Electronics" };

      const response = await request(app)
        .put(`/update-category/${categoryId}`)
        .set("authorization", adminToken)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Category Updated Successfully");
      expect(response.body.category.name).toBe("Updated Electronics");
      expect(response.body.category.slug).toBe("updated-electronics");

      // Verify actual database state
      const updatedCategory = await categoryModel.findById(categoryId);
      expect(updatedCategory.name).toBe("Updated Electronics");
      expect(updatedCategory.slug).toBe("updated-electronics");
    });

    it("should fail at requireSignIn middleware when no token provided", async () => {
      const updateData = { name: "Updated Electronics" };

      const response = await request(app)
        .put(`/update-category/${categoryId}`)
        .send(updateData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Unauthorized Access");

      // Verify category was not updated in database
      const category = await categoryModel.findById(categoryId);
      expect(category.name).toBe("Electronics"); // Original name
    });

    it("should fail at isAdmin middleware when user is not admin", async () => {
      const updateData = { name: "Updated Electronics" };

      const response = await request(app)
        .put(`/update-category/${categoryId}`)
        .set("authorization", userToken)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Forbidden");

      // Verify category was not updated in database
      const category = await categoryModel.findById(categoryId);
      expect(category.name).toBe("Electronics"); // Original name
    });

    it("should handle non-existent category in database", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = { name: "Updated Electronics" };

      const response = await request(app)
        .put(`/update-category/${nonExistentId}`)
        .set("authorization", adminToken)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Category not found");
    });
  });

  describe("Integration: Controller Validation Logic + Database Interaction", () => {
    let categoryId;

    beforeEach(async () => {
      const category = await categoryModel.create({ 
        name: "Electronics", 
        slug: "electronics" 
      });
      categoryId = category._id;
    });

    it("should validate required fields before attempting database operation", async () => {
      const response = await request(app)
        .put(`/update-category/${categoryId}`)
        .set("authorization", adminToken)
        .send({}); // No name provided

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Name is required");

      // Verify category was not updated in database
      const category = await categoryModel.findById(categoryId);
      expect(category.name).toBe("Electronics"); // Original name
    });

    it("should update slug automatically when updating category name", async () => {
      const updateData = { name: "Home & Garden Equipment" };

      const response = await request(app)
        .put(`/update-category/${categoryId}`)
        .set("authorization", adminToken)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.category.slug).toBe("home-and-garden-equipment");

      // Verify slug in database
      const updatedCategory = await categoryModel.findById(categoryId);
      expect(updatedCategory.slug).toBe("home-and-garden-equipment");
    });

    it("should handle partial updates correctly", async () => {
      const updateData = { name: "Consumer Electronics" };

      const response = await request(app)
        .put(`/update-category/${categoryId}`)
        .set("authorization", adminToken)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.category.name).toBe("Consumer Electronics");
      expect(response.body.category.slug).toBe("consumer-electronics");

      // Verify database state
      const updatedCategory = await categoryModel.findById(categoryId);
      expect(updatedCategory.name).toBe("Consumer Electronics");
      expect(updatedCategory.slug).toBe("consumer-electronics");
      expect(updatedCategory._id.toString()).toBe(categoryId.toString());
    });
  });

  describe("Integration: Error Handling Across All Layers", () => {
    let categoryId;

    beforeEach(async () => {
      const category = await categoryModel.create({ 
        name: "Electronics", 
        slug: "electronics" 
      });
      categoryId = category._id;
    });

    it("should handle JWT verification errors in middleware", async () => {
      const updateData = { name: "Updated Electronics" };

      const response = await request(app)
        .put(`/update-category/${categoryId}`)
        .set("authorization", "invalid-jwt-token")
        .send(updateData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Unauthorized Access");
    });

    it("should handle user not found in isAdmin middleware", async () => {
      // Create token with non-existent user ID
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const invalidToken = JWT.sign({ _id: nonExistentUserId }, process.env.JWT_SECRET);

      const updateData = { name: "Updated Electronics" };

      const response = await request(app)
        .put(`/update-category/${categoryId}`)
        .set("authorization", invalidToken)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("User not found");
    });

    it("should handle invalid ObjectId in route parameters", async () => {
      const updateData = { name: "Updated Electronics" };

      const response = await request(app)
        .put("/update-category/invalid-object-id")
        .set("authorization", adminToken)
        .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Error while updating category");
    });

    it("should handle database connection errors in controller", async () => {
      // Temporarily close database connection
      await mongoose.connection.close();

      const updateData = { name: "Updated Electronics" };

      const response = await request(app)
        .put(`/update-category/${categoryId}`)
        .set("authorization", adminToken)
        .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Something went wrong");

      // Reconnect for cleanup
      await mongoose.connect(mongoServer.getUri());
    });
  });

  describe("Integration: End-to-End Data Flow", () => {
    let categoryId;

    beforeEach(async () => {
      const category = await categoryModel.create({ 
        name: "Electronics", 
        slug: "electronics" 
      });
      categoryId = category._id;
    });

    it("should handle complete data transformation from request to database", async () => {
      const updateData = { name: "  Premium Electronics  " };

      const response = await request(app)
        .put(`/update-category/${categoryId}`)
        .set("authorization", adminToken)
        .send(updateData);

      expect(response.status).toBe(200);
      
      // Check response data
      expect(response.body.category.name).toBe("  Premium Electronics  ");
      expect(response.body.category.slug).toBe("premium-electronics");

      // Verify database storage
      const savedCategory = await categoryModel.findById(categoryId);
      expect(savedCategory.name).toBe("  Premium Electronics  ");
      expect(savedCategory.slug).toBe("premium-electronics");
    });

    it("should handle concurrent update attempts on same category", async () => {
      const updateData1 = { name: "Sports Equipment" };
      const updateData2 = { name: "Athletic Gear" };

      // Attempt to update the same category concurrently
      const promises = [
        request(app)
          .put(`/update-category/${categoryId}`)
          .set("authorization", adminToken)
          .send(updateData1),
        request(app)
          .put(`/update-category/${categoryId}`)
          .set("authorization", adminToken)
          .send(updateData2)
      ];

      const responses = await Promise.allSettled(promises);

      // Both should succeed (last write wins in MongoDB)
      responses.forEach(result => {
        if (result.status === 'fulfilled') {
          expect(result.value.status).toBe(200);
        }
      });

      // Verify final state in database
      const finalCategory = await categoryModel.findById(categoryId);
      expect(finalCategory.name).toMatch(/Sports Equipment|Athletic Gear/);
    });

    it("should maintain database consistency during updates", async () => {
      // Create multiple categories
      const category1 = await categoryModel.create({ name: "Books", slug: "books" });
      const category2 = await categoryModel.create({ name: "Movies", slug: "movies" });

      // Update one category
      const updateData = { name: "Digital Books" };

      const response = await request(app)
        .put(`/update-category/${category1._id}`)
        .set("authorization", adminToken)
        .send(updateData);

      expect(response.status).toBe(200);

      // Verify other categories remain unchanged
      const unchangedCategory = await categoryModel.findById(category2._id);
      expect(unchangedCategory.name).toBe("Movies");
      expect(unchangedCategory.slug).toBe("movies");

      // Verify updated category
      const updatedCategory = await categoryModel.findById(category1._id);
      expect(updatedCategory.name).toBe("Digital Books");
      expect(updatedCategory.slug).toBe("digital-books");
    });
  });
});