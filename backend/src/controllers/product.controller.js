import Product from "../models/Product.js";
import mongoose from "mongoose";

// GET /api/products?search=&category=&size=&minPrice=&maxPrice=&page=&limit=&sort=&inStock=
export const getProducts = async (req, res, next) => {
  try {
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
      
      // Validate price range
      if (minPrice && maxPrice && min > max) {
        return res.status(400).json({
          success: false,
          error: "minPrice cannot be greater than maxPrice",
        });
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
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid product ID format",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
