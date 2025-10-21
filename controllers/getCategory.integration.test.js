import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import {
  getCategoriesController,
  singleCategoryController,
} from "./categoryController.js";
import categoryModel from "../models/categoryModel.js";

let mongoServer;
let app;

describe("Category Get Integration Tests", () => {
  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to in-memory database
    await mongoose.connect(mongoUri);

    // Create Express app with routes
    app = express();
    app.use(express.json());

    // Set up routes
    app.get("/api/v1/category/get-category", getCategoriesController);
    app.get("/api/v1/category/single-category/:slug", singleCategoryController);
  });

  afterAll(async () => {
    // Clean up
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database before each test
    await categoryModel.deleteMany({});
  });

  describe("GET /api/v1/category/get-category", () => {
    it("should return all categories, no categories", async () => {
      const response = await request(app)
        .get("/api/v1/category/get-category")
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "All categories retrieved successfully",
        categories: [],
      });
    });

    it("should return all categories, single category", async () => {
      // Create a category
      const category = new categoryModel({
        name: "Electronics",
        slug: "electronics",
      });
      await category.save();

      const response = await request(app)
        .get("/api/v1/category/get-category")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "All categories retrieved successfully"
      );
      expect(response.body.categories).toHaveLength(1);
      expect(response.body.categories[0].name).toBe("Electronics");
      expect(response.body.categories[0].slug).toBe("electronics");
      expect(response.body.categories[0]._id).toBeDefined();
    });

    it("should return all categories, multiple categories", async () => {
      // Create multiple categories
      const categories = [
        { name: "Electronics", slug: "electronics" },
        { name: "Clothing", slug: "clothing" },
        { name: "Books", slug: "books" },
      ];

      for (const cat of categories) {
        const category = new categoryModel(cat);
        await category.save();
      }

      const response = await request(app)
        .get("/api/v1/category/get-category")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.categories).toHaveLength(3);

      const categoryNames = response.body.categories.map((cat) => cat.name);
      expect(categoryNames).toContain("Electronics");
      expect(categoryNames).toContain("Clothing");
      expect(categoryNames).toContain("Books");
    });
  });

  describe("Get Single Category", () => {
    it("should return category when valid slug is provided", async () => {
      const category = await categoryModel.create({
        name: "Electronics",
        slug: "electronics",
      });
      await category.save();

      const response = await request(app)
        .get("/api/v1/category/single-category/electronics")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Category retrieved successfully");
      expect(response.body.category).toBeDefined();
      expect(response.body.category.name).toBe("Electronics");
      expect(response.body.category.slug).toBe("electronics");
    });

    it("should return null category when slug does not exist", async () => {
      const response = await request(app)
        .get("/api/v1/category/single-category/non-existent")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Category retrieved successfully");
      expect(response.body.category).toBeNull();
    });
  });
});
