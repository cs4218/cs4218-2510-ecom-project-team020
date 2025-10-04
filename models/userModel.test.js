/**
 * @file userModel.test.js
 * Unit tests for the User mongoose model schema.
 */
import mongoose from "mongoose";
import User from "../models/userModel"; // adjust path if needed

describe("User Model", () => {
  beforeAll(async () => {
    // Use a mocked in-memory connection (no DB needed)
    await mongoose.connect("mongodb://localhost:27017/testdb", {
      serverSelectionTimeoutMS: 1,
    }).catch(() => {}); // ignore if DB isn't running
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  test("has expected schema paths", () => {
    const paths = Object.keys(User.schema.paths);
    expect(paths).toEqual(
      expect.arrayContaining([
        "name",
        "email",
        "password",
        "phone",
        "address",
        "answer",
        "role",
        "createdAt",
        "updatedAt",
        "_id",
        "__v",
      ])
    );
  });

  test("requires required fields", async () => {
    const user = new User({});
    const err = user.validateSync();

    // All required fields should have validation errors
    ["name", "email", "password", "phone", "address", "answer"].forEach((field) => {
      expect(err.errors[field]).toBeDefined();
    });
  });

  test("sets default role to 0", () => {
    const user = new User({
      name: "Alicia",
      email: "test@example.com",
      password: "123456",
      phone: "12345678",
      address: { city: "Singapore" },
      answer: "Blue",
    });
    expect(user.role).toBe(0);
  });

  test("trims name field", () => {
    const user = new User({
      name: "   Alicia   ",
      email: "test2@example.com",
      password: "123456",
      phone: "99999999",
      address: { city: "SG" },
      answer: "Green",
    });
    expect(user.name).toBe("Alicia");
  });

  test("stores and retrieves data properly", () => {
    const data = {
      name: "John Doe",
      email: "john@example.com",
      password: "hashedpassword",
      phone: "98765432",
      address: { street: "Main St", city: "Singapore" },
      answer: "Red",
    };
    const user = new User(data);

    Object.entries(data).forEach(([key, val]) => {
      expect(user[key]).toEqual(val);
    });
  });
});
