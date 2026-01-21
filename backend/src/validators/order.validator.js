import Joi from "joi";

// Create order validation schema
export const createOrderSchema = Joi.object({
  shippingAddress: Joi.object({
    street: Joi.string().trim().min(5).max(200).required().messages({
      "string.empty": "Street address is required",
      "string.min": "Street address must be at least 5 characters",
      "string.max": "Street address cannot exceed 200 characters",
    }),
    city: Joi.string().trim().min(2).max(100).required().messages({
      "string.empty": "City is required",
      "string.min": "City must be at least 2 characters",
    }),
    state: Joi.string().trim().min(2).max(100).required().messages({
      "string.empty": "State is required",
    }),
    zipCode: Joi.string()
      .trim()
      .pattern(/^[0-9A-Za-z\s-]{3,10}$/)
      .required()
      .messages({
        "string.empty": "Zip code is required",
        "string.pattern.base": "Invalid zip code format",
      }),
    country: Joi.string().trim().min(2).max(100).required().messages({
      "string.empty": "Country is required",
    }),
  }).required(),
  paymentMethod: Joi.string()
    .valid("CASH_ON_DELIVERY", "CREDIT_CARD", "DEBIT_CARD", "PAYPAL")
    .required()
    .messages({
      "any.only":
        "Payment method must be one of: CASH_ON_DELIVERY, CREDIT_CARD, DEBIT_CARD, PAYPAL",
      "string.empty": "Payment method is required",
    }),
});

// Update order status validation schema
export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid("PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED")
    .required()
    .messages({
      "any.only":
        "Status must be one of: PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED",
      "string.empty": "Status is required",
    }),
});

// Order ID validation (for params)
export const orderIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "Order ID is required",
      "string.pattern.base": "Invalid order ID format",
    }),
});

// Query parameters for getMyOrders
export const getMyOrdersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string()
    .valid("PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED")
    .optional(),
});
