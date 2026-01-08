import express from "express";
import {
  validateGuestCart,
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeCart,
} from "../controllers/cart.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Guest cart endpoints (no authentication required)
router.post("/guest/validate", validateGuestCart);

// All other cart routes require authentication
router.use(protect);

// Get user's cart (must come before /merge route)
router.get("/", getCart);

// Add item to cart
router.post("/", addToCart);

// Merge guest cart with user cart
router.post("/merge", mergeCart);

// Update cart item quantity
router.put("/:itemId", updateCartItem);

// Remove item from cart
router.delete("/:itemId", removeCartItem);

// Clear entire cart
router.delete("/", clearCart);

export default router;
