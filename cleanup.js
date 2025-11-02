import mongoose from "mongoose";
import dotenv from "dotenv";
import categoryModel from "./models/categoryModel.js";
import userModel from "./models/userModel.js";
import productModel from "./models/productModel.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const cleanupTestData = async () => {
  await connectDB();

  // Delete test categories
  const categoryResult = await categoryModel.deleteMany({ isTestAsset: true });
  console.log(`Deleted ${categoryResult.deletedCount} test categories`);

  // Delete test users (where address is "123 Test St")
  const userResult = await userModel.deleteMany({ address: "123 Test St" });
  console.log(`Deleted ${userResult.deletedCount} test users`);

  // Delete test products
  const productResult = await productModel.deleteMany({ isTestAsset: true });
  console.log(`Deleted ${productResult.deletedCount} test products`);

  console.log("Cleanup completed successfully");
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");
};

cleanupTestData().catch(console.error);