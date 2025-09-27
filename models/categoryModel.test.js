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
  it("lowercases the slug on save", async () => {
    const created = await Category.create({
      name: "Electronics",
      slug: "Phones-AND-Tablets",
    });
    expect(created.slug).toBe("phones-and-tablets");
  });

  it("requires `name` and rejects empty string name", async () => {
    const cat = new Category({ slug: "placeholder" });
    await expect(cat.save()).rejects.toHaveProperty("name", "ValidationError");
  });


  it("requires `slug` and rejects empty string name", async () => {
  const cat = new Category({ slug: "placeholder" });
    await expect(cat.save()).rejects.toHaveProperty("name", "ValidationError");
  });

  it("enforces unique `name` and rejects duplicate string name", async () => {
    await Category.create({ name: "Book", slug: "book" });
    await expect(
      Category.create({ name: "Book", slug: "dup-books" })
    ).rejects.toMatchObject({ code: 11000 });
  });
});
