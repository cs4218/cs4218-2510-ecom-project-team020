import express from "express";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import JWT from "jsonwebtoken";

import slugify from "slugify";
import productRoutes from "../routes/productRoutes.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";

jest.setTimeout(30000);

describe("ProductController integration", () => {
let app;
let mongoServer;
let adminToken;
let nonAdminToken;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
    mongoServer = await MongoMemoryServer.create({
      instance: { ip: "127.0.0.1" },
    });
    await mongoose.connect(mongoServer.getUri(), {
      dbName: "product-controller-int-tests",
    });

    await Promise.all([
      userModel.syncIndexes(),
      productModel.syncIndexes(),
      categoryModel.syncIndexes(),
    ]);

    const admin = await userModel.create({
      name: "Integration Admin",
      email: "integration-admin@example.com",
      password: "hashed-password",
      phone: "12345678",
      address: { line1: "1 Integration Way" },
      answer: "test",
      role: 1,
    });

    adminToken = JWT.sign({ _id: admin._id }, process.env.JWT_SECRET);

    const contributor = await userModel.create({
      name: "Integration User",
      email: "integration-user@example.com",
      password: "hashed-password",
      phone: "87654321",
      address: { line1: "2 Integration Way" },
      answer: "test",
      role: 0,
    });

    nonAdminToken = JWT.sign({ _id: contributor._id }, process.env.JWT_SECRET);

    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use("/api/v1/product", productRoutes);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await Promise.all([
      productModel.deleteMany({}),
      categoryModel.deleteMany({}),
    ]);
  });

  const createCategory = async (name) => {
    const slug =
      name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now().toString(36);
    return categoryModel.create({ name, slug });
  };

  const createProductViaApi = async (
    {
      name,
      description = "High quality product",
      price,
      categoryId,
      quantity = 10,
      shipping = true,
      token = adminToken,
      photo,
    },
    { expectStatus = 201 } = {}
  ) => {
    let requestBuilder = request(app).post("/api/v1/product/create-product");

    if (token) {
      requestBuilder = requestBuilder.set("Authorization", token);
    }

    requestBuilder = requestBuilder
      .field("name", name)
      .field("description", description)
      .field("price", price)
      .field("category", categoryId)
      .field("quantity", quantity)
      .field("shipping", String(shipping));

    if (photo) {
      const { buffer, filename = "photo.jpg", contentType = "image/jpeg" } = photo;
      requestBuilder = requestBuilder.attach("photo", buffer, {
        filename,
        contentType,
      });
    }

    const response = await requestBuilder;

    if (response.status !== expectStatus) {
      throw new Error(
        `Expected create product to return ${expectStatus} but got ${response.status}: ${JSON.stringify(
          response.body
        )}`
      );
    }

    return {
      response,
      product: response.body?.products,
    };
  };

  it("allows an admin to create a product and persists a slugified name", async () => {
    const category = await createCategory("Phones");

    const { product: createdProduct } = await createProductViaApi({
      name: "Pixel XL",
      price: 799,
      categoryId: category._id.toString(),
    });

    expect(createdProduct.name).toBe("Pixel XL");
    expect(createdProduct.slug).toBe(slugify("Pixel XL"));
    expect(createdProduct.category).toBe(category._id.toString());

    const stored = await productModel
      .findById(createdProduct._id)
      .lean()
      .exec();
    expect(stored).toBeTruthy();
    expect(stored.slug).toBe(slugify("Pixel XL"));
    expect(stored?.category?.toString()).toBe(category._id.toString());
  });

  it("rejects product creation when not signed in", async () => {
    const category = await createCategory("Unsigned");

    const { response } = await createProductViaApi(
      {
        name: "Unsigned Product",
        price: 120,
        categoryId: category._id.toString(),
        token: null,
      },
      { expectStatus: 401 }
    );

    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/unauthorized/i);
  });

  it("rejects product creation for non-admin users", async () => {
    const category = await createCategory("Restricted");

    const { response } = await createProductViaApi(
      {
        name: "Non Admin Product",
        price: 88,
        categoryId: category._id.toString(),
        token: nonAdminToken,
      },
      { expectStatus: 403 }
    );

    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/forbidden/i);
  });

  it("returns created products with populated category metadata", async () => {
    const category = await createCategory("Laptops");

    await createProductViaApi({
      name: "MacBook Pro",
      description: "Apple laptop",
      price: 1999,
      categoryId: category._id.toString(),
    });

    const response = await request(app)
      .get("/api/v1/product/get-product")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.countTotal).toBe(1);
    expect(response.body.products[0]).toMatchObject({
      name: "MacBook Pro",
      category: expect.objectContaining({
        _id: category._id.toString(),
        name: category.name,
        slug: category.slug,
      }),
    });
  });

  it("retrieves a single product by slug", async () => {
    const category = await createCategory("Wearables");

    const { product } = await createProductViaApi({
      name: "Fitband Elite",
      description: "Smart fitness tracker",
      price: 199,
      categoryId: category._id.toString(),
    });

    const response = await request(app)
      .get(`/api/v1/product/get-product/${product.slug}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.product).toMatchObject({
      _id: product._id,
      name: "Fitband Elite",
      category: expect.objectContaining({
        _id: category._id.toString(),
      }),
    });
  });

  it("returns null product when slug is unknown", async () => {
    const response = await request(app)
      .get("/api/v1/product/get-product/does-not-exist")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.product).toBeNull();
  });

  it("filters products by category and price range", async () => {
    const phonesCategory = await createCategory("Phones");
    const laptopsCategory = await createCategory("Laptops");

    await createProductViaApi({
      name: "Budget Phone",
      price: 299,
      categoryId: phonesCategory._id.toString(),
    });
    await createProductViaApi({
      name: "Premium Phone",
      price: 999,
      categoryId: phonesCategory._id.toString(),
    });
    await createProductViaApi({
      name: "Gaming Laptop",
      price: 1499,
      categoryId: laptopsCategory._id.toString(),
    });

    const response = await request(app)
      .post("/api/v1/product/product-filters")
      .send({
        checked: [phonesCategory._id.toString()],
        radio: [200, 800],
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.products).toHaveLength(1);
    expect(response.body.products[0]).toMatchObject({
      name: "Budget Phone",
    });
  });

  it("retrieves related products within the same category", async () => {
    const accessoriesCategory = await createCategory("Accessories");

    const { product: baseProduct } = await createProductViaApi({
      name: "Primary Case",
      price: 49,
      categoryId: accessoriesCategory._id.toString(),
    });
    const { product: siblingProduct } = await createProductViaApi({
      name: "Secondary Case",
      price: 59,
      categoryId: accessoriesCategory._id.toString(),
    });

    const response = await request(app)
      .get(
        `/api/v1/product/related-product/${baseProduct._id}/${accessoriesCategory._id}`
      )
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.products).toHaveLength(1);
    expect(response.body.products[0]._id).toBe(siblingProduct._id);
  });

  it("updates product details and regenerates slug", async () => {
    const category = await createCategory("Accessories");

    const { product } = await createProductViaApi({
      name: "Carry Pouch",
      description: "Original description",
      price: 40,
      quantity: 5,
      categoryId: category._id.toString(),
    });

    const updateResponse = await request(app)
      .put(`/api/v1/product/update-product/${product._id}`)
      .set("Authorization", adminToken)
      .field("name", "Carry Pouch Plus")
      .field("description", "Updated description")
      .field("price", 55)
      .field("category", category._id.toString())
      .field("quantity", 8)
      .field("shipping", "false")
      .expect(201);

    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.products).toMatchObject({
      name: "Carry Pouch Plus",
      slug: slugify("Carry Pouch Plus"),
    });

    const updatedDoc = await productModel.findById(product._id).lean().exec();
    expect(updatedDoc.name).toBe("Carry Pouch Plus");
    expect(updatedDoc.slug).toBe(slugify("Carry Pouch Plus"));
    expect(updatedDoc.price).toBe(55);
  });

  it("rejects product updates without required fields", async () => {
    const category = await createCategory("Monitors");

    const { product } = await createProductViaApi({
      name: "Desk Monitor",
      price: 250,
      categoryId: category._id.toString(),
    });

    const response = await request(app)
      .put(`/api/v1/product/update-product/${product._id}`)
      .set("Authorization", adminToken)
      .field("description", "Attempted update without name")
      .field("price", 260)
      .field("category", category._id.toString())
      .field("quantity", 4)
      .field("shipping", "true")
      .expect(500);

    expect(response.body).toMatchObject({ error: "Name is Required" });
  });

  it("prevents non-admin users from updating products", async () => {
    const category = await createCategory("Cases");

    const { product } = await createProductViaApi({
      name: "Basic Case",
      price: 20,
      categoryId: category._id.toString(),
    });

    const response = await request(app)
      .put(`/api/v1/product/update-product/${product._id}`)
      .set("Authorization", nonAdminToken)
      .field("name", "Basic Case Updated")
      .field("description", "Updated")
      .field("price", 22)
      .field("category", category._id.toString())
      .field("quantity", 4)
      .field("shipping", "true")
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/forbidden/i);
  });

  it("deletes a product via API", async () => {
    const category = await createCategory("Deletion");

    const { product } = await createProductViaApi({
      name: "Disposable Item",
      price: 10,
      categoryId: category._id.toString(),
    });

    const deleteResponse = await request(app)
      .delete(`/api/v1/product/delete-product/${product._id}`)
      .expect(200);

    expect(deleteResponse.body.success).toBe(true);
    expect(deleteResponse.body.message).toMatch(/deleted/i);

    const existing = await productModel.findById(product._id).lean();
    expect(existing).toBeNull();
  });

  it("reports the total product count", async () => {
    const category = await createCategory("Counting");

    await createProductViaApi({
      name: "Counted One",
      price: 10,
      categoryId: category._id.toString(),
    });
    await createProductViaApi({
      name: "Counted Two",
      price: 20,
      categoryId: category._id.toString(),
    });

    const response = await request(app)
      .get("/api/v1/product/product-count")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.total).toBe(2);
  });

  it("supports paginated product listing", async () => {
    const category = await createCategory("Pagination");

    for (let index = 1; index <= 7; index += 1) {
      await createProductViaApi({
        name: `Paginated Item ${index}`,
        price: 50 + index,
        categoryId: category._id.toString(),
      });
    }

    const pageOne = await request(app)
      .get("/api/v1/product/product-list/1")
      .expect(200);
    expect(pageOne.body.success).toBe(true);
    expect(pageOne.body.products.length).toBe(6);

    const pageTwo = await request(app)
      .get("/api/v1/product/product-list/2")
      .expect(200);

    expect(pageTwo.body.success).toBe(true);
    expect(pageTwo.body.products.length).toBe(1);
    expect(pageTwo.body.products[0].name).toBe("Paginated Item 1");
  });

  it("searches products by keyword", async () => {
    const category = await createCategory("Searchables");

    await createProductViaApi({
      name: "Galaxy Phone",
      description: "Android flagship",
      price: 899,
      categoryId: category._id.toString(),
    });
    await createProductViaApi({
      name: "Laptop Bag",
      description: "Protective case",
      price: 120,
      categoryId: category._id.toString(),
    });

    const response = await request(app)
      .get("/api/v1/product/search/phone")
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe("Galaxy Phone");
  });

  it("returns category details and products by slug", async () => {
    const tabletsCategory = await createCategory("Tablets");

    const { product: createdProduct } = await createProductViaApi({
      name: "Surface Go",
      price: 599,
      categoryId: tabletsCategory._id.toString(),
    });

    const response = await request(app)
      .get(`/api/v1/product/product-category/${tabletsCategory.slug}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.category).toMatchObject({
      _id: tabletsCategory._id.toString(),
      slug: tabletsCategory.slug,
    });
    expect(response.body.products).toHaveLength(1);
    expect(response.body.products[0]._id).toBe(createdProduct._id);
  });
});
