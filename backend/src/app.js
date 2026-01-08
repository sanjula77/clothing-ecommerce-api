import express from "express";
import authRoutes from "./routes/auth.routes.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";
import productRoutes from "./routes/product.routes.js";


const app = express();

// Body parser middleware
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

// Health endpoint
app.get("/api/health", (req, res) =>
  res.status(200).json({ status: "OK", message: "Server is healthy" })
);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

export default app;
