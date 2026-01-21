import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { asyncHandler } from "./asyncHandler.js";
import { AppError } from "../utils/AppError.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      // Use process.env.JWT_SECRET directly to ensure we get the current value
      // (important for tests where JWT_SECRET is set after module import)
      const jwtSecret = process.env.JWT_SECRET || env.JWT_SECRET;
      const decoded = jwt.verify(token, jwtSecret);

      // Ensure we're using the correct ID format (Mongoose handles string/ObjectId conversion)
      // Try both string and ObjectId formats to be safe
      let userId = decoded.id;
      if (typeof userId === "string" && userId.length === 24) {
        // Valid ObjectId string, Mongoose will handle conversion
        req.user = await User.findById(userId).select("-password");
      } else {
        // Fallback: try to find by any means
        req.user = await User.findById(userId).select("-password");
      }

      if (!req.user) {
        // In test mode, provide more debugging info
        if (process.env.NODE_ENV === "test") {
          console.error(
            `[AUTH DEBUG] User not found for ID: ${decoded.id}, Type: ${typeof decoded.id}`
          );
          // Try to find any users in the database
          const allUsers = await User.find({});
          console.error(`[AUTH DEBUG] Total users in DB: ${allUsers.length}`);
          if (allUsers.length > 0) {
            console.error(
              `[AUTH DEBUG] Sample user IDs: ${allUsers
                .slice(0, 3)
                .map((u) => u._id.toString())
                .join(", ")}`
            );
          }
        }
        throw new AppError("User not found", 401);
      }

      next();
    } catch (error) {
      // JWT errors (invalid token, expired) are caught here
      if (error instanceof AppError) {
        throw error; // Re-throw AppError
      }
      // JWT verification errors
      throw new AppError("Not authorized, token failed", 401);
    }
  } else {
    throw new AppError("Not authorized, no token", 401);
  }
});
