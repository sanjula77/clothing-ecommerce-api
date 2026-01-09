import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

// ============================================
// GUEST CART (No Authentication Required)
// ============================================

// @desc   Get guest cart (validate items)
// @route  POST /api/cart/guest/validate
// @access Public
export const validateGuestCart = asyncHandler(async (req, res, next) => {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      throw new AppError("Items must be an array", 400);
    }

    const validatedItems = [];

    for (const item of items) {
      if (!item.product || !item.size || !item.quantity) {
        continue;
      }

      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        continue;
      }

      const product = await Product.findById(item.product);
      if (!product || !product.inStock || !product.sizes.includes(item.size)) {
        continue;
      }

      // Ensure quantity doesn't exceed stock
      const validQuantity = Math.min(item.quantity, product.stock);
      if (validQuantity > 0) {
        validatedItems.push({
          product: item.product,
          size: item.size,
          quantity: validQuantity,
        });
      }
    }

  res.json({
    success: true,
    data: validatedItems,
  });
});

// Helper function to populate cart with product details
const populateCart = async (cart) => {
  // Ensure cart is a Mongoose document (not a plain object)
  if (!cart.populate) {
    cart = await Cart.findById(cart._id || cart.id);
  }
  
  await cart.populate({
    path: "items.product",
    select: "name price imageUrl category sizes stock inStock",
  });

  // Filter out items with deleted products and calculate subtotal
  const itemsWithSubtotals = cart.items
    .filter((item) => item.product !== null && item.product !== undefined)
    .map((item) => {
      const product = item.product;
      // Ensure product has a valid price (defensive check)
      const productPrice = product && typeof product.price === 'number' && product.price > 0 
        ? product.price 
        : (product?.price || 0);
      const quantity = item.quantity || 0;
      const subtotal = productPrice * quantity;
      
      return {
        ...item.toObject(),
        subtotal,
      };
    });

  // Calculate total from items with subtotals
  const total = itemsWithSubtotals.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const totalItems = itemsWithSubtotals.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Build result object - use cart.toObject() for base properties, then override items
  const cartObject = cart.toObject();
  const result = {
    ...cartObject,
    items: itemsWithSubtotals, // Use the modified items array with subtotals
    total,
    totalItems,
  };

  return result;
};

// @desc   Get user's cart
// @route  GET /api/cart
// @access Private
export const getCart = asyncHandler(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }

  const cartWithDetails = await populateCart(cart);

  res.json({
    success: true,
    data: cartWithDetails,
  });
});

// @desc   Add item to cart
// @route  POST /api/cart
// @access Private
export const addToCart = asyncHandler(async (req, res, next) => {
  const { productId, size, quantity } = req.body;

  // Joi validation already handled productId, size, quantity format
  // Now check business logic
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (!product.inStock) {
    throw new AppError("Product is out of stock", 400);
  }

  if (!product.sizes.includes(size)) {
    throw new AppError("Invalid size for this product", 400);
  }

  // Check stock availability
  if (product.stock < quantity) {
    throw new AppError(`Only ${product.stock} items available in stock`, 400);
  }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [{ product: productId, size, quantity }],
      });
      // Reload newly created cart to ensure it's a fresh Mongoose document
      cart = await Cart.findById(cart._id);
    } else {
      const existingItem = cart.items.find(
        (item) =>
          item.product.toString() === productId && item.size === size
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        // Check if new total quantity exceeds stock
        if (product.stock < newQuantity) {
          throw new AppError(
            `Cannot add ${quantity} items. Only ${product.stock - existingItem.quantity} more available in stock`,
            400
          );
        }
        existingItem.quantity = newQuantity;
      } else {
        cart.items.push({ product: productId, size, quantity });
      }

      await cart.save();
      // Reload cart from database to ensure we have the latest data before populating
      cart = await Cart.findById(cart._id);
    }

    const cartWithDetails = await populateCart(cart);

  res.status(200).json({
    success: true,
    data: cartWithDetails,
  });
});

// @desc   Update cart item quantity
// @route  PUT /api/cart/:itemId
// @access Private
export const updateCartItem = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;

  // Joi validation already handled quantity format
  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  const item = cart.items.id(req.params.itemId);
  if (!item) {
    throw new AppError("Cart item not found", 404);
  }

  // Check stock availability
  const product = await Product.findById(item.product);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // Calculate current quantity of this product+size combination in cart (excluding the item being updated)
  const currentQuantityInCart = cart.items
    .filter(
      (cartItem) =>
        cartItem._id.toString() !== req.params.itemId &&
        cartItem.product.toString() === item.product.toString() &&
        cartItem.size === item.size
    )
    .reduce((sum, cartItem) => sum + cartItem.quantity, 0);

  // Available stock = total stock - quantity already in cart (excluding current item)
  const availableStock = product.stock - currentQuantityInCart;

  if (availableStock < quantity) {
    throw new AppError(
      `Only ${availableStock} items available in stock (${product.stock} total, ${currentQuantityInCart} already in cart)`,
      400
    );
  }

    item.quantity = quantity;
    await cart.save();

    // Reload cart from database to ensure we have the latest data before populating
    const refreshedCart = await Cart.findById(cart._id);
    const cartWithDetails = await populateCart(refreshedCart);

  res.json({
    success: true,
    data: cartWithDetails,
  });
});

// @desc   Remove item from cart
// @route  DELETE /api/cart/:itemId
// @access Private
export const removeCartItem = asyncHandler(async (req, res, next) => {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      throw new AppError("Cart not found", 404);
    }

    const itemExists = cart.items.some(
      (item) => item._id.toString() === req.params.itemId
    );

    if (!itemExists) {
      throw new AppError("Cart item not found", 404);
    }

    cart.items = cart.items.filter(
      (item) => item._id.toString() !== req.params.itemId
    );

    await cart.save();

    // Reload cart from database to ensure we have the latest data before populating
    const refreshedCart = await Cart.findById(cart._id);
    const cartWithDetails = await populateCart(refreshedCart);

  res.json({
    success: true,
    data: cartWithDetails,
  });
});

// @desc   Clear entire cart
// @route  DELETE /api/cart
// @access Private
export const clearCart = asyncHandler(async (req, res, next) => {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      throw new AppError("Cart not found", 404);
    }

    cart.items = [];
    await cart.save();

    // Reload cart from database to ensure we have the latest data before populating
    const refreshedCart = await Cart.findById(cart._id);
    const cartWithDetails = await populateCart(refreshedCart);

  res.json({
    success: true,
    data: cartWithDetails,
    message: "Cart cleared successfully",
  });
});

// @desc   Merge guest cart with user cart
// @route  POST /api/cart/merge
// @access Private
export const mergeCart = asyncHandler(async (req, res, next) => {
    const { items } = req.body; // guest cart items

    if (!Array.isArray(items)) {
      throw new AppError("Items must be an array", 400);
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    // If no items to merge, just return existing cart
    if (items.length === 0) {
      const cartWithDetails = await populateCart(cart);
      return res.json({
        success: true,
        data: cartWithDetails,
        message: "Cart merged successfully",
      });
    }

    // Validate and merge each guest item
    for (const guestItem of items) {
      if (!guestItem.product || !guestItem.size || !guestItem.quantity) {
        continue; // Skip invalid items
      }

      if (!mongoose.Types.ObjectId.isValid(guestItem.product)) {
        continue; // Skip invalid product IDs
      }

      // Verify product exists and is in stock
      const product = await Product.findById(guestItem.product);
      if (!product || !product.inStock || !product.sizes.includes(guestItem.size)) {
        continue; // Skip invalid products
      }

      const existingItem = cart.items.find(
        (item) =>
          item.product.toString() === guestItem.product.toString() &&
          item.size === guestItem.size
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + guestItem.quantity;
        // Check stock availability
        if (product.stock >= newQuantity) {
          existingItem.quantity = newQuantity;
        } else {
          // Set to max available
          existingItem.quantity = product.stock;
        }
      } else {
        // Check stock before adding
        const quantityToAdd = Math.min(guestItem.quantity, product.stock);
        if (quantityToAdd > 0) {
          cart.items.push({
            product: guestItem.product,
            size: guestItem.size,
            quantity: quantityToAdd,
          });
        }
      }
    }

    await cart.save();

    // Reload cart from database to ensure we have the latest data before populating
    const refreshedCart = await Cart.findById(cart._id);
    const cartWithDetails = await populateCart(refreshedCart);

  res.json({
    success: true,
    data: cartWithDetails,
    message: "Cart merged successfully",
  });
});

