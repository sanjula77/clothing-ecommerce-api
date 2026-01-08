import mongoose from "mongoose";
import dotenv from "dotenv";
import { seedProducts } from "../seed/products.seed.js";
import { env } from "../config/env.js";

dotenv.config();

const runSeed = async () => {
  try {
    console.log("🌱 Starting database seeding...\n");

    // Connect to MongoDB
    if (!env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    await mongoose.connect(env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Run seed functions
    await seedProducts();

    console.log("\n✨ Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seeding failed:", error.message);
    console.error(error);
    process.exit(1);
  }
};

runSeed();

