import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
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

const seedData = async () => {
  await connectDB();

  // 1. Seed Categories
  const categorySlugs = ['electronics', 'books', 'clothing', 'home-garden', 'sports', 'toys-games', 'health-beauty', 'automotive', 'computers', 'video-games'];
  const categories = [];
  for (const slug of categorySlugs) {
    const name = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    const existing = await categoryModel.findOne({ name });
    if (existing) {
      console.log(`Category ${name} already exists, skipping`);
      categories.push(existing);
      continue;
    }
    const category = new categoryModel({ name, slug, isTestAsset: true });
    await category.save();
    categories.push(category);
    console.log(`Created category: ${name}`);
  }

  // 2. Seed Users
  const userEmails = ['user1@test.com', 'user2@test.com', 'user3@test.com', 'user4@test.com', 'user5@test.com', 'user6@test.com', 'user7@test.com', 'user8@test.com', 'user9@test.com', 'user10@test.com'];
  const hashedPassword = bcrypt.hashSync('pass123', 10);
  for (let i = 0; i < userEmails.length; i++) {
    const email = userEmails[i];
    const existing = await userModel.findOne({ email });
    if (existing) {
      console.log(`User ${email} already exists, skipping`);
      continue;
    }
    const user = new userModel({
      name: `Test User ${i + 1}`,
      email,
      password: hashedPassword,
      phone: `123456789${i}`,
      address: { street: `Test Street ${i + 1}`, city: 'Test City' },
      answer: 'test answer',
      isTestAsset: true
    });
    await user.save();
    console.log(`Created user: ${email}`);
  }

  // 3. Seed Products
  const keywords = ['laptop', 'shoes', 'shirt', 'electronics', 'gaming mouse', 'mechanical keyboard', 'headphones', 'monitor', 'coffee maker', 'blender'];
  const productsCount = 100;
  const usedSlugs = new Set();

  for (let i = 0; i < productsCount; i++) {
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const randomKeyword1 = keywords[Math.floor(Math.random() * keywords.length)];
    const randomKeyword2 = keywords[Math.floor(Math.random() * keywords.length)];
    const name = `${randomKeyword1} ${randomKeyword2}`.trim();
    const description = `A great ${name} for your needs.`;
    const price = Math.floor(Math.random() * (1000 - 10 + 1)) + 10;
    const quantity = Math.floor(Math.random() * (200 - 50 + 1)) + 50;

    let slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    let counter = 1;
    while (usedSlugs.has(slug)) {
      slug = `${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${counter}`;
      counter++;
    }
    usedSlugs.add(slug);

    const product = new productModel({
      name,
      slug,
      description,
      price,
      quantity,
      category: randomCategory._id,
      isTestAsset: true
    });
    const existingProduct = await productModel.findOne({ slug });
    if (existingProduct) {
      console.log(`Product with slug ${slug} already exists, skipping`);
      continue;
    }
    await product.save();
    console.log(`Created product: ${name}`);
  }

  console.log("Seeding completed successfully");
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");
};

seedData().catch(console.error);