import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import JWT from "jsonwebtoken";
import bcrypt from "bcrypt";

// Import actual components (no mocking for integration tests)
import categoryRoutes from "./categoryRoutes.js";
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

describe("Category Routes Integration Tests", () => {
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

    // Set up Express app
    app = express();
    app.use(express.json());
    app.use("/api/v1/category", categoryRoutes);

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

  describe("GET /api/v1/category/get-category - GetCategoriesController Integration", () => {
    it("should return empty array when no categories exist", async () => {
      const response = await request(app).get("/api/v1/category/get-category");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "All categories retrieved successfully"
      );
      expect(response.body.categories).toEqual([]);
    });

    it("should return all categories when they exist", async () => {
      // Create test categories
      const categories = [
        { name: "Electronics", slug: "electronics" },
        { name: "Books", slug: "books" },
        { name: "Clothing", slug: "clothing" },
      ];

      for (const cat of categories) {
        await categoryModel.create(cat);
      }

      const response = await request(app).get("/api/v1/category/get-category");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "All categories retrieved successfully"
      );
      expect(response.body.categories).toHaveLength(3);

      // Verify all categories are returned
      const categoryNames = response.body.categories.map((cat) => cat.name);
      expect(categoryNames).toContain("Electronics");
      expect(categoryNames).toContain("Books");
      expect(categoryNames).toContain("Clothing");
    });

    it("should return categories with correct structure", async () => {
      // Create a category
      await categoryModel.create({
        name: "Test Category",
        slug: "test-category",
      });

      const response = await request(app).get("/api/v1/category/get-category");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.categories).toHaveLength(1);

      const category = response.body.categories[0];
      expect(category).toHaveProperty("_id");
      expect(category).toHaveProperty("name");
      expect(category).toHaveProperty("slug");
      expect(category.name).toBe("Test Category");
      expect(category.slug).toBe("test-category");
    });
  });
  
  describe("GET /api/v1/category/single-category/:slug - SingleCategoryController Integration", () => {
    it("should return category when valid slug is provided", async () => {
      // Create a category
      await categoryModel.create({
        name: "Electronics",
        slug: "electronics",
      });

      const response = await request(app).get(
        "/api/v1/category/single-category/electronics"
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Category retrieved successfully");
      expect(response.body.category).toBeDefined();
      expect(response.body.category.name).toBe("Electronics");
      expect(response.body.category.slug).toBe("electronics");
    });

    it("should return null category when slug does not exist", async () => {
      const response = await request(app).get(
        "/api/v1/category/single-category/non-existent"
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Category retrieved successfully");
      expect(response.body.category).toBeNull();
    });

    it("should handle URL encoding in slug parameter", async () => {
      // Create a category with special characters
      await categoryModel.create({
        name: "Special & Category",
        slug: "special-category",
      });

      const response = await request(app).get(
        "/api/v1/category/single-category/special-category"
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.category.name).toBe("Special & Category");
      expect(response.body.category.slug).toBe("special-category");
    });

    it("should handle very long slug parameters", async () => {
      const longSlug =
        "very-long-category-slug-that-might-cause-issues-with-routing";

      await categoryModel.create({
        name: "Long Slug Category",
        slug: longSlug,
      });

      const response = await request(app).get(
        `/api/v1/category/single-category/${longSlug}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.category.name).toBe("Long Slug Category");
      expect(response.body.category.slug).toBe(longSlug);
    });
  });

  describe("POST /api/v1/category/create-category - CreateCategoryController Integration", () => {
    // Integration test: Testing full flow from route -> middleware -> controller -> database
    it("should successfully create a new category with admin authentication", async () => {
      const categoryData = { name: "Electronics" };

      const response = await request(app)
        .post("/api/v1/category/create-category")
        .set("authorization", adminToken)
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("New category created");
      expect(response.body.category.name).toBe("Electronics");
      expect(response.body.category.slug).toBe("electronics");

      // Verify category was actually saved to database
      const savedCategory = await categoryModel.findOne({
        name: "Electronics",
      });
      expect(savedCategory).toBeTruthy();
      expect(savedCategory.name).toBe("Electronics");
      expect(savedCategory.slug).toBe("electronics");
    });

    it("should reject category creation when user is not admin", async () => {
      const categoryData = { name: "Electronics" };

      const response = await request(app)
        .post("/api/v1/category/create-category")
        .set("authorization", userToken)
        .send(categoryData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Forbidden");

      // Verify category was not created in database
      const savedCategory = await categoryModel.findOne({
        name: "Electronics",
      });
      expect(savedCategory).toBeNull();
    });

    it("should reject category creation without authorization token", async () => {
      const categoryData = { name: "Electronics" };

      const response = await request(app)
        .post("/api/v1/category/create-category")
        .send(categoryData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Unauthorized Access");
    });

    it("should reject creation of duplicate category", async () => {
      // First, create a category
      await categoryModel.create({ name: "Electronics", slug: "electronics" });

      const categoryData = { name: "Electronics" };

      const response = await request(app)
        .post("/api/v1/category/create-category")
        .set("authorization", adminToken)
        .send(categoryData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Category Already Exists");

      // Verify only one category exists in database
      const categoryCount = await categoryModel.countDocuments({
        name: "Electronics",
      });
      expect(categoryCount).toBe(1);
    });

    it("should reject category creation without name", async () => {
      const response = await request(app)
        .post("/api/v1/category/create-category")
        .set("authorization", adminToken)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Name is required");
    });
  });

  describe("PUT /api/v1/category/update-category/:id - UpdateCategoryController Integration", () => {
    let categoryId;

    beforeEach(async () => {
      // Create a category to update
      const category = await categoryModel.create({
        name: "Electronics",
        slug: "electronics",
      });
      categoryId = category._id;
    });

    it("should successfully update an existing category with admin authentication", async () => {
      const updateData = { name: "Updated Electronics" };

      const response = await request(app)
        .put(`/api/v1/category/update-category/${categoryId}`)
        .set("authorization", adminToken)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Category Updated Successfully");
      expect(response.body.category.name).toBe("Updated Electronics");
      expect(response.body.category.slug).toBe("updated-electronics");

      // Verify category was actually updated in database
      const updatedCategory = await categoryModel.findById(categoryId);
      expect(updatedCategory.name).toBe("Updated Electronics");
      expect(updatedCategory.slug).toBe("updated-electronics");
    });

    it("should reject category update when user is not admin", async () => {
      const updateData = { name: "Updated Electronics" };

      const response = await request(app)
        .put(`/api/v1/category/update-category/${categoryId}`)
        .set("authorization", userToken)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Forbidden");

      // Verify category was not updated in database
      const category = await categoryModel.findById(categoryId);
      expect(category.name).toBe("Electronics"); // Original name
    });

    it("should return 404 when updating non-existent category", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = { name: "Updated Electronics" };

      const response = await request(app)
        .put(`/api/v1/category/update-category/${nonExistentId}`)
        .set("authorization", adminToken)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Category not found");
    });

    it("should reject update without name", async () => {
      const response = await request(app)
        .put(`/api/v1/category/update-category/${categoryId}`)
        .set("authorization", adminToken)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Name is required");
    });
  });

  describe("DELETE /api/v1/category/delete-category/:id - DeleteCategoryController Integration", () => {
    let categoryId;

    beforeEach(async () => {
      // Create a category to delete
      const category = await categoryModel.create({
        name: "Electronics",
        slug: "electronics",
      });
      categoryId = category._id;
    });

    it("should successfully delete an existing category with admin authentication", async () => {
      const response = await request(app)
        .delete(`/api/v1/category/delete-category/${categoryId}`)
        .set("authorization", adminToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Category Deleted Successfully");

      // Verify category was actually deleted from database
      const deletedCategory = await categoryModel.findById(categoryId);
      expect(deletedCategory).toBeNull();
    });

    it("should reject category deletion when user is not admin", async () => {
      const response = await request(app)
        .delete(`/api/v1/category/delete-category/${categoryId}`)
        .set("authorization", userToken);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Forbidden");

      // Verify category still exists in database
      const category = await categoryModel.findById(categoryId);
      expect(category).toBeTruthy();
      expect(category.name).toBe("Electronics");
    });

    it("should return 404 when deleting non-existent category", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/v1/category/delete-category/${nonExistentId}`)
        .set("authorization", adminToken);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Category not found");
    });

    it("should reject deletion without authorization token", async () => {
      const response = await request(app).delete(
        `/api/v1/category/delete-category/${categoryId}`
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Unauthorized Access");

      // Verify category still exists in database
      const category = await categoryModel.findById(categoryId);
      expect(category).toBeTruthy();
    });
  });

  describe("CategoryRoutes Integration - End-to-End Workflow", () => {
    it("should handle complete category lifecycle: create -> update -> delete", async () => {
      // 1. Create category
      const createResponse = await request(app)
        .post("/api/v1/category/create-category")
        .set("authorization", adminToken)
        .send({ name: "Test Category" });

      expect(createResponse.status).toBe(201);
      const categoryId = createResponse.body.category._id;

      // 2. Update category
      const updateResponse = await request(app)
        .put(`/api/v1/category/update-category/${categoryId}`)
        .set("authorization", adminToken)
        .send({ name: "Updated Test Category" });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.category.name).toBe("Updated Test Category");

      // 3. Delete category
      const deleteResponse = await request(app)
        .delete(`/api/v1/category/delete-category/${categoryId}`)
        .set("authorization", adminToken);

      expect(deleteResponse.status).toBe(200);

      // 4. Verify category is completely removed
      const finalCategory = await categoryModel.findById(categoryId);
      expect(finalCategory).toBeNull();
    });

    it("should handle concurrent operations correctly", async () => {
      // Create multiple categories concurrently
      const createPromises = [
        request(app)
          .post("/api/v1/category/create-category")
          .set("authorization", adminToken)
          .send({ name: "Category 1" }),
        request(app)
          .post("/api/v1/category/create-category")
          .set("authorization", adminToken)
          .send({ name: "Category 2" }),
        request(app)
          .post("/api/v1/category/create-category")
          .set("authorization", adminToken)
          .send({ name: "Category 3" }),
      ];

      const responses = await Promise.all(createPromises);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Verify all categories exist in database
      const categoriesCount = await categoryModel.countDocuments();
      expect(categoriesCount).toBe(3);
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle database connection errors gracefully", async () => {
      // Temporarily close database connection to simulate error
      await mongoose.connection.close();

      const response = await request(app)
        .post("/api/v1/category/create-category")
        .set("authorization", adminToken)
        .send({ name: "Test Category" });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Reconnect for cleanup
      await mongoose.connect(mongoServer.getUri());
    });

    it("should handle invalid JWT tokens", async () => {
      const response = await request(app)
        .post("/api/v1/category/create-category")
        .set("authorization", "invalid-token")
        .send({ name: "Test Category" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Unauthorized Access");
    });

    it("should handle malformed ObjectId in requests", async () => {
      const response = await request(app)
        .put("/api/v1/category/update-category/invalid-id")
        .set("authorization", adminToken)
        .send({ name: "Updated Category" });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});
