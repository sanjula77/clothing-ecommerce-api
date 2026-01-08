import User from "../models/User.js";
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
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const user = await User.create({ name, email, password });

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
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

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
