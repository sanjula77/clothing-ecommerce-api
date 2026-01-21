import Joi from "joi";

// Add to cart validation schema
export const addToCartSchema = Joi.object({
  productId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "Product ID is required",
      "string.pattern.base": "Invalid product ID format",
    }),
  size: Joi.string().valid("S", "M", "L", "XL").required().messages({
    "any.only": "Size must be S, M, L, or XL",
    "string.empty": "Size is required",
  }),
  quantity: Joi.number().integer().min(1).max(100).required().messages({
    "number.base": "Quantity must be a number",
    "number.integer": "Quantity must be an integer",
    "number.min": "Quantity must be at least 1",
    "number.max": "Quantity cannot exceed 100",
  }),
});

// Update cart item validation schema
export const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).max(100).required().messages({
    "number.base": "Quantity must be a number",
    "number.integer": "Quantity must be an integer",
    "number.min": "Quantity must be at least 1",
    "number.max": "Quantity cannot exceed 100",
  }),
});

// Merge cart validation schema
export const mergeCartSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        product: Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .required()
          .messages({
            "string.empty": "Product ID is required",
            "string.pattern.base": "Invalid product ID format",
          }),
        size: Joi.string().valid("S", "M", "L", "XL").required().messages({
          "any.only": "Size must be S, M, L, or XL",
          "string.empty": "Size is required",
        }),
        quantity: Joi.number().integer().min(1).max(100).required().messages({
          "number.base": "Quantity must be a number",
          "number.integer": "Quantity must be an integer",
          "number.min": "Quantity must be at least 1",
          "number.max": "Quantity cannot exceed 100",
        }),
      })
    )
    .optional()
    .default([])
    .messages({
      "any.required": "Items array is required",
    }),
});

// Guest cart validation schema
export const guestCartSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        product: Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .required(),
        size: Joi.string().valid("S", "M", "L", "XL").required(),
        quantity: Joi.number().integer().min(1).max(100).required(),
      })
    )
    .optional()
    .default([]),
});

// Cart item ID validation (for params)
export const cartItemIdSchema = Joi.object({
  itemId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "Item ID is required",
      "string.pattern.base": "Invalid item ID format",
    }),
});
