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
import { validate, validateParams } from "../middleware/validate.js";
import {
  guestCartSchema,
  addToCartSchema,
  updateCartItemSchema,
  mergeCartSchema,
  cartItemIdSchema,
} from "../validators/cart.validator.js";

const router = express.Router();

// Guest cart endpoints (no authentication required)
router.post("/guest/validate", validate(guestCartSchema), validateGuestCart);

// All other cart routes require authentication
router.use(protect);

// Get user's cart (must come before /merge route)
router.get("/", getCart);

// Add item to cart
router.post("/", validate(addToCartSchema), addToCart);

// Merge guest cart with user cart
router.post("/merge", validate(mergeCartSchema), mergeCart);

// Update cart item quantity
router.put(
  "/:itemId",
  validateParams(cartItemIdSchema),
  validate(updateCartItemSchema),
  updateCartItem
);

// Remove item from cart
router.delete("/:itemId", validateParams(cartItemIdSchema), removeCartItem);

// Clear entire cart
router.delete("/", clearCart);

export default router;
