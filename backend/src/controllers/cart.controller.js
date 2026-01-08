import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

// ============================================
// GUEST CART (No Authentication Required)
// ============================================

// @desc   Get guest cart (validate items)
// @route  POST /api/cart/guest/validate
// @access Public
export const validateGuestCart = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: "Items must be an array",
      });
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
  } catch (error) {
    next(error);
  }
};

// Helper function to populate cart with product details
const populateCart = async (cart) => {
  await cart.populate({
    path: "items.product",
    select: "name price imageUrl category sizes stock inStock",
  });

  // Calculate subtotal for each item
  cart.items = cart.items.map((item) => {
    const product = item.product;
    const subtotal = product ? product.price * item.quantity : 0;
    return {
      ...item.toObject(),
      subtotal,
    };
  });

  // Calculate total
  const total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    ...cart.toObject(),
    total,
    totalItems,
  };
};

// @desc   Get user's cart
// @route  GET /api/cart
// @access Private
export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    const cartWithDetails = await populateCart(cart);

    res.json({
      success: true,
      data: cartWithDetails,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Add item to cart
// @route  POST /api/cart
// @access Private
export const addToCart = async (req, res, next) => {
  try {
    const { productId, size, quantity } = req.body;

    // Validation
    if (!productId || !size || !quantity) {
      return res.status(400).json({
        success: false,
        error: "productId, size, and quantity are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid product ID format",
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        error: "Quantity must be a positive integer",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    if (!product.inStock) {
      return res.status(400).json({
        success: false,
        error: "Product is out of stock",
      });
    }

    if (!product.sizes.includes(size)) {
      return res.status(400).json({
        success: false,
        error: "Invalid size for this product",
      });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        error: `Only ${product.stock} items available in stock`,
      });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [{ product: productId, size, quantity }],
      });
    } else {
      const existingItem = cart.items.find(
        (item) =>
          item.product.toString() === productId && item.size === size
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        // Check if new total quantity exceeds stock
        if (product.stock < newQuantity) {
          return res.status(400).json({
            success: false,
            error: `Cannot add ${quantity} items. Only ${product.stock - existingItem.quantity} more available in stock`,
          });
        }
        existingItem.quantity = newQuantity;
      } else {
        cart.items.push({ product: productId, size, quantity });
      }

      await cart.save();
    }

    const cartWithDetails = await populateCart(cart);

    res.status(200).json({
      success: true,
      data: cartWithDetails,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Update cart item quantity
// @route  PUT /api/cart/:itemId
// @access Private
export const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;

    if (!quantity || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        error: "Quantity must be a positive integer",
      });
    }

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: "Cart not found",
      });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: "Cart item not found",
      });
    }

    // Check stock availability
    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        error: `Only ${product.stock} items available in stock`,
      });
    }

    item.quantity = quantity;
    await cart.save();

    const cartWithDetails = await populateCart(cart);

    res.json({
      success: true,
      data: cartWithDetails,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Remove item from cart
// @route  DELETE /api/cart/:itemId
// @access Private
export const removeCartItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: "Cart not found",
      });
    }

    const itemExists = cart.items.some(
      (item) => item._id.toString() === req.params.itemId
    );

    if (!itemExists) {
      return res.status(404).json({
        success: false,
        error: "Cart item not found",
      });
    }

    cart.items = cart.items.filter(
      (item) => item._id.toString() !== req.params.itemId
    );

    await cart.save();

    const cartWithDetails = await populateCart(cart);

    res.json({
      success: true,
      data: cartWithDetails,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Clear entire cart
// @route  DELETE /api/cart
// @access Private
export const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: "Cart not found",
      });
    }

    cart.items = [];
    await cart.save();

    const cartWithDetails = await populateCart(cart);

    res.json({
      success: true,
      data: cartWithDetails,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Merge guest cart with user cart
// @route  POST /api/cart/merge
// @access Private
export const mergeCart = async (req, res, next) => {
  try {
    const { items } = req.body; // guest cart items

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: "Items must be an array",
      });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
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

    const cartWithDetails = await populateCart(cart);

    res.json({
      success: true,
      data: cartWithDetails,
      message: "Cart merged successfully",
    });
  } catch (error) {
    next(error);
  }
};

