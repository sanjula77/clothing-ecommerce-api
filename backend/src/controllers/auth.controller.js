import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: "1d" });
};

// @desc   Register new user
// @route  POST /api/auth/register
// @access Public
export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("Email already in use", 400);
  }

  const user = await User.create({ name, email, password });

  // Cart merge is now handled separately via POST /api/cart/merge after registration
  // This ensures single source of truth for cart merging logic

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    },
  });
});

// @desc   Login user
// @route  POST /api/auth/login
// @access Public
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  // Cart merge is now handled separately via POST /api/cart/merge after login
  // This ensures single source of truth for cart merging logic

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    },
  });
});

// @desc   Get current user
// @route  GET /api/auth/me
// @access Private
export const getMe = asyncHandler(async (req, res, next) => {
  // User is already fetched in protect middleware without password
  res.json({
    success: true,
    data: req.user,
  });
});
