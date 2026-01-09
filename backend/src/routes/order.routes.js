import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validate, validateQuery, validateParams } from "../middleware/validate.js";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  orderIdSchema,
  getMyOrdersQuerySchema,
} from "../validators/order.validator.js";

const router = express.Router();

// All order routes require authentication
router.use(protect);

// Create new order (checkout)
router.post("/", validate(createOrderSchema), createOrder);

// Get user's orders (must come before /:id route)
router.get("/my", validateQuery(getMyOrdersQuerySchema), getMyOrders);

// Update order status (for future admin implementation)
router.put("/:id/status", validateParams(orderIdSchema), validate(updateOrderStatusSchema), updateOrderStatus);

// Get order by ID
router.get("/:id", validateParams(orderIdSchema), getOrderById);

export default router;
