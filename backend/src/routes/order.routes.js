import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// All order routes require authentication
router.use(protect);

// Create new order (checkout)
router.post("/", createOrder);

// Get user's orders (must come before /:id route)
router.get("/my", getMyOrders);

// Update order status (for future admin implementation)
router.put("/:id/status", updateOrderStatus);

// Get order by ID
router.get("/:id", getOrderById);

export default router;
