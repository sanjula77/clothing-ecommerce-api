import mongoose from "mongoose";
import app from "./src/app.js";
import { env } from "./src/config/env.js";

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (!env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    const options = {
      // Remove deprecated options and use modern connection options
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };

    const conn = await mongoose.connect(env.MONGO_URI, options);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    // Provide helpful error messages based on error type
    if (
      error.message.includes("ENOTFOUND") ||
      error.message.includes("querySrv")
    ) {
      console.error("\n💡 Troubleshooting tips:");
      console.error("   1. Check your internet connection");
      console.error("   2. Verify your MONGO_URI in .env file");
      console.error("   3. If using MongoDB Atlas:");
      console.error("      - Ensure your cluster is running (not paused)");
      console.error("      - Check your IP whitelist in Atlas Network Access");
      console.error("      - Verify your connection string format");
      console.error(
        "   4. For local MongoDB, use: mongodb://localhost:27017/clothing-ecommerce"
      );
    }

    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await connectDB();

    const PORT = env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});

startServer();
