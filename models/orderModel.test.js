// This file contains unit tests generated with AI assistance but curated, validated and refined by me.
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Order from "./orderModel.js";

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "testdb" });
  await Order.syncIndexes();
});

afterEach(async () => {
  await Order.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("Order model", () => {
  it("sets default status to 'Not Processed'", async () => {
    const order = await Order.create({
      products: [new mongoose.Types.ObjectId()],
      payment: { method: "card" },
      buyer: new mongoose.Types.ObjectId(),
    });
    expect(order.status).toBe("Not Processed");
  });

  it("accepts valid status values", async () => {
    const order = await Order.create({
      products: [new mongoose.Types.ObjectId()],
      payment: { method: "card" },
      buyer: new mongoose.Types.ObjectId(),
      status: "Shipped",
    });
    expect(order.status).toBe("Shipped");
  });

  it("rejects invalid status values", async () => {
    const order = new Order({
      products: [new mongoose.Types.ObjectId()],
      payment: { method: "card" },
      buyer: new mongoose.Types.ObjectId(),
      status: "UnknownStatus",
    });
    await expect(order.save()).rejects.toHaveProperty("name", "ValidationError");
  });

  it("requires products, payment, and buyer fields", async () => {
    const order = new Order({});
    await expect(order.save()).rejects.toHaveProperty("name", "ValidationError");
  });

  it("stores product and buyer as ObjectIds", async () => {
    const productId = new mongoose.Types.ObjectId();
    const buyerId = new mongoose.Types.ObjectId();
    const order = await Order.create({
      products: [productId],
      payment: { method: "card" },
      buyer: buyerId,
    });
    expect(order.products[0]).toEqual(productId);
    expect(order.buyer).toEqual(buyerId);
  });
});