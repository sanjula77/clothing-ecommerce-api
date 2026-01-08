import User from "../models/User.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: "1d" });
};

// @desc   Register new user
// @route  POST /api/auth/register
// @access Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, guestCart } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const user = await User.create({ name, email, password });

    // Merge guest cart if provided
    if (guestCart && Array.isArray(guestCart.items) && guestCart.items.length > 0) {
      try {
        let cart = await Cart.findOne({ user: user._id });
        if (!cart) {
          cart = await Cart.create({ user: user._id, items: [] });
        }

        for (const guestItem of guestCart.items) {
          if (!guestItem.product || !guestItem.size || !guestItem.quantity) {
            continue;
          }

          if (!mongoose.Types.ObjectId.isValid(guestItem.product)) {
            continue;
          }

          const product = await Product.findById(guestItem.product);
          if (!product || !product.inStock || !product.sizes.includes(guestItem.size)) {
            continue;
          }

          const existingItem = cart.items.find(
            (item) =>
              item.product.toString() === guestItem.product.toString() &&
              item.size === guestItem.size
          );

          if (existingItem) {
            const newQuantity = existingItem.quantity + guestItem.quantity;
            if (product.stock >= newQuantity) {
              existingItem.quantity = newQuantity;
            } else {
              existingItem.quantity = product.stock;
            }
          } else {
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
      } catch (cartError) {
        // Don't fail registration if cart merge fails
        console.error("Cart merge error during registration:", cartError);
      }
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Login user
// @route  POST /api/auth/login
// @access Public
export const login = async (req, res, next) => {
  try {
    const { email, password, guestCart } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // Merge guest cart if provided
    if (guestCart && Array.isArray(guestCart.items) && guestCart.items.length > 0) {
      try {
        let cart = await Cart.findOne({ user: user._id });
        if (!cart) {
          cart = await Cart.create({ user: user._id, items: [] });
        }

        for (const guestItem of guestCart.items) {
          if (!guestItem.product || !guestItem.size || !guestItem.quantity) {
            continue;
          }

          if (!mongoose.Types.ObjectId.isValid(guestItem.product)) {
            continue;
          }

          const product = await Product.findById(guestItem.product);
          if (!product || !product.inStock || !product.sizes.includes(guestItem.size)) {
            continue;
          }

          const existingItem = cart.items.find(
            (item) =>
              item.product.toString() === guestItem.product.toString() &&
              item.size === guestItem.size
          );

          if (existingItem) {
            const newQuantity = existingItem.quantity + guestItem.quantity;
            if (product.stock >= newQuantity) {
              existingItem.quantity = newQuantity;
            } else {
              existingItem.quantity = product.stock;
            }
          } else {
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
      } catch (cartError) {
        // Don't fail login if cart merge fails
        console.error("Cart merge error during login:", cartError);
      }
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get current user
// @route  GET /api/auth/me
// @access Private
export const getMe = async (req, res, next) => {
  try {
    // User is already fetched in protect middleware without password
    res.json(req.user);
  } catch (error) {
    next(error);
  }
};
