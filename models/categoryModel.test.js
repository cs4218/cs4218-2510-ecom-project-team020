import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Category from "../models/categoryModel.js";

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "testdb" });
  await Category.syncIndexes();
});

afterEach(async () => {
  await Category.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("Category model", () => {
  describe("Category model name unit tests", () => {
    it("requires `name` input", async () => {
      const cat = new Category({ slug: "placeholder" });
      await expect(cat.save()).rejects.toHaveProperty("name", "ValidationError");
    });

    it("requires non-empty `name` input", async () => {
      const cat = new Category({ name: "", slug: "slug" });
      await expect(cat.save()).rejects.toHaveProperty("name", "ValidationError");
    });

    it("converts non-string `name` input to string", async () => {
      const created = await Category.create({ name: 123, slug: "123" });
      expect(created.name).toBe("123");
    });

    it("rejects creation of categories with duplicate name", async () => {
      await Category.create({ name: "Books", slug: "books" });
      await expect(
        Category.create({ name: "Books", slug: "dup-books" })
      ).rejects.toMatchObject({ code: 11000 });
    });

    it("converts non-string `name` input and rejects duplicate name", async () => {
      await Category.create({ name: 123, slug: "123" });
      await expect(
        Category.create({ name: 123, slug: "123123" })
      ).rejects.toMatchObject({ code: 11000 });
    });
  });

  describe("Category model slug unit tests", () => {
    it("requires a `slug` input", async () => {
      const cat = new Category({ name: "Name" });
      await expect(cat.save()).rejects.toHaveProperty("name", "ValidationError");
    });

    it("enforces non-empty `slug` input", async () => {
      const cat = new Category({ name: "name", slug: "" });
      await expect(cat.save()).rejects.toHaveProperty("name", "ValidationError");
    });

    it("converts non-string `slug` input to string", async () => {
      const created = await Category.create({ name: "Books", slug: 123 });
      expect(created.slug).toBe("123");
    });

    it("lowercases the slug on save", async () => {
      const created = await Category.create({
        name: "Electronics",
        slug: "ELECTRONICS",
      });
      expect(created.slug).toBe("electronics");
    });

    it("rejects the creation of categories with duplicate slugs", async () => {
      await Category.create({ name: "Phones", slug: "electronics" });
      await expect(
        Category.create({ name: "Tablets", slug: "electronics" })
      ).rejects.toMatchObject({ code: 11000 });
    });

    it("converts non-string `slug` input and rejects duplicate slug", async () => {
      await Category.create({ name: "Numbers", slug: "123" });
      await expect(
        Category.create({ name: "Integers", slug: 123 })
      ).rejects.toMatchObject({ code: 11000 });
    });

    it("lowercases `slug` input and rejects duplicate slug", async () => {
      await Category.create({ name: "Phones", slug: "electronics" });
      await expect(
        Category.create({ name: "Tablets", slug: "ELECTRONICS" })
      ).rejects.toMatchObject({ code: 11000 });
    });
  });
});
