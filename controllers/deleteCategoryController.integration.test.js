import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import JWT from "jsonwebtoken";
import bcrypt from "bcrypt";

// Import actual components (no mocking for integration tests)
import { deleteCategoryController } from "../controllers/categoryController.js";
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

describe("DeleteCategoryController Integration Tests", () => {
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
    app.delete("/delete-category/:id", requireSignIn, isAdmin, deleteCategoryController);

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
      // Create a category to delete
      const category = await categoryModel.create({ 
        name: "Electronics", 
        slug: "electronics" 
      });
      categoryId = category._id;
    });

    it("should successfully delete category when all middleware passes and database operation succeeds", async () => {
      const response = await request(app)
        .delete(`/delete-category/${categoryId}`)
        .set("authorization", adminToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Category Deleted Successfully");

      // Verify actual database state - category should be deleted
      const deletedCategory = await categoryModel.findById(categoryId);
      expect(deletedCategory).toBeNull();
    });

    it("should fail at requireSignIn middleware when no token provided", async () => {
      const response = await request(app)
        .delete(`/delete-category/${categoryId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Unauthorized Access");

      // Verify category still exists in database
      const category = await categoryModel.findById(categoryId);
      expect(category).toBeTruthy();
      expect(category.name).toBe("Electronics");
    });

    it("should fail at isAdmin middleware when user is not admin", async () => {
      const response = await request(app)
        .delete(`/delete-category/${categoryId}`)
        .set("authorization", userToken);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Forbidden");

      // Verify category still exists in database
      const category = await categoryModel.findById(categoryId);
      expect(category).toBeTruthy();
      expect(category.name).toBe("Electronics");
    });

    it("should handle non-existent category in database", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/delete-category/${nonExistentId}`)
        .set("authorization", adminToken);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Category not found");

      // Verify original category still exists
      const originalCategory = await categoryModel.findById(categoryId);
      expect(originalCategory).toBeTruthy();
    });
  });

  describe("Integration: Controller Logic + Database Interaction", () => {
    let categoryId;

    beforeEach(async () => {
      const category = await categoryModel.create({ 
        name: "Electronics", 
        slug: "electronics" 
      });
      categoryId = category._id;
    });

    it("should permanently remove category from database", async () => {
      const response = await request(app)
        .delete(`/delete-category/${categoryId}`)
        .set("authorization", adminToken);

      expect(response.status).toBe(200);

      // Verify category is completely removed
      const deletedCategory = await categoryModel.findById(categoryId);
      expect(deletedCategory).toBeNull();

      // Verify category count
      const totalCategories = await categoryModel.countDocuments();
      expect(totalCategories).toBe(0);
    });

    it("should handle deletion without affecting other categories", async () => {
      // Create additional categories
      const category2 = await categoryModel.create({ 
        name: "Books", 
        slug: "books" 
      });
      const category3 = await categoryModel.create({ 
        name: "Movies", 
        slug: "movies" 
      });

      // Delete the first category
      const response = await request(app)
        .delete(`/delete-category/${categoryId}`)
        .set("authorization", adminToken);

      expect(response.status).toBe(200);

      // Verify target category is deleted
      const deletedCategory = await categoryModel.findById(categoryId);
      expect(deletedCategory).toBeNull();

      // Verify other categories still exist
      const remainingCategory2 = await categoryModel.findById(category2._id);
      const remainingCategory3 = await categoryModel.findById(category3._id);
      expect(remainingCategory2.name).toBe("Books");
      expect(remainingCategory3.name).toBe("Movies");

      // Verify correct count
      const totalCategories = await categoryModel.countDocuments();
      expect(totalCategories).toBe(2);
    });

    it("should handle idempotent deletion attempts", async () => {
      // First deletion
      const response1 = await request(app)
        .delete(`/delete-category/${categoryId}`)
        .set("authorization", adminToken);

      expect(response1.status).toBe(200);

      // Second deletion attempt on same ID
      const response2 = await request(app)
        .delete(`/delete-category/${categoryId}`)
        .set("authorization", adminToken);

      expect(response2.status).toBe(404);
      expect(response2.body.success).toBe(false);
      expect(response2.body.message).toBe("Category not found");
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
      const response = await request(app)
        .delete(`/delete-category/${categoryId}`)
        .set("authorization", "invalid-jwt-token");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Unauthorized Access");

      // Verify category still exists
      const category = await categoryModel.findById(categoryId);
      expect(category).toBeTruthy();
    });

    it("should handle user not found in isAdmin middleware", async () => {
      // Create token with non-existent user ID
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const invalidToken = JWT.sign({ _id: nonExistentUserId }, process.env.JWT_SECRET);

      const response = await request(app)
        .delete(`/delete-category/${categoryId}`)
        .set("authorization", invalidToken);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("User not found");

      // Verify category still exists
      const category = await categoryModel.findById(categoryId);
      expect(category).toBeTruthy();
    });

    it("should handle invalid ObjectId in route parameters", async () => {
      const response = await request(app)
        .delete("/delete-category/invalid-object-id")
        .set("authorization", adminToken);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Error while deleting category");
    });

    it("should handle database connection errors in controller", async () => {
      // Temporarily close database connection
      await mongoose.connection.close();

      const response = await request(app)
        .delete(`/delete-category/${categoryId}`)
        .set("authorization", adminToken);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Something went wrong");

      // Reconnect for cleanup
      await mongoose.connect(mongoServer.getUri());
    });
  });

  describe("Integration: End-to-End Data Flow", () => {
    it("should handle complete deletion lifecycle", async () => {
      // Create category
      const category = await categoryModel.create({ 
        name: "Test Category", 
        slug: "test-category" 
      });

      // Verify category exists
      let existingCategory = await categoryModel.findById(category._id);
      expect(existingCategory).toBeTruthy();

      // Delete category
      const response = await request(app)
        .delete(`/delete-category/${category._id}`)
        .set("authorization", adminToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify category is gone
      const deletedCategory = await categoryModel.findById(category._id);
      expect(deletedCategory).toBeNull();
    });

    it("should handle concurrent deletion attempts on different categories", async () => {
      // Create multiple categories
      const category1 = await categoryModel.create({ name: "Category 1", slug: "category-1" });
      const category2 = await categoryModel.create({ name: "Category 2", slug: "category-2" });
      const category3 = await categoryModel.create({ name: "Category 3", slug: "category-3" });

      // Attempt to delete different categories concurrently
      const promises = [
        request(app)
          .delete(`/delete-category/${category1._id}`)
          .set("authorization", adminToken),
        request(app)
          .delete(`/delete-category/${category2._id}`)
          .set("authorization", adminToken),
        request(app)
          .delete(`/delete-category/${category3._id}`)
          .set("authorization", adminToken)
      ];

      const responses = await Promise.allSettled(promises);

      // All should succeed
      responses.forEach(result => {
        if (result.status === 'fulfilled') {
          expect(result.value.status).toBe(200);
          expect(result.value.body.success).toBe(true);
        }
      });

      // Verify all categories are deleted
      const category1Check = await categoryModel.findById(category1._id);
      const category2Check = await categoryModel.findById(category2._id);
      const category3Check = await categoryModel.findById(category3._id);

      expect(category1Check).toBeNull();
      expect(category2Check).toBeNull();
      expect(category3Check).toBeNull();

      // Verify database is empty
      const totalCategories = await categoryModel.countDocuments();
      expect(totalCategories).toBe(0);
    });

    it("should maintain database integrity during mixed operations", async () => {
      // Create initial categories
      const category1 = await categoryModel.create({ name: "Category 1", slug: "category-1" });
      const category2 = await categoryModel.create({ name: "Category 2", slug: "category-2" });

      // Delete one category
      const deleteResponse = await request(app)
        .delete(`/delete-category/${category1._id}`)
        .set("authorization", adminToken);

      expect(deleteResponse.status).toBe(200);

      // Verify state: one deleted, one remains
      const deletedCategory = await categoryModel.findById(category1._id);
      const remainingCategory = await categoryModel.findById(category2._id);

      expect(deletedCategory).toBeNull();
      expect(remainingCategory).toBeTruthy();
      expect(remainingCategory.name).toBe("Category 2");

      // Verify database consistency
      const totalCategories = await categoryModel.countDocuments();
      expect(totalCategories).toBe(1);
    });
  });
});