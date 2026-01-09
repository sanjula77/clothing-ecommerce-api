import Product from "../models/Product.js";
import mongoose from "mongoose";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

// GET /api/products?search=&category=&size=&minPrice=&maxPrice=&page=&limit=&sort=&inStock=
export const getProducts = asyncHandler(async (req, res, next) => {
    const {
      search,
      category,
      size,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sort = "-createdAt",
      inStock,
    } = req.query;

    // Build query object
    const query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Category filter
    if (category) {
      const validCategories = ["Men", "Women", "Kids"];
      if (validCategories.includes(category)) {
        query.category = category;
      }
    }

    // Size filter (use $in for array matching)
    if (size) {
      const validSizes = ["S", "M", "L", "XL"];
      if (validSizes.includes(size)) {
        query.sizes = { $in: [size] };
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      const min = Number(minPrice);
      const max = Number(maxPrice);
      
      if (minPrice && !isNaN(min) && min >= 0) {
        query.price.$gte = min;
      }
      if (maxPrice && !isNaN(max) && max >= 0) {
        query.price.$lte = max;
      }
      
      // Validate price range (Joi also validates this, but keeping as backup)
      if (minPrice && maxPrice && min > max) {
        throw new AppError("minPrice cannot be greater than maxPrice", 400);
      }
    }

    // Stock filter
    if (inStock !== undefined) {
      query.inStock = inStock === "true" || inStock === true;
    }

    // Pagination validation
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100 items per page

    // Sort validation
    const sortFields = sort.split(",").map((field) => {
      const direction = field.startsWith("-") ? -1 : 1;
      const fieldName = field.replace(/^-/, "");
      return [fieldName, direction];
    });

    // Get total count
    const total = await Product.countDocuments(query);

    // Calculate pagination
    const totalPages = Math.ceil(total / limitNum);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const products = await Product.find(query)
      .sort(sortFields)
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
});

// GET /api/products/:id
export const getProductById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Joi validation already handled ObjectId format, but keeping as backup
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid product ID format", 400);
  }

  const product = await Product.findById(id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  res.json({
    success: true,
    data: product,
  });
});
