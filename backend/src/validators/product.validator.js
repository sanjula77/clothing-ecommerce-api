import Joi from "joi";

// Product query parameters validation
export const getProductsQuerySchema = Joi.object({
  search: Joi.string().trim().max(100).optional(),
  category: Joi.string().valid("Men", "Women", "Kids").optional(),
  size: Joi.string().valid("S", "M", "L", "XL").optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  inStock: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string()
    .pattern(/^-?(price|name|createdAt)(,-?(price|name|createdAt))*$/)
    .optional()
    .default("-createdAt"),
}).custom((value, helpers) => {
  // Custom validation: minPrice cannot be greater than maxPrice
  if (value.minPrice && value.maxPrice && value.minPrice > value.maxPrice) {
    return helpers.error("any.custom", {
      message: "minPrice cannot be greater than maxPrice",
    });
  }
  return value;
});

// Product ID validation (for params)
export const productIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "Product ID is required",
      "string.pattern.base": "Invalid product ID format",
    }),
});

